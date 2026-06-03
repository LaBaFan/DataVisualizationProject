import { MiniMetricTag, OrderDot, ScenarioAnchor, TrafficSegment } from '../types/data';

export const trafficSegments: TrafficSegment[] = [
  {
    id: 'traffic-central-jam-a',
    label: '中央拥堵主路 A',
    path: 'M548 426 C650 390 746 406 858 462',
    traffic_density: 'Jam',
    order_count: 960,
    avg_delivery_duration_min: 39.1,
    delay_rate: 0.66,
    risk_score: 0.82
  },
  {
    id: 'traffic-central-jam-b',
    label: '中央拥堵主路 B',
    path: 'M894 484 C1000 538 1118 526 1236 482',
    traffic_density: 'Jam',
    order_count: 820,
    avg_delivery_duration_min: 41.8,
    delay_rate: 0.71,
    risk_score: 0.86
  },
  {
    id: 'traffic-upper-high',
    label: '上方高压道路',
    path: 'M430 330 C552 276 662 258 806 296',
    traffic_density: 'High',
    order_count: 540,
    avg_delivery_duration_min: 34.5,
    delay_rate: 0.43,
    risk_score: 0.63
  },
  {
    id: 'traffic-right-rain-jam',
    label: '右侧雨区拥堵道路',
    path: 'M1130 368 C1232 346 1366 380 1460 448',
    traffic_density: 'Jam',
    order_count: 610,
    avg_delivery_duration_min: 43.6,
    delay_rate: 0.73,
    risk_score: 0.84
  },
  {
    id: 'traffic-lower-medium-a',
    label: '下方中压道路 A',
    path: 'M332 760 C494 708 650 710 802 748',
    traffic_density: 'Medium',
    order_count: 720,
    avg_delivery_duration_min: 32.2,
    delay_rate: 0.38,
    risk_score: 0.52
  },
  {
    id: 'traffic-lower-medium-b',
    label: '下方中压道路 B',
    path: 'M868 772 C996 826 1134 802 1288 728',
    traffic_density: 'Medium',
    order_count: 650,
    avg_delivery_duration_min: 33.6,
    delay_rate: 0.42,
    risk_score: 0.58
  },
  {
    id: 'traffic-left-low',
    label: '左侧低压支路',
    path: 'M210 506 C304 464 406 440 506 420',
    traffic_density: 'Low',
    order_count: 360,
    avg_delivery_duration_min: 27.4,
    delay_rate: 0.22,
    risk_score: 0.34
  }
];

export const orderDots: OrderDot[] = [
  { id: 'order-cluster-left-01', x: 214, y: 452, order_count: 42, delivery_duration_min: 31, delay_rate: 0.34, is_delayed: false, weather: 'Fog', traffic_density: 'Low', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-cluster-left-02', x: 278, y: 486, order_count: 56, delivery_duration_min: 38, delay_rate: 0.48, is_delayed: true, weather: 'Fog', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-cluster-left-03', x: 354, y: 430, order_count: 31, delivery_duration_min: 28, delay_rate: 0.26, is_delayed: false, weather: 'Fog', traffic_density: 'Medium', time_period: 'night', vehicle_type: 'scooter' },
  { id: 'order-road-mid-01', x: 546, y: 432, order_count: 62, delivery_duration_min: 39, delay_rate: 0.66, is_delayed: true, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-road-mid-02', x: 642, y: 400, order_count: 48, delivery_duration_min: 35, delay_rate: 0.52, is_delayed: true, weather: 'Cloudy', traffic_density: 'High', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-road-mid-03', x: 742, y: 426, order_count: 74, delivery_duration_min: 42, delay_rate: 0.71, is_delayed: true, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-dispatch-01', x: 792, y: 526, order_count: 88, delivery_duration_min: 34, delay_rate: 0.36, is_delayed: false, weather: 'Cloudy', traffic_density: 'Medium', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-dispatch-02', x: 904, y: 548, order_count: 92, delivery_duration_min: 45, delay_rate: 0.79, is_delayed: true, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-right-road-01', x: 1034, y: 512, order_count: 58, delivery_duration_min: 40, delay_rate: 0.61, is_delayed: true, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-right-road-02', x: 1146, y: 494, order_count: 64, delivery_duration_min: 43, delay_rate: 0.68, is_delayed: true, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-right-restaurant-01', x: 1212, y: 454, order_count: 73, delivery_duration_min: 38, delay_rate: 0.55, is_delayed: true, weather: 'Rainy', traffic_density: 'High', time_period: 'night', vehicle_type: 'scooter' },
  { id: 'order-customer-01', x: 1306, y: 516, order_count: 45, delivery_duration_min: 36, delay_rate: 0.42, is_delayed: false, weather: 'Rainy', traffic_density: 'Medium', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-customer-02', x: 1398, y: 570, order_count: 66, delivery_duration_min: 47, delay_rate: 0.78, is_delayed: true, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-customer-03', x: 1468, y: 634, order_count: 38, delivery_duration_min: 41, delay_rate: 0.62, is_delayed: true, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'bike' },
  { id: 'order-bottom-01', x: 422, y: 746, order_count: 35, delivery_duration_min: 30, delay_rate: 0.28, is_delayed: false, traffic_density: 'Medium', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-bottom-02', x: 558, y: 714, order_count: 44, delivery_duration_min: 33, delay_rate: 0.36, is_delayed: false, traffic_density: 'Medium', time_period: 'night', vehicle_type: 'scooter' },
  { id: 'order-bottom-03', x: 704, y: 832, order_count: 68, delivery_duration_min: 29, delay_rate: 0.25, is_delayed: false, traffic_density: 'Low', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-bottom-04', x: 842, y: 760, order_count: 52, delivery_duration_min: 36, delay_rate: 0.44, is_delayed: true, traffic_density: 'Medium', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-bottom-05', x: 1008, y: 814, order_count: 46, delivery_duration_min: 37, delay_rate: 0.48, is_delayed: true, traffic_density: 'Medium', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-bottom-06', x: 1180, y: 780, order_count: 59, delivery_duration_min: 42, delay_rate: 0.65, is_delayed: true, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-upper-01', x: 484, y: 318, order_count: 28, delivery_duration_min: 27, delay_rate: 0.21, is_delayed: false, weather: 'Fog', traffic_density: 'High', time_period: 'night', vehicle_type: 'bike' },
  { id: 'order-upper-02', x: 628, y: 278, order_count: 36, delivery_duration_min: 32, delay_rate: 0.37, is_delayed: false, weather: 'Cloudy', traffic_density: 'High', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-upper-03', x: 808, y: 300, order_count: 58, delivery_duration_min: 40, delay_rate: 0.69, is_delayed: true, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-storm-01', x: 1270, y: 304, order_count: 49, delivery_duration_min: 44, delay_rate: 0.73, is_delayed: true, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'order-storm-02', x: 1410, y: 384, order_count: 61, delivery_duration_min: 46, delay_rate: 0.77, is_delayed: true, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' }
];

export const scenarioAnchors: ScenarioAnchor[] = [
  { id: 'pulse-cloudy-jam-night', scenario_id: 'Cloudy|Jam|night|motorcycle', label: '多云 · 堵塞 · 夜间 · 摩托车', x: 904, y: 322, radius: 74, order_count: 94, avg_delivery_duration_min: 44.5, delay_rate: 0.989, risk_score: 0.89, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'pulse-storm-bottom-right', scenario_id: 'Stormy|Jam|night|motorcycle', label: '暴雨 · 堵塞 · 夜间', x: 1334, y: 666, radius: 82, order_count: 365, avg_delivery_duration_min: 46.4, delay_rate: 0.79, risk_score: 0.91, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'pulse-rain-top-right', label: '大雨 · 堵塞 · 夜间', x: 1356, y: 306, radius: 70, order_count: 510, avg_delivery_duration_min: 43.6, delay_rate: 0.71, risk_score: 0.84, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night' },
  { id: 'pulse-fog-left', label: '雾 · 堵塞 · 夜间', x: 430, y: 296, radius: 64, order_count: 420, avg_delivery_duration_min: 40.2, delay_rate: 0.62, risk_score: 0.76, weather: 'Fog', traffic_density: 'Jam', time_period: 'night' },
  { id: 'pulse-night-motorcycle', label: '夜间 · 摩托车', x: 476, y: 642, radius: 58, order_count: 680, avg_delivery_duration_min: 36.7, delay_rate: 0.48, risk_score: 0.69, time_period: 'night', vehicle_type: 'motorcycle' }
];

export const miniMetricTags: MiniMetricTag[] = [
  { id: 'metric-cloudy-jam-night', scenario_id: 'Cloudy|Jam|night|motorcycle', label: '多云拥堵夜间', x: 822, y: 236, delay_rate: 0.989, avg_delivery_duration_min: 44.5, order_count: 94, risk_score: 0.89, weather: 'Cloudy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'metric-storm-bottom', scenario_id: 'Stormy|Jam|night|motorcycle', label: '暴雨拥堵夜间', x: 1238, y: 594, delay_rate: 0.79, avg_delivery_duration_min: 46.4, order_count: 365, risk_score: 0.91, weather: 'Stormy', traffic_density: 'Jam', time_period: 'night', vehicle_type: 'motorcycle' },
  { id: 'metric-rain-top', label: '大雨拥堵夜间', x: 1274, y: 246, delay_rate: 0.71, avg_delivery_duration_min: 43.6, order_count: 510, risk_score: 0.84, weather: 'Rainy', traffic_density: 'Jam', time_period: 'night' },
  { id: 'metric-fog-left', label: '雾区高楼', x: 300, y: 264, delay_rate: 0.62, avg_delivery_duration_min: 40.2, order_count: 420, risk_score: 0.76, weather: 'Fog', traffic_density: 'Jam', time_period: 'night' },
  { id: 'metric-central-road', label: '中央主路', x: 996, y: 452, delay_rate: 0.66, avg_delivery_duration_min: 39.1, order_count: 960, risk_score: 0.82, traffic_density: 'Jam' }
];
