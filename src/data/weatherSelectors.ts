import {
  loadRiskScenarioSummary,
  loadScenarioDistanceTimePoints,
  loadScenarioOrdersSample,
  loadSceneFilterSummary,
  loadWeatherTrafficSummary
} from '../api/staticDataClient';
import type {
  DistanceTimePoint,
  RiskScenario,
  ScenarioOrderSample,
  SceneFilterSummary,
  WeatherOrderSample,
  WeatherTrafficSummary,
  WeatherVehicleSummary
} from '../types/data';

const TRAFFIC_ORDER = ['Low', 'Medium', 'High', 'Jam'];
const TIME_ORDER = ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];
const ORDER_CHART_LIMIT = 180;

function isAll(value: string | null | undefined) {
  return !value || value === 'All';
}

function matches(value: string | null | undefined, selected: string | null | undefined) {
  return isAll(selected) || value === selected;
}

function normalizeRate(value: number | undefined | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : Math.max(0, value);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function visualRisk(point: Pick<DistanceTimePoint, 'delivery_duration_min' | 'distance_km' | 'is_delayed' | 'risk_score'>) {
  if (typeof point.risk_score === 'number' && Number.isFinite(point.risk_score)) return normalizeRate(point.risk_score);
  const durationPart = Math.min(1, Math.max(0, (point.delivery_duration_min - 18) / 34));
  const distancePart = Math.min(1, Math.max(0, point.distance_km / 18));
  return Math.min(1, durationPart * 0.56 + distancePart * 0.24 + (point.is_delayed ? 0.2 : 0));
}

function toOrderSample(point: DistanceTimePoint): WeatherOrderSample {
  const traffic = point.traffic_density ?? 'Unknown';
  const time = point.time_period ?? 'Unknown';
  const vehicle = point.vehicle_type ?? 'Unknown';
  const weather = point.weather ?? 'Unknown';
  return {
    id: `order-${point.order_id}`,
    order_id: point.order_id,
    scenario_id: point.scenario_id,
    x: 0,
    y: 0,
    city: point.city,
    weather,
    traffic_density: traffic,
    time_period: time,
    vehicle_type: vehicle,
    distance_km: point.distance_km,
    delivery_duration_min: point.delivery_duration_min,
    is_delayed: Boolean(point.is_delayed),
    risk_score: point.risk_score,
    risk_visual_score: visualRisk(point)
  };
}

function sampleRows(rows: DistanceTimePoint[]) {
  const sorted = [...rows].sort((a, b) => hashString(`${a.order_id}:${a.vehicle_type ?? ''}`) - hashString(`${b.order_id}:${b.vehicle_type ?? ''}`));
  if (sorted.length <= ORDER_CHART_LIMIT) return sorted;
  const target = ORDER_CHART_LIMIT;
  const step = sorted.length / target;
  const sampled: DistanceTimePoint[] = [];
  for (let i = 0; i < target; i += 1) {
    sampled.push(sorted[Math.floor(i * step)]);
  }
  return sampled;
}

function scenarioOrderToPoint(row: ScenarioOrderSample): DistanceTimePoint {
  return {
    order_id: row.order_id,
    scenario_id: row.scenario_id,
    distance_km: row.distance_km,
    delivery_duration_min: row.delivery_duration_min,
    weather: row.weather ?? null,
    traffic_density: row.traffic_density ?? null,
    vehicle_type: row.vehicle_type ?? null,
    delivery_person_ratings: row.delivery_person_ratings == null ? null : String(row.delivery_person_ratings),
    multiple_deliveries: row.multiple_deliveries == null ? null : String(row.multiple_deliveries),
    city: row.city ?? null,
    time_period: row.time_period ?? null,
    is_delayed: Boolean(row.is_delayed ?? (typeof row.delay_minutes === 'number' ? row.delay_minutes > 0 : false))
  };
}

export async function getWeatherOrderSamples(weather: string, timePeriod = 'All'): Promise<WeatherOrderSample[]> {
  const primary = await loadScenarioDistanceTimePoints();
  let rows = primary.filter((row) => matches(row.weather, weather) && matches(row.time_period, timePeriod));

  if (!rows.length) {
    const fallback = await loadScenarioOrdersSample();
    rows = fallback.map(scenarioOrderToPoint).filter((row) => matches(row.weather, weather) && matches(row.time_period, timePeriod));
  }

  return sampleRows(rows).map(toOrderSample);
}

export async function getWeatherTrafficRows(weather: string): Promise<WeatherTrafficSummary[]> {
  const rows = await loadWeatherTrafficSummary();
  return rows
    .filter((row) => matches(row.weather, weather))
    .sort((a, b) => TRAFFIC_ORDER.indexOf(a.traffic_density ?? '') - TRAFFIC_ORDER.indexOf(b.traffic_density ?? ''));
}

export async function getWeatherTimeRows(weather: string): Promise<SceneFilterSummary[]> {
  const rows = await loadSceneFilterSummary();
  const byTime = rows.filter((row) => matches(row.weather, weather) && row.time_period && row.time_period !== 'All');
  const grouped = new Map<string, {
    order_count: number;
    duration: number;
    distance: number;
    delay: number;
    risk: number;
    threshold: number;
    thresholdWeight: number;
  }>();

  byTime.forEach((row) => {
    const timePeriod = row.time_period ?? 'Unknown';
    const weight = Math.max(0, row.order_count ?? 0) || 1;
    const current = grouped.get(timePeriod) ?? {
      order_count: 0,
      duration: 0,
      distance: 0,
      delay: 0,
      risk: 0,
      threshold: 0,
      thresholdWeight: 0
    };
    current.order_count += row.order_count ?? 0;
    current.duration += (row.avg_delivery_duration_min ?? 0) * weight;
    current.distance += (row.avg_distance_km ?? 0) * weight;
    current.delay += normalizeRate(row.delay_rate) * weight;
    current.risk += normalizeRate(row.risk_score) * weight;
    if (typeof row.delay_threshold_min === 'number') {
      current.threshold += row.delay_threshold_min * weight;
      current.thresholdWeight += weight;
    }
    grouped.set(timePeriod, current);
  });

  return Array.from(grouped.entries())
    .map(([time_period, row]) => {
      const weight = Math.max(1, row.order_count);
      return {
        scene_id: 'weather_time_projection',
        weather: isAll(weather) ? 'All' : weather,
        time_period,
        order_count: row.order_count,
        avg_delivery_duration_min: row.duration / weight,
        avg_distance_km: row.distance / weight,
        delay_rate: row.delay / weight,
        risk_score: row.risk / weight,
        delay_threshold_min: row.thresholdWeight ? row.threshold / row.thresholdWeight : 32
      };
    })
    .sort((a, b) => TIME_ORDER.indexOf(a.time_period ?? '') - TIME_ORDER.indexOf(b.time_period ?? ''));
}

export async function getWeatherVehicleRows(weather: string): Promise<WeatherVehicleSummary[]> {
  const scenarios = await loadRiskScenarioSummary();
  const grouped = new Map<string, { order_count: number; duration: number; distance: number; delay: number; risk: number }>();
  const globalGrouped = new Map<string, { order_count: number; duration: number; distance: number; delay: number; risk: number }>();

  scenarios
    .filter((row) => matches(row.weather, weather) && row.vehicle_type)
    .forEach((row) => {
      const vehicle = row.vehicle_type ?? 'Unknown';
      const current = grouped.get(vehicle) ?? { order_count: 0, duration: 0, distance: 0, delay: 0, risk: 0 };
      const weight = Math.max(0, row.order_count ?? 0);
      current.order_count += weight;
      current.duration += (row.avg_delivery_duration_min ?? 0) * weight;
      current.distance += (row.avg_distance_km ?? 0) * weight;
      current.delay += normalizeRate(row.delay_rate) * weight;
      current.risk += normalizeRate(row.risk_score) * weight;
      grouped.set(vehicle, current);
    });

  if (!grouped.size) {
    const points = await loadScenarioDistanceTimePoints();
    points.filter((row) => matches(row.weather, weather) && row.vehicle_type).forEach((row) => {
      const vehicle = row.vehicle_type ?? 'Unknown';
      const current = grouped.get(vehicle) ?? { order_count: 0, duration: 0, distance: 0, delay: 0, risk: 0 };
      current.order_count += 1;
      current.duration += row.delivery_duration_min;
      current.distance += row.distance_km;
      current.delay += row.is_delayed ? 1 : 0;
      current.risk += visualRisk(row);
      grouped.set(vehicle, current);
    });
  }

  const points = await loadScenarioDistanceTimePoints();
  points.filter((row) => row.vehicle_type).forEach((row) => {
    const vehicle = row.vehicle_type ?? 'Unknown';
    const current = globalGrouped.get(vehicle) ?? { order_count: 0, duration: 0, distance: 0, delay: 0, risk: 0 };
    current.order_count += 1;
    current.duration += row.delivery_duration_min;
    current.distance += row.distance_km;
    current.delay += row.is_delayed ? 1 : 0;
    current.risk += visualRisk(row);
    globalGrouped.set(vehicle, current);
  });

  Array.from(globalGrouped.entries())
    .sort((a, b) => b[1].order_count - a[1].order_count)
    .forEach(([vehicle, row]) => {
      if (grouped.size >= 4 || grouped.has(vehicle)) return;
      grouped.set(vehicle, row);
    });

  return Array.from(grouped.entries())
    .map(([vehicle_type, row]) => ({
      vehicle_type,
      weather: isAll(weather) || !scenarios.some((scenario) => scenario.weather === weather && scenario.vehicle_type === vehicle_type)
        ? 'All'
        : weather,
      order_count: row.order_count,
      avg_delivery_duration_min: row.order_count ? row.duration / row.order_count : 0,
      avg_distance_km: row.order_count ? row.distance / row.order_count : 0,
      delay_rate: row.order_count ? row.delay / row.order_count : 0,
      risk_score: row.order_count ? row.risk / row.order_count : 0
    }))
    .sort((a, b) => b.order_count - a.order_count);
}

export async function getWeatherRiskScenarios(weather: string): Promise<RiskScenario[]> {
  const rows = await loadRiskScenarioSummary();
  return rows
    .filter((row) => matches(row.weather, weather))
    .sort((a, b) => normalizeRate(b.risk_score) - normalizeRate(a.risk_score) || b.order_count - a.order_count)
    .slice(0, 12);
}

export async function getWeatherOutlierOrders(weather: string): Promise<WeatherOrderSample[]> {
  const rows = await getWeatherOrderSamples(weather, 'All');
  return rows
    .filter((row) => row.is_delayed || (row.risk_visual_score ?? 0) >= 0.66)
    .sort((a, b) => (b.risk_visual_score ?? 0) - (a.risk_visual_score ?? 0) || b.delivery_duration_min - a.delivery_duration_min)
    .slice(0, 24);
}
