import { MapModule } from '../types/data';

export const mapModules: MapModule[] = [
  // Left fog district towers under the "Fog · Jam · Night" label.
  {
    id: 'fog_jam_night_towers',
    type: 'building',
    label: '雾 · 堵塞 · 夜间',
    description: '左侧雾区高楼，表示雾天、拥堵交通和夜间配送组合。',
    shape: 'polygon',
    coords: [158, 246, 416, 138, 610, 262, 590, 426, 322, 438, 142, 334],
    weather: 'Fog',
    traffic_density: 'Jam',
    time_period: 'night',
    order_count: 420,
    avg_delivery_duration_min: 40.2,
    delay_rate: 0.62,
    avg_distance_km: 7.6,
    risk_score: 0.76
  },
  // Central restaurant / dispatch building below the central scenario label.
  {
    id: 'central_dispatch_restaurant',
    type: 'restaurant',
    label: '中央主餐厅 / 调度楼',
    description: '主要订单起点和骑手调度区域。',
    shape: 'polygon',
    coords: [724, 318, 900, 250, 1042, 346, 1040, 514, 872, 620, 696, 510, 684, 384],
    order_count: 1180,
    avg_delivery_duration_min: 31.8,
    delay_rate: 0.34,
    avg_distance_km: 5.4,
    risk_score: 0.58
  },
  // Top-right storm/rain weather district and dark mountain-backed buildings.
  {
    id: 'storm_top_right_zone',
    type: 'weather',
    label: '大雨 · 堵塞 · 夜间',
    description: '右上强降雨区域，高交通压力下延迟风险上升。',
    shape: 'polygon',
    coords: [1192, 106, 1504, 118, 1570, 326, 1428, 474, 1192, 420, 1126, 242],
    weather: 'Rainy',
    traffic_density: 'Jam',
    time_period: 'night',
    order_count: 510,
    avg_delivery_duration_min: 43.6,
    delay_rate: 0.71,
    avg_distance_km: 8.9,
    risk_score: 0.84
  },
  // Bottom-right rainy risk zone around the "Rainy · Jam · Night" label.
  {
    id: 'storm_bottom_right_zone',
    type: 'risk_zone',
    label: '暴雨 · 堵塞 · 夜间',
    description: '右下暴雨配送区，表示高延迟风险场景。',
    shape: 'polygon',
    coords: [1192, 556, 1468, 514, 1542, 678, 1418, 856, 1214, 814, 1108, 668],
    scenario_id: 'Stormy|Jam|night|motorcycle',
    weather: 'Stormy',
    traffic_density: 'Jam',
    time_period: 'night',
    vehicle_type: 'motorcycle',
    order_count: 365,
    avg_delivery_duration_min: 46.4,
    delay_rate: 0.79,
    avg_distance_km: 9.4,
    risk_score: 0.91
  },
  // Lower-left night motorcycle zone following the glowing night block.
  {
    id: 'night_motorcycle_zone',
    type: 'risk_zone',
    label: '夜间 · 摩托车',
    description: '左下夜间摩托车配送区域，适合查看夜间车辆风险。',
    shape: 'polygon',
    coords: [178, 472, 496, 420, 728, 530, 710, 756, 402, 852, 180, 724],
    scenario_id: 'Night|Motorcycle',
    time_period: 'night',
    vehicle_type: 'motorcycle',
    order_count: 680,
    avg_delivery_duration_min: 36.7,
    delay_rate: 0.48,
    avg_distance_km: 7.1,
    risk_score: 0.69
  },
  // Central congested road segment; short path along the visible central road only.
  {
    id: 'central_jam_road',
    type: 'road',
    label: '中央主拥堵道路段',
    description: '地图中央主干路，拥堵程度高，影响跨区配送 ETA。',
    shape: 'path',
    coords: 'M516 410 C650 366 786 390 922 462 C1024 516 1128 514 1252 468',
    traffic_density: 'Jam',
    order_count: 960,
    avg_delivery_duration_min: 39.1,
    delay_rate: 0.66,
    avg_distance_km: 7.8,
    risk_score: 0.82
  },
  // Upper road segment from the fog district toward the central restaurant area.
  {
    id: 'upper_road_segment',
    type: 'road',
    label: '上方道路段',
    description: '连接雾区和右上天气区的上方配送路线。',
    shape: 'path',
    coords: 'M428 330 C566 260 676 246 818 294 C954 342 1058 346 1168 304',
    traffic_density: 'High',
    order_count: 540,
    avg_delivery_duration_min: 34.5,
    delay_rate: 0.43,
    avg_distance_km: 6.8,
    risk_score: 0.63
  },
  // Lower road segment following the road below the night block and restaurants.
  {
    id: 'lower_road_segment',
    type: 'road',
    label: '下方道路段',
    description: '连接夜间摩托车区域和客户区的下方道路。',
    shape: 'path',
    coords: 'M318 760 C514 706 694 704 862 766 C1010 822 1150 800 1290 728',
    traffic_density: 'Medium',
    order_count: 720,
    avg_delivery_duration_min: 32.2,
    delay_rate: 0.38,
    avg_distance_km: 6.2,
    risk_score: 0.52
  },
  // Left restaurant cluster near the map's lower-left restaurant buildings.
  {
    id: 'left_restaurant',
    type: 'restaurant',
    label: '左侧餐厅模块',
    description: '左侧订单起点，主要服务雾区和夜间配送。',
    shape: 'circle',
    coords: [214, 462, 72],
    order_count: 520,
    avg_delivery_duration_min: 33.6,
    delay_rate: 0.41,
    avg_distance_km: 5.9,
    risk_score: 0.57
  },
  // Right restaurant building beside the rainy/customer side road.
  {
    id: 'right_restaurant',
    type: 'restaurant',
    label: '右侧餐厅模块',
    description: '右侧订单起点，受雨天和拥堵路段影响较明显。',
    shape: 'circle',
    coords: [1210, 456, 76],
    order_count: 610,
    avg_delivery_duration_min: 37.8,
    delay_rate: 0.55,
    avg_distance_km: 7.2,
    risk_score: 0.72
  },
  // Bottom restaurant cluster around the lower central shop buildings.
  {
    id: 'bottom_restaurant',
    type: 'restaurant',
    label: '底部餐厅模块',
    description: '底部餐厅节点，连接夜间配送和客户目的地区域。',
    shape: 'circle',
    coords: [724, 826, 82],
    order_count: 460,
    avg_delivery_duration_min: 29.4,
    delay_rate: 0.28,
    avg_distance_km: 4.8,
    risk_score: 0.43
  },
  // Customer destination area on the right-side delivery blocks.
  {
    id: 'customer_destination_area',
    type: 'customer_area',
    label: '客户 / 配送目的地区域',
    description: '右侧客户收货区域，点击查看目的地区域配送表现。',
    shape: 'polygon',
    coords: [1206, 376, 1508, 430, 1542, 650, 1324, 766, 1126, 636, 1134, 466],
    order_count: 1320,
    avg_delivery_duration_min: 35.2,
    delay_rate: 0.46,
    avg_distance_km: 7.4,
    risk_score: 0.64
  },
  // Central cloudy/jam/night/motorcycle risk zone around the main dispatch building.
  {
    id: 'cloudy_jam_night_motorcycle',
    type: 'risk_zone',
    label: '多云 · 堵塞 · 夜间 · 摩托车',
    description: '多云天气、拥堵交通、夜间时段下的摩托车配送风险场景。',
    shape: 'polygon',
    coords: [706, 184, 1028, 170, 1132, 294, 1050, 454, 820, 428, 666, 300],
    scenario_id: 'Cloudy|Jam|night|motorcycle',
    weather: 'Cloudy',
    traffic_density: 'Jam',
    time_period: 'night',
    vehicle_type: 'motorcycle',
    order_count: 94,
    avg_delivery_duration_min: 44.5,
    delay_rate: 0.989,
    avg_distance_km: 8.4,
    risk_score: 0.89
  },
  // Rider pool next to the central roads and dispatch building.
  {
    id: 'rider_pool',
    type: 'rider',
    label: '骑手集合点',
    description: '骑手等待和接单区域，用于观察车辆与 ETA 风险。',
    shape: 'circle',
    coords: [622, 560, 54],
    vehicle_type: 'motorcycle',
    order_count: 310,
    avg_delivery_duration_min: 30.6,
    delay_rate: 0.31,
    avg_distance_km: 5.2,
    risk_score: 0.46
  }
];
