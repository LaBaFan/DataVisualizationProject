import {
  DistanceTimePoint,
  DeliveryFlowSegment,
  OverviewSummary,
  OrderDot,
  RiskHeatHalo,
  RiskScenario,
  ScenarioOrderSample,
  TimePeriodSummary,
  TrafficDensitySummary,
  TrafficSegmentSummary,
  WeatherImpactSummary,
  WeatherTrafficSummary
} from '../types/data';
import { orderDots, scenarioAnchors, trafficSegments } from '../data/mapOverlayData';

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
    scenario_id: 'mock-cloudy-high-lunch',
    label: 'Cloudy / High / lunch_peak',
    weather: 'Cloudy',
    traffic_density: 'High',
    time_period: 'lunch_peak',
    vehicle_type: 'scooter',
    order_count: 238,
    avg_delivery_duration_min: 42.8,
    median_delivery_duration_min: 40.4,
    p75_delivery_duration_min: 51.2,
    avg_distance_km: 8.1,
    delay_rate: 0.31,
    multiple_delivery_rate: 0.22,
    avg_rating: 4.3,
    risk_score: 0.69
  },
  {
    scenario_id: 'mock-windy-medium-breakfast',
    label: 'Windy / Medium / breakfast',
    weather: 'Windy',
    traffic_density: 'Medium',
    time_period: 'breakfast',
    vehicle_type: 'motorcycle',
    order_count: 152,
    avg_delivery_duration_min: 34.6,
    median_delivery_duration_min: 33.1,
    p75_delivery_duration_min: 41.3,
    avg_distance_km: 6.7,
    delay_rate: 0.19,
    multiple_delivery_rate: 0.17,
    avg_rating: 4.5,
    risk_score: 0.49
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
    time_period: 'afternoon',
    order_count: 218,
    avg_delivery_duration_min: 31.6,
    median_delivery_duration_min: 30.2,
    p75_delivery_duration_min: 38.4,
    avg_distance_km: 6.9,
    delay_rate: 0.16
  },
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

const trafficDensityOrder: TrafficDensitySummary['traffic_density'][] = ['Low', 'Medium', 'High', 'Jam'];

const mockTrafficDensity: TrafficDensitySummary[] = [
  {
    traffic_density: 'Low',
    label: 'Low',
    order_count: 212,
    avg_delivery_duration_min: 26.8,
    avg_distance_km: 5.8,
    delay_rate: 0.08,
    risk_score: 0.22
  },
  {
    traffic_density: 'Medium',
    label: 'Medium',
    order_count: 152,
    avg_delivery_duration_min: 34.6,
    avg_distance_km: 6.7,
    delay_rate: 0.19,
    risk_score: 0.49
  },
  {
    traffic_density: 'High',
    label: 'High',
    order_count: 362,
    avg_delivery_duration_min: 43.8,
    avg_distance_km: 8.5,
    delay_rate: 0.33,
    risk_score: 0.72
  },
  {
    traffic_density: 'Jam',
    label: 'Jam',
    order_count: 186,
    avg_delivery_duration_min: 52.4,
    avg_distance_km: 11.2,
    delay_rate: 0.48,
    risk_score: 0.91
  }
];

function isTrafficDensity(value: string | null | undefined): value is TrafficDensitySummary['traffic_density'] {
  return trafficDensityOrder.includes(value as TrafficDensitySummary['traffic_density']);
}

const mockWeatherImpact: WeatherImpactSummary[] = [
  { weather: 'Sunny', order_count: 2120, avg_delivery_duration_min: 27.8, delay_rate: 0.16, risk_score: 0.28 },
  { weather: 'Fog', order_count: 1420, avg_delivery_duration_min: 40.2, delay_rate: 0.62, risk_score: 0.76 },
  { weather: 'Cloudy', order_count: 1880, avg_delivery_duration_min: 38.6, delay_rate: 0.54, risk_score: 0.68 },
  { weather: 'Stormy', order_count: 980, avg_delivery_duration_min: 46.4, delay_rate: 0.79, risk_score: 0.91 },
  { weather: 'Sandstorms', order_count: 460, avg_delivery_duration_min: 41.1, delay_rate: 0.58, risk_score: 0.7 },
  { weather: 'Windy', order_count: 610, avg_delivery_duration_min: 35.8, delay_rate: 0.39, risk_score: 0.5 }
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

export const mockRiskHeatHalos: RiskHeatHalo[] = scenarioAnchors.slice(0, 5).map((anchor) => ({
  id: anchor.id.replace('pulse-', 'halo-'),
  scenario_id: anchor.scenario_id,
  label: anchor.label,
  x: anchor.x,
  y: anchor.y,
  radius: Math.round(anchor.radius * 1.28),
  order_count: anchor.order_count,
  avg_delivery_duration_min: anchor.avg_delivery_duration_min,
  delay_rate: anchor.delay_rate,
  risk_score: anchor.risk_score,
  weather: anchor.weather,
  traffic_density: anchor.traffic_density,
  time_period: anchor.time_period,
  vehicle_type: anchor.vehicle_type
}));

const seedOffsets = [
  [-30, -18],
  [22, -24],
  [-42, 18],
  [36, 20],
  [6, 36],
  [-8, -38],
  [52, -2],
  [-54, -4]
];

export const mockOrderDensityDots: OrderDot[] = orderDots.flatMap((dot, dotIndex) => {
  const offsets = seedOffsets.slice(0, dotIndex % 2 === 0 ? 2 : 1);
  const generated = offsets.map(([dx, dy], offsetIndex) => ({
    ...dot,
    id: `${dot.id}-density-${offsetIndex + 1}`,
    x: Math.max(80, Math.min(1520, dot.x + dx)),
    y: Math.max(110, Math.min(900, dot.y + dy)),
    order_count: Math.max(12, Math.round((dot.order_count ?? 30) * (0.54 + offsetIndex * 0.16))),
    delivery_duration_min: Math.max(18, dot.delivery_duration_min + (offsetIndex % 2 === 0 ? -2 : 3)),
    delay_rate: Math.max(0.08, Math.min(0.96, (dot.delay_rate ?? 0.3) + (offsetIndex === 0 ? -0.04 : 0.06))),
    risk_score: Math.max(0.1, Math.min(0.98, (dot.delay_rate ?? 0.3) + (dot.is_delayed ? 0.12 : 0.02))),
    is_delayed: dot.is_delayed || (dot.delay_rate ?? 0) >= 0.5
  }));
  return [dot, ...generated];
});

export const mockDeliveryFlowSegments: DeliveryFlowSegment[] = [
  { id: 'flow-west-center-01', label: '西侧订单流入中央路口', start: [230, 480], end: [760, 428], order_count: 410, avg_delivery_duration_min: 38, delay_rate: 0.58, risk_score: 0.72, speed: 1.4, weather: 'Fog', traffic_density: 'High', time_period: 'night' },
  { id: 'flow-central-east-01', label: '中央路口流向东侧客户区', start: [822, 454], end: [1140, 504], order_count: 520, avg_delivery_duration_min: 42, delay_rate: 0.69, risk_score: 0.83, speed: 1.1, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night' },
  { id: 'flow-east-customer-01', label: '东侧汇入口流向客户区', start: [1160, 506], end: [1450, 644], order_count: 360, avg_delivery_duration_min: 45, delay_rate: 0.76, risk_score: 0.88, speed: 0.9, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night' },
  { id: 'flow-restaurant-west-01', label: '底部餐厅流向西侧支路', start: [610, 732], end: [360, 754], order_count: 210, avg_delivery_duration_min: 31, delay_rate: 0.32, risk_score: 0.42, speed: 1.8, traffic_density: 'Medium', time_period: 'lunch_peak' },
  { id: 'flow-restaurant-east-01', label: '底部餐厅流向东侧支路', start: [846, 758], end: [1136, 782], order_count: 310, avg_delivery_duration_min: 36, delay_rate: 0.48, risk_score: 0.58, speed: 1.5, traffic_density: 'Medium', time_period: 'dinner_peak' },
  { id: 'flow-rain-top-01', label: '右上雨区补单流', start: [1192, 338], end: [1414, 404], order_count: 300, avg_delivery_duration_min: 44, delay_rate: 0.73, risk_score: 0.84, speed: 1, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night' },
  { id: 'flow-fog-upper-01', label: '左上雾区边缘配送流', start: [410, 338], end: [638, 292], order_count: 190, avg_delivery_duration_min: 35, delay_rate: 0.43, risk_score: 0.63, speed: 1.3, weather: 'Fog', traffic_density: 'High', time_period: 'night' },
  { id: 'flow-central-turn-01', label: '中央左转短流', start: [744, 428], end: [834, 578], order_count: 230, avg_delivery_duration_min: 37, delay_rate: 0.51, risk_score: 0.67, speed: 1.2, traffic_density: 'High', time_period: 'dinner_peak' },
  { id: 'flow-central-turn-02', label: '中央右转短流', start: [1038, 504], end: [1196, 654], order_count: 220, avg_delivery_duration_min: 35, delay_rate: 0.44, risk_score: 0.59, speed: 1.45, traffic_density: 'Medium', time_period: 'lunch_peak' },
  { id: 'flow-dispatch-local-01', label: '调度区短距离流', start: [790, 526], end: [904, 548], order_count: 260, avg_delivery_duration_min: 34, delay_rate: 0.36, risk_score: 0.48, speed: 1.9, weather: 'Cloudy', traffic_density: 'Medium', time_period: 'lunch_peak' },
  { id: 'flow-storm-bottom-01', label: '暴雨客户区慢速流', start: [1180, 780], end: [1398, 570], order_count: 280, avg_delivery_duration_min: 47, delay_rate: 0.78, risk_score: 0.91, speed: 0.85, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night' },
  { id: 'flow-upper-center-01', label: '上方商圈流向中央', start: [808, 300], end: [904, 548], order_count: 240, avg_delivery_duration_min: 40, delay_rate: 0.69, risk_score: 0.78, speed: 1.05, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'dinner_peak' },
  { id: 'flow-left-local-01', label: '左下支路末端流', start: [214, 508], end: [430, 452], order_count: 170, avg_delivery_duration_min: 28, delay_rate: 0.22, risk_score: 0.34, speed: 2.1, traffic_density: 'Low', time_period: 'afternoon' },
  { id: 'flow-east-local-02', label: '东侧客户区短流', start: [1306, 516], end: [1468, 634], order_count: 250, avg_delivery_duration_min: 41, delay_rate: 0.62, risk_score: 0.74, speed: 1.2, weather: 'Stormy', traffic_density: 'Jam', time_period: 'dinner_peak' }
];

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

  return trafficDensityOrder.map((density) => {
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

export async function loadTrafficDensitySummary(): Promise<TrafficDensitySummary[]> {
  const direct = await fetchJson<TrafficDensitySummary[] | null>('traffic_density_summary.json', null);
  if (Array.isArray(direct) && direct.length) {
    const byDensity = new Map(direct.map((row) => [row.traffic_density, normalizeDensityRow(row)]));
    return trafficDensityOrder.map((density) => byDensity.get(density) ?? mockTrafficDensity.find((row) => row.traffic_density === density)!);
  }

  const weatherTrafficRows = await loadWeatherTrafficSummary();
  return aggregateTrafficDensity(weatherTrafficRows).map(normalizeDensityRow);
}
