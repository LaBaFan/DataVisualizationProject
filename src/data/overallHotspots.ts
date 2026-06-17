import { SceneHotspot } from '../types/data';

export type { SceneHotspot };

export const overallHotspots: SceneHotspot[] = [
  {
    id: 'overall_risk_hotspot',
    targetSceneId: 'overall',
    targetModule: 'overall',
    label: '高风险组合',
    type: 'polygon',
    coords: [615, 363, 858, 343, 989, 433, 938, 565, 716, 595, 555, 504],
    description: '非地理统计入口，用于回到总览并查看 risk_score、delay_rate 与异常订单的全局基线。',
    order_count: 4613,
    avg_delivery_duration_min: 26.4,
    delay_rate: 0.203,
    risk_score: 0.488
  },
  {
    id: 'sunny_zone_hotspot',
    targetSceneId: 'sunny',
    targetModule: 'sunny',
    label: '晴天 ETA',
    type: 'polygon',
    coords: [504, 0, 989, 0, 1059, 252, 908, 363, 646, 353, 464, 242],
    description: '按 weather == Sunny 过滤订单，查看晴天 ETA 基线、交通、时段、车辆、风险与异常订单。',
    order_count: 7238,
    avg_delivery_duration_min: 21.9,
    delay_rate: 0.102,
    risk_score: 0.44,
    weather: 'Sunny'
  },
  {
    id: 'fog_zone_hotspot',
    targetSceneId: 'fog',
    targetModule: 'fog',
    label: '雾天 ETA',
    type: 'polygon',
    coords: [0, 0, 504, 0, 474, 302, 363, 433, 0, 393],
    description: '按 weather == Fog 过滤订单，分析雾天条件下的 ETA 时长、延迟率与风险组合。',
    order_count: 7604,
    avg_delivery_duration_min: 28.9,
    delay_rate: 0.382,
    risk_score: 0.619,
    weather: 'Fog'
  },
  {
    id: 'storm_zone_hotspot',
    targetSceneId: 'stormy',
    targetModule: 'stormy',
    label: '雷暴 ETA',
    type: 'polygon',
    coords: [1009, 0, 1600, 0, 1600, 423, 1271, 433, 1049, 313],
    description: '按 weather == Stormy 过滤订单，查看强降雨天气下配送时长、延迟率与高风险组合。',
    order_count: 7544,
    avg_delivery_duration_min: 25.9,
    delay_rate: 0.203,
    risk_score: 0.522,
    weather: 'Stormy'
  },
  {
    id: 'sandstorm_zone_hotspot',
    targetSceneId: 'sandstorms',
    targetModule: 'sandstorms',
    label: '沙尘 ETA',
    type: 'polygon',
    coords: [0, 393, 363, 423, 545, 585, 464, 857, 0, 948],
    description: '按 weather == Sandstorms 过滤订单，比较沙尘天气下 ETA 风险和异常订单样本。',
    order_count: 7442,
    avg_delivery_duration_min: 25.9,
    delay_rate: 0.202,
    risk_score: 0.521,
    weather: 'Sandstorms'
  },
  {
    id: 'cloudy_zone_hotspot',
    targetSceneId: 'cloudy',
    targetModule: 'cloudy',
    label: '多云 ETA',
    type: 'polygon',
    coords: [464, 585, 989, 565, 1059, 1000, 363, 1000, 383, 827],
    description: '按 weather == Cloudy 过滤订单，比较多云条件下订单量、交通压力和 ETA 稳定性。',
    order_count: 7485,
    avg_delivery_duration_min: 28.9,
    delay_rate: 0.375,
    risk_score: 0.616,
    weather: 'Cloudy'
  },
  {
    id: 'windy_zone_hotspot',
    targetSceneId: 'windy',
    targetModule: 'windy',
    label: '大风 ETA',
    type: 'polygon',
    coords: [989, 565, 1271, 433, 1600, 423, 1600, 1000, 1059, 1000],
    description: '按 weather == Windy 过滤订单，分析大风条件下配送时长、延迟率和车辆表现。',
    order_count: 7382,
    avg_delivery_duration_min: 26.1,
    delay_rate: 0.212,
    risk_score: 0.515,
    weather: 'Windy'
  }
];
