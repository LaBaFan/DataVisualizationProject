import { MiniMetricTag, OrderDot, ScenarioAnchor, TrafficSegment } from '../types/data';

export const trafficSegments: TrafficSegment[] = [
  {
    id: 'road-central-main-west',
    label: '中央主干路西段',
    path: 'M552 432 L662 410 L770 424',
    points: [
      [552, 432],
      [662, 410],
      [770, 424]
    ],
    traffic_density: 'Jam',
    order_count: 960,
    avg_delivery_duration_min: 39.1,
    delay_rate: 0.66,
    risk_score: 0.82
  },
  {
    id: 'road-central-main-east',
    label: '中央主干路东段',
    path: 'M870 468 L994 504 L1124 496',
    points: [
      [870, 468],
      [994, 504],
      [1124, 496]
    ],
    traffic_density: 'Jam',
    order_count: 820,
    avg_delivery_duration_min: 41.8,
    delay_rate: 0.71,
    risk_score: 0.86
  },
  {
    id: 'road-upper-fog-edge',
    label: '左上雾区边缘路',
    path: 'M408 338 L520 312 L638 292',
    points: [
      [408, 338],
      [520, 312],
      [638, 292]
    ],
    traffic_density: 'High',
    order_count: 540,
    avg_delivery_duration_min: 34.5,
    delay_rate: 0.43,
    risk_score: 0.63
  },
  {
    id: 'road-upper-right-rain',
    label: '右上雨区连接路',
    path: 'M1188 336 L1302 356 L1416 402',
    points: [
      [1188, 336],
      [1302, 356],
      [1416, 402]
    ],
    traffic_density: 'Jam',
    order_count: 610,
    avg_delivery_duration_min: 43.6,
    delay_rate: 0.73,
    risk_score: 0.84
  },
  {
    id: 'road-lower-restaurant-west',
    label: '底部餐厅西侧路',
    path: 'M348 756 L482 724 L618 728',
    points: [
      [348, 756],
      [482, 724],
      [618, 728]
    ],
    traffic_density: 'Medium',
    order_count: 720,
    avg_delivery_duration_min: 32.2,
    delay_rate: 0.38,
    risk_score: 0.52
  },
  {
    id: 'road-lower-restaurant-east',
    label: '底部餐厅东侧路',
    path: 'M844 758 L984 802 L1138 780',
    points: [
      [844, 758],
      [984, 802],
      [1138, 780]
    ],
    traffic_density: 'Medium',
    order_count: 650,
    avg_delivery_duration_min: 33.6,
    delay_rate: 0.42,
    risk_score: 0.58
  },
  {
    id: 'road-left-night-local',
    label: '左下夜间支路',
    path: 'M214 508 L318 476 L430 452',
    points: [
      [214, 508],
      [318, 476],
      [430, 452]
    ],
    traffic_density: 'Low',
    order_count: 360,
    avg_delivery_duration_min: 27.4,
    delay_rate: 0.22,
    risk_score: 0.34
  },
  {
    id: 'road-right-customer-gate',
    label: '右下客户区入口路',
    path: 'M1268 552 L1374 590 L1466 652',
    points: [
      [1268, 552],
      [1374, 590],
      [1466, 652]
    ],
    traffic_density: 'Jam',
    order_count: 590,
    avg_delivery_duration_min: 44.8,
    delay_rate: 0.76,
    risk_score: 0.88
  },
  {
    id: 'road-central-left-turn',
    label: '中央路口左转段',
    path: 'M742 426 L796 500 L834 578',
    points: [
      [742, 426],
      [796, 500],
      [834, 578]
    ],
    traffic_density: 'High',
    order_count: 470,
    avg_delivery_duration_min: 36.9,
    delay_rate: 0.51,
    risk_score: 0.67
  },
  {
    id: 'road-central-right-turn',
    label: '中央路口右转段',
    path: 'M1038 504 L1116 574 L1196 654',
    points: [
      [1038, 504],
      [1116, 574],
      [1196, 654]
    ],
    traffic_density: 'Medium',
    order_count: 430,
    avg_delivery_duration_min: 35.4,
    delay_rate: 0.44,
    risk_score: 0.59
  }
];

export const roadPressureNodes: TrafficSegment[] = [
  {
    id: 'node-central-junction',
    label: '中央主干路路口',
    path: 'M780 424 L780 424',
    points: [[780, 424]],
    x: 780,
    y: 424,
    node_kind: 'intersection',
    traffic_density: 'Jam',
    order_count: 760,
    avg_delivery_duration_min: 40.6,
    delay_rate: 0.69,
    risk_score: 0.84
  },
  {
    id: 'node-east-merge',
    label: '东侧汇入口',
    path: 'M1124 496 L1124 496',
    points: [[1124, 496]],
    x: 1124,
    y: 496,
    node_kind: 'merge',
    traffic_density: 'Jam',
    order_count: 640,
    avg_delivery_duration_min: 42.2,
    delay_rate: 0.72,
    risk_score: 0.86
  },
  {
    id: 'node-upper-rain-junction',
    label: '右上雨区路口',
    path: 'M1302 356 L1302 356',
    points: [[1302, 356]],
    x: 1302,
    y: 356,
    node_kind: 'intersection',
    traffic_density: 'High',
    order_count: 520,
    avg_delivery_duration_min: 39.7,
    delay_rate: 0.62,
    risk_score: 0.78
  },
  {
    id: 'node-customer-gate',
    label: '右下客户区入口',
    path: 'M1374 590 L1374 590',
    points: [[1374, 590]],
    x: 1374,
    y: 590,
    node_kind: 'customer_gate',
    traffic_density: 'Jam',
    order_count: 590,
    avg_delivery_duration_min: 44.8,
    delay_rate: 0.76,
    risk_score: 0.88
  },
  {
    id: 'node-restaurant-south',
    label: '底部餐厅路口',
    path: 'M984 802 L984 802',
    points: [[984, 802]],
    x: 984,
    y: 802,
    node_kind: 'restaurant_gate',
    traffic_density: 'Medium',
    order_count: 650,
    avg_delivery_duration_min: 33.6,
    delay_rate: 0.42,
    risk_score: 0.58
  },
  {
    id: 'node-fog-edge',
    label: '左上雾区边缘路口',
    path: 'M520 312 L520 312',
    points: [[520, 312]],
    x: 520,
    y: 312,
    node_kind: 'weather_edge',
    traffic_density: 'High',
    order_count: 540,
    avg_delivery_duration_min: 34.5,
    delay_rate: 0.43,
    risk_score: 0.63
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
