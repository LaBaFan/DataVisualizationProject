import { MiniMetricTag, OrderDot, RiskHeatHalo } from '../types/data';

export type SceneRiskHeatHalo = RiskHeatHalo & { sceneId: string };
export type SceneOrderDot = OrderDot & { sceneId: string };
export type SceneMiniMetricTag = MiniMetricTag & { sceneId: string };

export const sceneRiskHeatHalos: SceneRiskHeatHalo[] = [
  { sceneId: 'overall', id: 'overall-halo-restaurant', label: '餐饮街区风险团', x: 330, y: 625, radius: 150, order_count: 610, avg_delivery_duration_min: 39.4, delay_rate: 0.43, risk_score: 0.7, traffic_density: 'High' },
  { sceneId: 'overall', id: 'overall-halo-storm', label: '雷暴延迟团', x: 1295, y: 690, radius: 175, order_count: 344, avg_delivery_duration_min: 49.8, delay_rate: 0.64, risk_score: 0.88, weather: 'Stormy', traffic_density: 'Jam' },
  { sceneId: 'overall', id: 'overall-halo-traffic', label: '主干道拥堵团', x: 940, y: 650, radius: 140, order_count: 702, avg_delivery_duration_min: 44.2, delay_rate: 0.52, risk_score: 0.79, traffic_density: 'High' },
  { sceneId: 'dispatch_center', id: 'dispatch-halo-capacity', label: '出发口派单热晕', x: 760, y: 515, radius: 135, order_count: 438, avg_delivery_duration_min: 34.8, delay_rate: 0.31, risk_score: 0.58, time_period: 'lunch_peak' },
  { sceneId: 'restaurant_street', id: 'restaurant-halo-pickup', label: '餐厅取餐等待热晕', x: 520, y: 560, radius: 160, order_count: 610, avg_delivery_duration_min: 39.4, delay_rate: 0.43, risk_score: 0.7, traffic_density: 'High' },
  { sceneId: 'fog_business', id: 'fog-halo-tower', label: '商务楼低能见度热晕', x: 900, y: 390, radius: 150, order_count: 286, avg_delivery_duration_min: 42.1, delay_rate: 0.48, risk_score: 0.74, weather: 'Fog', traffic_density: 'Medium' },
  { sceneId: 'storm_area', id: 'storm-halo-flooded', label: '暴雨积压热晕', x: 860, y: 610, radius: 180, order_count: 344, avg_delivery_duration_min: 49.8, delay_rate: 0.64, risk_score: 0.88, weather: 'Stormy', traffic_density: 'Jam' },
  { sceneId: 'high_risk_residential', id: 'risk-halo-residential', label: '住宅末端高风险热晕', x: 980, y: 600, radius: 170, order_count: 520, avg_delivery_duration_min: 46.6, delay_rate: 0.57, risk_score: 0.83, time_period: 'dinner_peak' },
  { sceneId: 'night_low_peak', id: 'night-halo-long-distance', label: '夜间长距离热晕', x: 690, y: 475, radius: 130, order_count: 148, avg_delivery_duration_min: 31.7, delay_rate: 0.22, risk_score: 0.42, time_period: 'night' },
  { sceneId: 'traffic_hub', id: 'traffic-halo-mainline', label: '主干道拥堵热晕', x: 815, y: 555, radius: 165, order_count: 702, avg_delivery_duration_min: 44.2, delay_rate: 0.52, risk_score: 0.79, traffic_density: 'High' },
  { sceneId: 'mixed_food_community', id: 'mixed-halo-dual-pressure', label: '供需双端压力热晕', x: 760, y: 540, radius: 150, order_count: 474, avg_delivery_duration_min: 37.5, delay_rate: 0.38, risk_score: 0.66 },
  { sceneId: 'sunny', id: 'sunny-halo-baseline', label: '晴天基准热晕', x: 730, y: 500, radius: 120, order_count: 392, avg_delivery_duration_min: 30.2, delay_rate: 0.18, risk_score: 0.34, weather: 'Sunny' },
  { sceneId: 'sandstorm', id: 'sandstorm-halo-visibility', label: '沙尘能见度热晕', x: 820, y: 510, radius: 150, order_count: 260, avg_delivery_duration_min: 41.3, delay_rate: 0.46, risk_score: 0.72, weather: 'Sandstorms', traffic_density: 'Medium' },
  { sceneId: 'cloudy', id: 'cloudy-halo-unstable-eta', label: '多云 ETA 波动热晕', x: 805, y: 505, radius: 138, order_count: 318, avg_delivery_duration_min: 35.6, delay_rate: 0.29, risk_score: 0.52, weather: 'Cloudy', traffic_density: 'Medium' },
  { sceneId: 'windy', id: 'windy-halo-speed', label: '大风速度波动热晕', x: 760, y: 520, radius: 142, order_count: 220, avg_delivery_duration_min: 36.8, delay_rate: 0.33, risk_score: 0.55, weather: 'Windy' }
];

export const sceneOrderDots: SceneOrderDot[] = [
  { sceneId: 'overall', id: 'overall-dot-dispatch', x: 790, y: 470, order_count: 78, delivery_duration_min: 33, delay_rate: 0.28, risk_score: 0.48, time_period: 'lunch_peak' },
  { sceneId: 'overall', id: 'overall-dot-fog', x: 1160, y: 330, order_count: 46, delivery_duration_min: 43, delay_rate: 0.5, risk_score: 0.72, weather: 'Fog' },
  { sceneId: 'overall', id: 'overall-dot-night', x: 330, y: 245, order_count: 26, delivery_duration_min: 32, delay_rate: 0.2, risk_score: 0.38, time_period: 'night' },
  { sceneId: 'dispatch_center', id: 'dispatch-dot-gate-a', x: 650, y: 465, order_count: 62, delivery_duration_min: 32, delay_rate: 0.26, risk_score: 0.46, order_id: 'dispatch-gate-a' },
  { sceneId: 'dispatch_center', id: 'dispatch-dot-gate-b', x: 925, y: 555, order_count: 54, delivery_duration_min: 37, delay_rate: 0.35, risk_score: 0.59, order_id: 'dispatch-gate-b' },
  { sceneId: 'restaurant_street', id: 'restaurant-dot-lane', x: 410, y: 640, order_count: 82, delivery_duration_min: 41, delay_rate: 0.45, risk_score: 0.72, traffic_density: 'High' },
  { sceneId: 'restaurant_street', id: 'restaurant-dot-mall', x: 720, y: 520, order_count: 68, delivery_duration_min: 38, delay_rate: 0.4, risk_score: 0.64 },
  { sceneId: 'fog_business', id: 'fog-dot-office-a', x: 700, y: 420, order_count: 34, delivery_duration_min: 43, delay_rate: 0.5, risk_score: 0.73, weather: 'Fog' },
  { sceneId: 'fog_business', id: 'fog-dot-office-b', x: 1040, y: 535, order_count: 29, delivery_duration_min: 40, delay_rate: 0.44, risk_score: 0.68, weather: 'Fog' },
  { sceneId: 'storm_area', id: 'storm-dot-east', x: 690, y: 680, order_count: 42, delivery_duration_min: 52, delay_rate: 0.7, risk_score: 0.9, weather: 'Stormy', traffic_density: 'Jam' },
  { sceneId: 'storm_area', id: 'storm-dot-west', x: 1040, y: 480, order_count: 38, delivery_duration_min: 47, delay_rate: 0.58, risk_score: 0.82, weather: 'Stormy' },
  { sceneId: 'high_risk_residential', id: 'risk-dot-block-a', x: 880, y: 680, order_count: 74, delivery_duration_min: 48, delay_rate: 0.59, risk_score: 0.84, time_period: 'dinner_peak' },
  { sceneId: 'high_risk_residential', id: 'risk-dot-block-b', x: 1110, y: 520, order_count: 61, delivery_duration_min: 45, delay_rate: 0.55, risk_score: 0.8 },
  { sceneId: 'night_low_peak', id: 'night-dot-arterial', x: 580, y: 525, order_count: 22, delivery_duration_min: 35, delay_rate: 0.24, risk_score: 0.44, time_period: 'night' },
  { sceneId: 'night_low_peak', id: 'night-dot-remote', x: 930, y: 410, order_count: 18, delivery_duration_min: 38, delay_rate: 0.29, risk_score: 0.5, time_period: 'night' },
  { sceneId: 'traffic_hub', id: 'traffic-dot-merge', x: 720, y: 555, order_count: 88, delivery_duration_min: 46, delay_rate: 0.55, risk_score: 0.8, traffic_density: 'Jam' },
  { sceneId: 'traffic_hub', id: 'traffic-dot-exit', x: 1060, y: 610, order_count: 64, delivery_duration_min: 42, delay_rate: 0.48, risk_score: 0.72, traffic_density: 'High' },
  { sceneId: 'mixed_food_community', id: 'mixed-dot-food', x: 585, y: 535, order_count: 58, delivery_duration_min: 36, delay_rate: 0.34, risk_score: 0.58 },
  { sceneId: 'mixed_food_community', id: 'mixed-dot-community', x: 965, y: 615, order_count: 66, delivery_duration_min: 39, delay_rate: 0.42, risk_score: 0.67 },
  { sceneId: 'sunny', id: 'sunny-dot-baseline-a', x: 620, y: 540, order_count: 52, delivery_duration_min: 29, delay_rate: 0.16, risk_score: 0.32, weather: 'Sunny' },
  { sceneId: 'sunny', id: 'sunny-dot-baseline-b', x: 940, y: 475, order_count: 48, delivery_duration_min: 31, delay_rate: 0.2, risk_score: 0.36, weather: 'Sunny' },
  { sceneId: 'sandstorm', id: 'sandstorm-dot-crossing', x: 700, y: 590, order_count: 36, delivery_duration_min: 42, delay_rate: 0.48, risk_score: 0.74, weather: 'Sandstorms' },
  { sceneId: 'sandstorm', id: 'sandstorm-dot-edge', x: 1010, y: 460, order_count: 31, delivery_duration_min: 39, delay_rate: 0.4, risk_score: 0.66, weather: 'Sandstorms' },
  { sceneId: 'cloudy', id: 'cloudy-dot-market-edge', x: 650, y: 565, order_count: 44, delivery_duration_min: 36, delay_rate: 0.3, risk_score: 0.54, weather: 'Cloudy', traffic_density: 'Medium' },
  { sceneId: 'cloudy', id: 'cloudy-dot-community-loop', x: 980, y: 455, order_count: 39, delivery_duration_min: 34, delay_rate: 0.26, risk_score: 0.48, weather: 'Cloudy' },
  { sceneId: 'windy', id: 'windy-dot-rider-a', x: 655, y: 570, order_count: 32, delivery_duration_min: 37, delay_rate: 0.34, risk_score: 0.56, weather: 'Windy' },
  { sceneId: 'windy', id: 'windy-dot-rider-b', x: 980, y: 455, order_count: 28, delivery_duration_min: 35, delay_rate: 0.31, risk_score: 0.52, weather: 'Windy' }
];

export const sceneMiniMetricTags: SceneMiniMetricTag[] = [
  { sceneId: 'overall', id: 'overall-tag-risk', label: '全局高风险', x: 1030, y: 730, delay_rate: 0.52, avg_delivery_duration_min: 44.2, order_count: 702, risk_score: 0.79, traffic_density: 'High' },
  { sceneId: 'overall', id: 'overall-tag-weather', label: '天气异常', x: 1185, y: 430, delay_rate: 0.48, avg_delivery_duration_min: 42.1, order_count: 286, risk_score: 0.74, weather: 'Fog' },
  { sceneId: 'dispatch_center', id: 'dispatch-tag-throughput', label: '派单吞吐', x: 980, y: 405, delay_rate: 0.31, avg_delivery_duration_min: 34.8, order_count: 438, risk_score: 0.58 },
  { sceneId: 'restaurant_street', id: 'restaurant-tag-wait', label: '取餐等待', x: 800, y: 650, delay_rate: 0.43, avg_delivery_duration_min: 39.4, order_count: 610, risk_score: 0.7 },
  { sceneId: 'fog_business', id: 'fog-tag-visibility', label: '能见度风险', x: 1060, y: 365, delay_rate: 0.48, avg_delivery_duration_min: 42.1, order_count: 286, risk_score: 0.74, weather: 'Fog' },
  { sceneId: 'storm_area', id: 'storm-tag-delay', label: '暴雨延迟', x: 980, y: 715, delay_rate: 0.64, avg_delivery_duration_min: 49.8, order_count: 344, risk_score: 0.88, weather: 'Stormy' },
  { sceneId: 'high_risk_residential', id: 'risk-tag-last-mile', label: '末端风险', x: 1115, y: 725, delay_rate: 0.57, avg_delivery_duration_min: 46.6, order_count: 520, risk_score: 0.83 },
  { sceneId: 'night_low_peak', id: 'night-tag-low-peak', label: '低峰长距', x: 930, y: 545, delay_rate: 0.22, avg_delivery_duration_min: 31.7, order_count: 148, risk_score: 0.42, time_period: 'night' },
  { sceneId: 'traffic_hub', id: 'traffic-tag-jam', label: '拥堵瓶颈', x: 1040, y: 705, delay_rate: 0.52, avg_delivery_duration_min: 44.2, order_count: 702, risk_score: 0.79, traffic_density: 'High' },
  { sceneId: 'mixed_food_community', id: 'mixed-tag-balance', label: '供需错位', x: 975, y: 500, delay_rate: 0.38, avg_delivery_duration_min: 37.5, order_count: 474, risk_score: 0.66 },
  { sceneId: 'sunny', id: 'sunny-tag-baseline', label: '晴天基准', x: 955, y: 570, delay_rate: 0.18, avg_delivery_duration_min: 30.2, order_count: 392, risk_score: 0.34, weather: 'Sunny' },
  { sceneId: 'sandstorm', id: 'sandstorm-tag-air', label: '沙尘影响', x: 1035, y: 585, delay_rate: 0.46, avg_delivery_duration_min: 41.3, order_count: 260, risk_score: 0.72, weather: 'Sandstorms' },
  { sceneId: 'cloudy', id: 'cloudy-tag-stability', label: '多云稳定性', x: 1005, y: 585, delay_rate: 0.29, avg_delivery_duration_min: 35.6, order_count: 318, risk_score: 0.52, weather: 'Cloudy', traffic_density: 'Medium' },
  { sceneId: 'windy', id: 'windy-tag-speed', label: '速度波动', x: 980, y: 590, delay_rate: 0.33, avg_delivery_duration_min: 36.8, order_count: 220, risk_score: 0.55, weather: 'Windy' }
];
