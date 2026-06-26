import {
  DistanceTimePoint,
  OverviewSummary,
  RiskScenario,
  SceneFilterSummary,
  ScenarioOrderSample,
  TimePeriodSummary,
  TrafficDensitySummary,
  TrafficSegmentSummary,
  WeatherImpactSummary,
  WeatherTrafficSummary
} from '../types/data';
import {
  mockDistanceTimeSample,
  mockOverview,
  mockRiskScenarios,
  mockScenarioOrders,
  mockTimePeriods,
  mockTrafficDensity,
  mockTrafficSegments,
  mockWeatherImpact,
  mockWeatherTraffic
} from '../data/mockFallbacks';

const DATA_BASE_PATH = '/data';
function isTrafficDensity(value: string | null | undefined): value is TrafficDensitySummary['traffic_density'] {
  return ['Low', 'Medium', 'High', 'Jam'].includes(value as TrafficDensitySummary['traffic_density']);
}

async function fetchJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${DATA_BASE_PATH}/${fileName}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[FoodETA] Failed to load ${fileName}, using mock fallback.`, error);
    return fallback;
  }
}

function labelPart(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

function buildScenarioLabel(scenario: RiskScenario): string {
  return [
    labelPart(scenario.weather, '未知天气'),
    labelPart(scenario.traffic_density, '未知交通'),
    labelPart(scenario.time_period, '未知时段'),
    labelPart(scenario.vehicle_type, '未知载具')
  ].join(' · ');
}

function normalizeRate(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  if (value > 1) return value / 100;
  if (value < 0) return 0;
  return value;
}

function normalizeDensityRow(row: TrafficDensitySummary): TrafficDensitySummary {
  return {
    ...row,
    label: row.label ?? row.traffic_density,
    delay_rate: normalizeRate(row.delay_rate) ?? row.delay_rate,
    risk_score: normalizeRate(row.risk_score) ?? row.risk_score
  };
}

function weightedAverage(total: number, weightedValue: number, fallback: number): number {
  return total > 0 ? weightedValue / total : fallback;
}

function aggregateTrafficDensity(rows: WeatherTrafficSummary[]): TrafficDensitySummary[] {
  const grouped = new Map<TrafficDensitySummary['traffic_density'], {
    order_count: number;
    duration: number;
    delay: number;
    risk: number;
    distance: number;
    distanceWeight: number;
  }>();

  rows.forEach((row) => {
    if (!isTrafficDensity(row.traffic_density)) return;
    const orderCount = Math.max(0, row.order_count ?? 0);
    const weight = orderCount || 1;
    const current = grouped.get(row.traffic_density) ?? {
      order_count: 0,
      duration: 0,
      delay: 0,
      risk: 0,
      distance: 0,
      distanceWeight: 0
    };
    current.order_count += orderCount;
    current.duration += (row.avg_delivery_duration_min ?? 0) * weight;
    current.delay += (normalizeRate(row.delay_rate) ?? 0) * weight;
    current.risk += (normalizeRate(row.risk_score) ?? normalizeRate(row.delay_rate) ?? 0) * weight;
    if (typeof row.avg_distance_km === 'number' && Number.isFinite(row.avg_distance_km)) {
      current.distance += row.avg_distance_km * weight;
      current.distanceWeight += weight;
    }
    grouped.set(row.traffic_density, current);
  });

  return TRAFFIC_DENSITY_ORDER.map((density) => {
    const aggregate = grouped.get(density);
    const fallback = mockTrafficDensity.find((row) => row.traffic_density === density) ?? mockTrafficDensity[0];
    if (!aggregate || aggregate.order_count <= 0) return fallback;

    const total = aggregate.order_count;
    return {
      traffic_density: density,
      label: density,
      order_count: total,
      avg_delivery_duration_min: weightedAverage(total, aggregate.duration, fallback.avg_delivery_duration_min),
      avg_distance_km: aggregate.distanceWeight > 0 ? aggregate.distance / aggregate.distanceWeight : fallback.avg_distance_km,
      delay_rate: weightedAverage(total, aggregate.delay, fallback.delay_rate),
      risk_score: weightedAverage(total, aggregate.risk, fallback.risk_score)
    };
  });
}

function normalizeRiskScenario(scenario: RiskScenario): RiskScenario {
  return {
    ...scenario,
    label: scenario.label && scenario.label.trim() ? scenario.label : buildScenarioLabel(scenario),
    delay_rate: normalizeRate(scenario.delay_rate) ?? scenario.delay_rate,
    multiple_delivery_rate: normalizeRate(scenario.multiple_delivery_rate)
  };
}

export function loadRiskScenarioSummary(): Promise<RiskScenario[]> {
  return fetchJson<RiskScenario[]>('risk_scenario_summary.json', mockRiskScenarios).then((scenarios) =>
    scenarios.map(normalizeRiskScenario)
  );
}

export function loadScenarioOrdersSample(): Promise<ScenarioOrderSample[]> {
  return fetchJson<ScenarioOrderSample[]>('scenario_orders_sample.json', mockScenarioOrders);
}

export function loadDistanceTimeSample(): Promise<DistanceTimePoint[]> {
  return fetchJson<DistanceTimePoint[]>('distance_time_sample.json', mockDistanceTimeSample);
}

export function loadScenarioDistanceTimePoints(): Promise<DistanceTimePoint[]> {
  return fetchJson<DistanceTimePoint[]>('scenario_distance_time_points.json', mockDistanceTimeSample);
}

export function loadTimePeriodSummary(): Promise<TimePeriodSummary[]> {
  return fetchJson<TimePeriodSummary[]>('time_period_summary.json', mockTimePeriods);
}

export function loadWeatherTrafficSummary(): Promise<WeatherTrafficSummary[]> {
  return fetchJson<WeatherTrafficSummary[]>('weather_traffic_summary.json', mockWeatherTraffic);
}

export function loadOverviewSummary(): Promise<OverviewSummary> {
  return fetchJson<OverviewSummary>('overview_summary.json', mockOverview);
}

export function loadWeatherImpactSummary(): Promise<WeatherImpactSummary[]> {
  return fetchJson<WeatherImpactSummary[]>('weather_impact_summary.json', mockWeatherImpact);
}

export function loadSceneFilterSummary(): Promise<SceneFilterSummary[]> {
  return fetchJson<SceneFilterSummary[]>('scene_filter_summary.json', []);
}

export function loadTrafficSegmentSummary(): Promise<TrafficSegmentSummary[]> {
  return fetchJson<TrafficSegmentSummary[]>('traffic_segment_summary.json', mockTrafficSegments);
}

export async function loadTrafficDensitySummary(): Promise<TrafficDensitySummary[]> {
  const direct = await fetchJson<TrafficDensitySummary[] | null>('traffic_density_summary.json', null);
  if (Array.isArray(direct) && direct.length) {
    const byDensity = new Map(direct.map((row) => [row.traffic_density, normalizeDensityRow(row)]));
    return TRAFFIC_DENSITY_ORDER.map((density) => byDensity.get(density) ?? mockTrafficDensity.find((row) => row.traffic_density === density)!);
  }

  const weatherTrafficRows = await loadWeatherTrafficSummary();
  return aggregateTrafficDensity(weatherTrafficRows).map(normalizeDensityRow);
}

const TRAFFIC_DENSITY_ORDER: TrafficDensitySummary['traffic_density'][] = ['Low', 'Medium', 'High', 'Jam'];

function matchesSelected(value: string | null | undefined, selected: string) {
  return selected === 'All' || value === selected;
}

export async function getWeatherImpact(weather: string) {
  const rows = await loadWeatherImpactSummary();
  return rows.find((row) => row.weather === weather) ?? null;
}

export async function getWeatherTrafficRows(weather: string) {
  const rows = await loadWeatherTrafficSummary();
  return rows.filter((row) => matchesSelected(row.weather, weather));
}

export async function getWeatherTimeRows(weather: string) {
  const sceneRows = await loadSceneFilterSummary();
  const weatherRows = sceneRows.filter((row) => matchesSelected(row.weather, weather));
  if (weatherRows.length) {
    return weatherRows;
  }
  return loadTimePeriodSummary();
}

export async function getWeatherVehicleRows(weather: string) {
  const points = await loadScenarioDistanceTimePoints();
  const rows = points.filter((row) => matchesSelected(row.weather, weather));
  const grouped = new Map<string, {
    order_count: number;
    duration: number;
    distance: number;
    delayed_orders: number;
  }>();

  rows.forEach((row) => {
    const vehicle = row.vehicle_type ?? 'Unknown';
    const current = grouped.get(vehicle) ?? { order_count: 0, duration: 0, distance: 0, delayed_orders: 0 };
    current.order_count += 1;
    current.duration += row.delivery_duration_min;
    current.distance += row.distance_km;
    current.delayed_orders += row.is_delayed ? 1 : 0;
    grouped.set(vehicle, current);
  });

  return Array.from(grouped.entries())
    .map(([vehicle_type, row]) => ({
      vehicle_type,
      order_count: row.order_count,
      avg_delivery_duration_min: row.order_count > 0 ? row.duration / row.order_count : 0,
      avg_distance_km: row.order_count > 0 ? row.distance / row.order_count : 0,
      delay_rate: row.order_count > 0 ? row.delayed_orders / row.order_count : 0,
      delayed_orders: row.delayed_orders
    }))
    .sort((a, b) => b.order_count - a.order_count);
}

export async function getWeatherRiskScenarios(weather: string) {
  const rows = await loadRiskScenarioSummary();
  return rows.filter((row) => matchesSelected(row.weather, weather));
}

export async function getWeatherOrderPoints(weather: string) {
  const rows = await loadScenarioDistanceTimePoints();
  return rows.filter((row) => matchesSelected(row.weather, weather));
}
