import {
  DistanceTimePoint,
  OverviewSummary,
  RiskScenario,
  ScenarioOrderSample,
  TimePeriodSummary,
  TrafficSegmentSummary,
  WeatherImpactSummary,
  WeatherTrafficSummary
} from '../types/data';
import { trafficSegments } from '../data/mapOverlayData';

const DATA_BASE_PATH = '/data';

const mockRiskScenarios: RiskScenario[] = [
  {
    scenario_id: 'mock-storm-jam-dinner',
    label: 'Stormy / Jam / dinner_peak',
    weather: 'Stormy',
    traffic_density: 'Jam',
    time_period: 'dinner_peak',
    vehicle_type: 'motorcycle',
    order_count: 186,
    avg_delivery_duration_min: 52.4,
    median_delivery_duration_min: 50.1,
    p75_delivery_duration_min: 61.8,
    avg_distance_km: 11.2,
    delay_rate: 0.48,
    multiple_delivery_rate: 0.34,
    avg_rating: 4.1,
    risk_score: 0.91
  },
  {
    scenario_id: 'mock-fog-high-night',
    label: 'Fog / High / night',
    weather: 'Fog',
    traffic_density: 'High',
    time_period: 'night',
    vehicle_type: 'scooter',
    order_count: 124,
    avg_delivery_duration_min: 45.7,
    median_delivery_duration_min: 44.2,
    p75_delivery_duration_min: 53.9,
    avg_distance_km: 9.4,
    delay_rate: 0.36,
    multiple_delivery_rate: 0.26,
    avg_rating: 4.3,
    risk_score: 0.76
  },
  {
    scenario_id: 'mock-sunny-low-afternoon',
    label: 'Sunny / Low / afternoon',
    weather: 'Sunny',
    traffic_density: 'Low',
    time_period: 'afternoon',
    vehicle_type: 'bicycle',
    order_count: 212,
    avg_delivery_duration_min: 26.8,
    median_delivery_duration_min: 25.7,
    p75_delivery_duration_min: 31.6,
    avg_distance_km: 5.8,
    delay_rate: 0.08,
    multiple_delivery_rate: 0.12,
    avg_rating: 4.7,
    risk_score: 0.22
  }
];

const mockScenarioOrders: ScenarioOrderSample[] = [
  {
    order_id: 'mock-order-001',
    scenario_id: 'mock-storm-jam-dinner',
    city: 'Metropolitian',
    weather: 'Stormy',
    traffic_density: 'Jam',
    time_period: 'dinner_peak',
    vehicle_type: 'motorcycle',
    distance_km: 12.1,
    delivery_duration_min: 58.3,
    predicted_duration_min: 43.5,
    delay_minutes: 14.8,
    is_delayed: true,
    delivery_person_ratings: 4.0,
    multiple_deliveries: 2
  },
  {
    order_id: 'mock-order-002',
    scenario_id: 'mock-fog-high-night',
    city: 'Urban',
    weather: 'Fog',
    traffic_density: 'High',
    time_period: 'night',
    vehicle_type: 'scooter',
    distance_km: 8.7,
    delivery_duration_min: 41.6,
    predicted_duration_min: 36.8,
    delay_minutes: 4.8,
    is_delayed: false,
    delivery_person_ratings: 4.4,
    multiple_deliveries: 1
  },
  {
    order_id: 'mock-order-003',
    scenario_id: 'mock-sunny-low-afternoon',
    city: 'Semi-Urban',
    weather: 'Sunny',
    traffic_density: 'Low',
    time_period: 'afternoon',
    vehicle_type: 'bicycle',
    distance_km: 4.9,
    delivery_duration_min: 24.2,
    predicted_duration_min: 25.5,
    delay_minutes: 0,
    is_delayed: false,
    delivery_person_ratings: 4.8,
    multiple_deliveries: 0
  }
];

const mockDistanceTimeSample: DistanceTimePoint[] = mockScenarioOrders.map((order) => ({
  order_id: order.order_id,
  scenario_id: order.scenario_id,
  city: order.city ?? null,
  weather: order.weather ?? null,
  traffic_density: order.traffic_density ?? null,
  time_period: order.time_period ?? null,
  vehicle_type: order.vehicle_type ?? null,
  distance_km: order.distance_km,
  delivery_duration_min: order.delivery_duration_min,
  delivery_person_ratings: order.delivery_person_ratings === undefined ? null : String(order.delivery_person_ratings),
  multiple_deliveries: order.multiple_deliveries === undefined ? null : String(order.multiple_deliveries),
  is_delayed: Boolean(order.is_delayed)
}));

const mockTimePeriods: TimePeriodSummary[] = [
  {
    time_period: 'breakfast',
    order_count: 168,
    avg_delivery_duration_min: 30.4,
    median_delivery_duration_min: 29.1,
    p75_delivery_duration_min: 36.2,
    avg_distance_km: 6.4,
    delay_rate: 0.14
  },
  {
    time_period: 'lunch_peak',
    order_count: 284,
    avg_delivery_duration_min: 38.9,
    median_delivery_duration_min: 37.6,
    p75_delivery_duration_min: 47.1,
    avg_distance_km: 7.8,
    delay_rate: 0.27
  },
  {
    time_period: 'dinner_peak',
    order_count: 326,
    avg_delivery_duration_min: 44.5,
    median_delivery_duration_min: 43.2,
    p75_delivery_duration_min: 55.7,
    avg_distance_km: 8.6,
    delay_rate: 0.34
  },
  {
    time_period: 'night',
    order_count: 132,
    avg_delivery_duration_min: 36.8,
    median_delivery_duration_min: 35.5,
    p75_delivery_duration_min: 43.4,
    avg_distance_km: 7.1,
    delay_rate: 0.21
  }
];

const mockWeatherTraffic: WeatherTrafficSummary[] = [
  {
    weather: 'Stormy',
    traffic_density: 'Jam',
    order_count: 186,
    avg_delivery_duration_min: 52.4,
    median_delivery_duration_min: 50.1,
    p75_delivery_duration_min: 61.8,
    avg_distance_km: 11.2,
    delay_rate: 0.48,
    risk_score: 0.91
  },
  {
    weather: 'Fog',
    traffic_density: 'High',
    order_count: 124,
    avg_delivery_duration_min: 45.7,
    median_delivery_duration_min: 44.2,
    p75_delivery_duration_min: 53.9,
    avg_distance_km: 9.4,
    delay_rate: 0.36,
    risk_score: 0.76
  },
  {
    weather: 'Sunny',
    traffic_density: 'Low',
    order_count: 212,
    avg_delivery_duration_min: 26.8,
    median_delivery_duration_min: 25.7,
    p75_delivery_duration_min: 31.6,
    avg_distance_km: 5.8,
    delay_rate: 0.08,
    risk_score: 0.22
  }
];

const mockWeatherImpact: WeatherImpactSummary[] = [
  { weather: 'Sunny', order_count: 2120, avg_delivery_duration_min: 27.8, delay_rate: 0.16, risk_score: 0.28 },
  { weather: 'Fog', order_count: 1420, avg_delivery_duration_min: 40.2, delay_rate: 0.62, risk_score: 0.76 },
  { weather: 'Cloudy', order_count: 1880, avg_delivery_duration_min: 38.6, delay_rate: 0.54, risk_score: 0.68 },
  { weather: 'Rainy', order_count: 1510, avg_delivery_duration_min: 43.6, delay_rate: 0.71, risk_score: 0.84 },
  { weather: 'Stormy', order_count: 980, avg_delivery_duration_min: 46.4, delay_rate: 0.79, risk_score: 0.91 },
  { weather: 'Sandstorms', order_count: 460, avg_delivery_duration_min: 41.1, delay_rate: 0.58, risk_score: 0.7 },
  { weather: 'Windy', order_count: 610, avg_delivery_duration_min: 35.8, delay_rate: 0.39, risk_score: 0.5 },
  { weather: 'Unknown', order_count: 320, avg_delivery_duration_min: 34.4, delay_rate: 0.31, risk_score: 0.42 }
];

const mockTrafficSegments: TrafficSegmentSummary[] = trafficSegments.map((segment) => ({
  segment_id: segment.id,
  label: segment.label,
  traffic_density: segment.traffic_density,
  order_count: segment.order_count,
  avg_delivery_duration_min: segment.avg_delivery_duration_min,
  delay_rate: segment.delay_rate,
  risk_score: segment.risk_score
}));

const mockOverview: OverviewSummary = {
  total_orders: 15420,
  valid_orders: 15108,
  avg_delivery_duration_min: 36.7,
  median_delivery_duration_min: 34.9,
  delay_threshold_min: 45,
  delay_rate: 0.24,
  avg_distance_km: 7.6,
  city_count: 3,
  weather_categories: 6,
  traffic_density_categories: 4,
  order_count: 15108,
  p75_delivery_duration_min: 44.8,
  min_delivery_duration_min: 10.2,
  max_delivery_duration_min: 82.6,
  median_distance_km: 7.1,
  avg_speed_kmph: 12.4
};

async function fetchJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${DATA_BASE_PATH}/${fileName}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[staticDataClient] Failed to load /data/${fileName}; using mock data.`, error);
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

function normalizeRiskScenario(scenario: RiskScenario): RiskScenario {
  return {
    ...scenario,
    label: scenario.label && scenario.label.trim() ? scenario.label : buildScenarioLabel(scenario)
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

export function loadTrafficSegmentSummary(): Promise<TrafficSegmentSummary[]> {
  return fetchJson<TrafficSegmentSummary[]>('traffic_segment_summary.json', mockTrafficSegments);
}
