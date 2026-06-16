import { SceneHotspot } from '../types/data';

export type { SceneHotspot };

export const overallHotspots: SceneHotspot[] = [
  {
    id: 'central_hub_hotspot',
    targetSceneId: 'dispatch_center',
    targetModule: null,
    label: '中心配送运营中心',
    type: 'polygon',
    coords: [615, 363, 858, 343, 989, 433, 938, 565, 716, 595, 555, 504],
    description: '进入中心配送运营中心，观察派单、骑手集结、停车区和出发道路对 ETA 的影响。',
    order_count: 4613,
    avg_delivery_duration_min: 26.4,
    delay_rate: 0.203,
    risk_score: 0.488
  },
  {
    id: 'sunny_zone_hotspot',
    targetSceneId: 'sunny',
    targetModule: 'sunny',
    label: '晴天区域',
    type: 'polygon',
    coords: [504, 0, 989, 0, 1059, 252, 908, 363, 646, 353, 464, 242],
    description: '进入晴天基准模块，作为正常天气下配送效率和 ETA 稳定性的对照区域。',
    order_count: 7238,
    avg_delivery_duration_min: 21.9,
    delay_rate: 0.102,
    risk_score: 0.44,
    weather: 'Sunny'
  },
  {
    id: 'fog_zone_hotspot',
    targetSceneId: 'fog_business',
    targetModule: 'fog',
    label: '雾天商务区',
    type: 'polygon',
    coords: [0, 0, 504, 0, 474, 302, 363, 433, 0, 393],
    description: '进入雾天商务区，分析低能见度、高楼办公区和路线不确定性如何影响配送 ETA。',
    order_count: 7604,
    avg_delivery_duration_min: 28.9,
    delay_rate: 0.382,
    risk_score: 0.619,
    weather: 'Fog'
  },
  {
    id: 'storm_zone_hotspot',
    targetSceneId: 'storm_area',
    targetModule: 'stormy',
    label: '雷暴区域',
    type: 'polygon',
    coords: [1009, 0, 1600, 0, 1600, 423, 1271, 433, 1049, 313],
    description: '进入雷暴区域，查看暴雨、湿滑道路和强反光路面对配送延迟的影响。',
    order_count: 7544,
    avg_delivery_duration_min: 25.9,
    delay_rate: 0.203,
    risk_score: 0.522,
    weather: 'Stormy'
  },
  {
    id: 'sandstorm_zone_hotspot',
    targetSceneId: 'sandstorm',
    targetModule: 'sandstorms',
    label: '沙尘区域',
    type: 'polygon',
    coords: [0, 393, 363, 423, 545, 585, 464, 857, 0, 948],
    description: '进入沙尘天气模块，观察能见度下降、道路状态变差和异常 ETA 的关系。',
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
    label: '多云区域',
    type: 'polygon',
    coords: [464, 585, 989, 565, 1059, 1000, 363, 1000, 383, 827],
    description: '进入多云区域，比较中等天气影响下订单量、交通压力和 ETA 稳定性。',
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
    label: '大风区域',
    type: 'polygon',
    coords: [989, 565, 1271, 433, 1600, 423, 1600, 1000, 1059, 1000],
    description: '进入大风区域，分析临水道路、桥梁和强风对骑手速度与路线耗时的影响。',
    order_count: 7382,
    avg_delivery_duration_min: 26.1,
    delay_rate: 0.212,
    risk_score: 0.515,
    weather: 'Windy'
  }
];
