import {
  DistanceTimePoint,
  OverviewSummary,
  RiskScenario,
  ScenarioOrderSample,
  TimePeriodSummary,
  TrafficDensitySummary,
  TrafficSegmentSummary,
  WeatherImpactSummary,
  WeatherTrafficSummary
} from '../types/data';

const trafficDensityOrder: TrafficDensitySummary['traffic_density'][] = ['Low', 'Medium', 'High', 'Jam'];

export const mockRiskScenarios: RiskScenario[] = [
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
    vehicle_type: 'scooter',
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

export const mockScenarioOrders: ScenarioOrderSample[] = [
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
    vehicle_type: 'scooter',
    distance_km: 4.9,
    delivery_duration_min: 24.2,
    predicted_duration_min: 25.5,
    delay_minutes: 0,
    is_delayed: false,
    delivery_person_ratings: 4.8,
    multiple_deliveries: 0
  }
];

export const mockDistanceTimeSample: DistanceTimePoint[] = mockScenarioOrders.map((order) => ({
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

export const mockTimePeriods: TimePeriodSummary[] = [
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

export const mockWeatherTraffic: WeatherTrafficSummary[] = [
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

export const mockTrafficDensity: TrafficDensitySummary[] = [
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

export const mockTrafficSegments: TrafficSegmentSummary[] = mockTrafficDensity.map((row) => ({
  segment_id: `mock-${row.traffic_density.toLowerCase()}`,
  label: row.label ?? row.traffic_density,
  traffic_density: row.traffic_density,
  order_count: row.order_count,
  avg_delivery_duration_min: row.avg_delivery_duration_min,
  delay_rate: row.delay_rate,
  risk_score: row.risk_score
}));

export const mockWeatherImpact: WeatherImpactSummary[] = [
  {
    weather: 'Sunny',
    order_count: 7238,
    avg_delivery_duration_min: 21.9,
    median_delivery_duration_min: 21.3,
    p75_delivery_duration_min: 26.2,
    avg_distance_km: 5.8,
    delay_rate: 0.102,
    risk_score: 0.44
  },
  {
    weather: 'Cloudy',
    order_count: 7485,
    avg_delivery_duration_min: 28.9,
    median_delivery_duration_min: 27.8,
    p75_delivery_duration_min: 34.9,
    avg_distance_km: 7.0,
    delay_rate: 0.375,
    risk_score: 0.616
  },
  {
    weather: 'Fog',
    order_count: 7604,
    avg_delivery_duration_min: 28.9,
    median_delivery_duration_min: 27.9,
    p75_delivery_duration_min: 34.7,
    avg_distance_km: 7.1,
    delay_rate: 0.382,
    risk_score: 0.619
  },
  {
    weather: 'Stormy',
    order_count: 7544,
    avg_delivery_duration_min: 25.9,
    median_delivery_duration_min: 25.2,
    p75_delivery_duration_min: 31.2,
    avg_distance_km: 6.9,
    delay_rate: 0.203,
    risk_score: 0.522
  },
  {
    weather: 'Sandstorms',
    order_count: 7442,
    avg_delivery_duration_min: 25.9,
    median_delivery_duration_min: 25.1,
    p75_delivery_duration_min: 31.1,
    avg_distance_km: 6.8,
    delay_rate: 0.202,
    risk_score: 0.521
  },
  {
    weather: 'Windy',
    order_count: 7382,
    avg_delivery_duration_min: 26.1,
    median_delivery_duration_min: 25.4,
    p75_delivery_duration_min: 31.6,
    avg_distance_km: 6.7,
    delay_rate: 0.212,
    risk_score: 0.515
  }
];

export const mockOverview: OverviewSummary = {
  total_orders: 45593,
  valid_orders: 45162,
  avg_delivery_duration_min: 26.3,
  median_delivery_duration_min: 26,
  delay_threshold_min: 32,
  delay_rate: 0.247,
  avg_distance_km: 9.7,
  city_count: 3,
  weather_categories: 6,
  traffic_density_categories: 4,
  order_count: 45162,
  p75_delivery_duration_min: 32,
  min_delivery_duration_min: 10,
  max_delivery_duration_min: 54,
  median_distance_km: 9.2,
  avg_speed_kmph: 23.8
};
