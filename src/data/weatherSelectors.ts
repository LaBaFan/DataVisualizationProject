import {
  loadDistanceTimeSample,
  loadOverviewSummary,
  loadRiskScenarioSummary,
  loadSceneFilterSummary,
  loadWeatherImpactSummary,
  loadWeatherTrafficSummary
} from '../api/staticDataClient';
import {
  aggregateRiskScenarios,
  filterOrdersByTimePeriod,
  filterOrdersByWeather,
  getOrderScatterData,
  getOrderRiskScore,
  normalizeRate,
  TIME_ORDER,
  TRAFFIC_ORDER,
  VEHICLE_ORDER
} from '../sections/weather/weatherAnalytics';
import type {
  DistanceTimePoint,
  OverviewSummary,
  RiskScenario,
  SceneFilterSummary,
  WeatherImpactSummary,
  WeatherOrderSample,
  WeatherTrafficSummary,
  WeatherVehicleSummary
} from '../types/data';

function toOrderSample(point: WeatherOrderSample): WeatherOrderSample {
  return {
    ...point,
    risk_visual_score: point.risk_visual_score ?? point.risk_score ?? 0
  };
}

async function loadWeatherOrders(weather: string, timePeriod = 'All'): Promise<DistanceTimePoint[]> {
  const orders = await loadDistanceTimeSample();
  return filterOrdersByTimePeriod(filterOrdersByWeather(orders, weather), timePeriod);
}

function matchesSelected(value: string | null | undefined, selected: string) {
  return selected === 'All' || value === selected;
}

const sceneWeatherMap: Record<string, string> = {
  sunny: 'Sunny',
  fog: 'Fog',
  cloudy: 'Cloudy',
  stormy: 'Stormy',
  sandstorms: 'Sandstorms',
  windy: 'Windy'
};

function weatherFromScene(row: SceneFilterSummary) {
  return row.weather && row.weather !== 'All' ? row.weather : sceneWeatherMap[row.scene_id] ?? row.weather;
}

function weightedAverage(total: number, weightedValue: number) {
  return total > 0 ? weightedValue / total : 0;
}

function orderWeight(row: { order_count?: number | null }) {
  return Math.max(0, row.order_count ?? 0);
}

export interface WeatherOverviewSummaryPair {
  current: WeatherImpactSummary;
  baseline: WeatherImpactSummary;
}

export async function getWeatherOverviewSummary(weather: string): Promise<WeatherOverviewSummaryPair> {
  const [weatherRows, overview] = await Promise.all([
    loadWeatherImpactSummary(),
    loadOverviewSummary()
  ]);
  const current = weatherRows.find((row) => matchesSelected(row.weather, weather) && row.weather !== 'All') ?? weatherRows[0];
  const baseline: WeatherImpactSummary = {
    weather: 'All',
    order_count: overview.order_count ?? overview.valid_orders ?? overview.total_orders ?? 0,
    avg_delivery_duration_min: overview.avg_delivery_duration_min ?? 0,
    median_delivery_duration_min: overview.median_delivery_duration_min,
    p75_delivery_duration_min: overview.p75_delivery_duration_min,
    avg_distance_km: overview.avg_distance_km,
    delay_rate: overview.delay_rate ?? 0
  };

  return {
    current: current ?? baseline,
    baseline
  };
}

export async function getWeatherOrderSamples(weather: string, timePeriod = 'All'): Promise<WeatherOrderSample[]> {
  const rows = await loadWeatherOrders(weather, timePeriod);
  return getOrderScatterData(rows, 180).points.map(toOrderSample);
}

export async function getWeatherTrafficRows(weather: string): Promise<WeatherTrafficSummary[]> {
  const rows = await loadWeatherTrafficSummary();
  return rows
    .filter((row) => matchesSelected(row.weather, weather))
    .sort((a, b) => TRAFFIC_ORDER.indexOf(a.traffic_density ?? '') - TRAFFIC_ORDER.indexOf(b.traffic_density ?? ''));
}

export async function getWeatherTimeRows(weather: string): Promise<SceneFilterSummary[]> {
  const rows = await loadSceneFilterSummary();
  const normalizedRows = rows
    .map((row) => ({ ...row, weather: weatherFromScene(row) }))
    .filter((row) => matchesSelected(row.weather, weather) && row.time_period !== 'All');
  const overallRows = normalizedRows.filter((row) => row.scene_id === 'overall');
  const sourceRows = overallRows.length ? overallRows : normalizedRows;

  return sourceRows
    .sort((a, b) => TIME_ORDER.indexOf(a.time_period ?? '') - TIME_ORDER.indexOf(b.time_period ?? ''));
}

export async function getWeatherVehicleRows(weather: string): Promise<WeatherVehicleSummary[]> {
  const rows = await loadRiskScenarioSummary();
  const grouped = new Map<string, {
    order_count: number;
    duration: number;
    distance: number;
    delay: number;
    risk: number;
  }>();

  rows
    .filter((row) => matchesSelected(row.weather, weather) && row.vehicle_type)
    .forEach((row) => {
      const vehicle = row.vehicle_type ?? 'Unknown';
      const weight = orderWeight(row);
      if (weight <= 0) return;
      const current = grouped.get(vehicle) ?? {
        order_count: 0,
        duration: 0,
        distance: 0,
        delay: 0,
        risk: 0
      };
      current.order_count += weight;
      current.duration += row.avg_delivery_duration_min * weight;
      current.distance += (row.avg_distance_km ?? 0) * weight;
      current.delay += normalizeRate(row.delay_rate) * weight;
      current.risk += normalizeRate(row.risk_score) * weight;
      grouped.set(vehicle, current);
    });

  return Array.from(grouped.entries())
    .map(([vehicle_type, row]) => ({
      vehicle_type,
      weather,
      order_count: row.order_count,
      avg_delivery_duration_min: weightedAverage(row.order_count, row.duration),
      avg_distance_km: weightedAverage(row.order_count, row.distance),
      delay_rate: weightedAverage(row.order_count, row.delay),
      risk_score: weightedAverage(row.order_count, row.risk)
    }))
    .sort((a, b) => {
      const orderDelta = VEHICLE_ORDER.indexOf(a.vehicle_type) - VEHICLE_ORDER.indexOf(b.vehicle_type);
      return orderDelta || b.avg_delivery_duration_min - a.avg_delivery_duration_min;
    });
}

export async function getWeatherRiskScenarios(weather: string): Promise<RiskScenario[]> {
  const rows = await loadWeatherOrders(weather);
  return aggregateRiskScenarios(rows);
}

export async function getWeatherOutlierOrders(weather: string): Promise<WeatherOrderSample[]> {
  const rows = await loadWeatherOrders(weather);
  return getOrderScatterData(rows, rows.length).points
    .filter((row) => row.is_delayed || getOrderRiskScore(row as unknown as DistanceTimePoint) >= 0.66)
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0) || b.delivery_duration_min - a.delivery_duration_min)
    .slice(0, 24);
}
