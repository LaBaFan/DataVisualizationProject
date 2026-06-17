import { MapScene, MapSceneType } from '../types/data';

export type { MapScene, MapSceneType };

export const mapScenes: MapScene[] = [
  {
    id: 'overall',
    type: 'overall',
    title: 'FoodETA 总览地图',
    question: '当前城市配送系统中，哪些天气条件和数据组合最需要调度关注？',
    description: '总览图用于进入各个天气模块，并保留轻量风险、订单密度和指标标签，帮助快速定位 ETA 风险来源。',
    image: '/assets/backgrounds/overall.png',
    summary: {
      order_count: 45162,
      avg_delivery_duration_min: 26.298,
      delay_rate: 0.247,
      risk_score: 0.631,
      avg_distance_km: 9.735,
      delay_threshold_min: 32.0,
      source_filter: "all clean orders",
      description: "全量清洗订单。"
    },
    metrics: [
      { label: '入口热区', value: '8+' },
      { label: '地图比例', value: '1600 x 1000' },
      { label: '默认视图', value: '总览' }
    ]
  },
  {
    id: 'dispatch_center',
    type: 'area',
    title: '配送中心调度区',
    question: '配送中心附近的派单压力是否正在推高平均 ETA？',
    description: '聚焦骑手出发、补货和派单密集区域，观察订单聚集、风险热晕与调度标签。',
    image: '/assets/maps/dispatch_center.png',
    summary: {
      order_count: 4613,
      avg_delivery_duration_min: 26.427,
      delay_rate: 0.203,
      risk_score: 0.488,
      avg_distance_km: 7.292,
      delay_threshold_min: 32.0,
      source_filter: "time_period in [lunch_peak, dinner_peak] AND city in [Metropolitian, Urban] AND distance_km between q25 and median AND (multiple_deliveries >= 1 OR vehicle_type == motorcycle)",
      description: "都市峰值短中距离且具备多单或摩托配送特征的订单，作为配送中心出发与派单压力 proxy。"
    },
    metrics: [
      { label: '核心能力', value: 'Dispatch' },
      { label: '压力来源', value: '派单峰值' },
      { label: '建议动作', value: '补充运力' }
    ]
  },
  {
    id: 'restaurant_street',
    type: 'area',
    title: '餐饮街区取餐区',
    question: '餐饮街区的取餐排队是否造成短距离长耗时？',
    description: '呈现商圈餐厅密集带的取餐等待、订单堆积和局部延迟风险。',
    image: '/assets/maps/restaurant_street.png',
    summary: {
      order_count: 11620,
      avg_delivery_duration_min: 24.569,
      delay_rate: 0.155,
      risk_score: 0.454,
      avg_distance_km: 5.05,
      delay_threshold_min: 32.0,
      source_filter: "time_period in [lunch_peak, dinner_peak] AND order_type not null AND distance_km <= median",
      description: "餐饮峰值短距离订单，作为餐饮街区取餐压力 proxy。"
    },
    metrics: [
      { label: '订单来源', value: '餐饮街区' },
      { label: '典型风险', value: '取餐等待' },
      { label: '关注指标', value: '延迟率' }
    ]
  },
  {
    id: 'fog_business',
    type: 'weather',
    title: '雾天 ETA 模块',
    question: '低能见度天气下，ETA 如何变慢？',
    description: '雾天模块用于观察 weather == Fog 条件下的订单量、配送时长、延迟率和风险评分。',
    image: '/assets/backgrounds/fog.png',
    relatedWeather: 'Fog',
    summary: {
      order_count: 7604,
      avg_delivery_duration_min: 28.933,
      delay_rate: 0.382,
      risk_score: 0.619,
      avg_distance_km: 9.77,
      delay_threshold_min: 32.0,
      source_filter: "weather == Fog",
      description: "weather == Fog 的订单样本。"
    },
    metrics: [
      { label: '天气', value: 'Fog' },
      { label: '字段', value: 'weather' },
      { label: '关注指标', value: '延迟率' }
    ]
  },
  {
    id: 'storm_area',
    type: 'weather',
    title: '雷暴 ETA 模块',
    question: '暴雨雷暴是否导致高延迟率场景集中出现？',
    description: '雷暴模块用于观察 weather == Stormy 条件下的订单量、配送时长、延迟率和风险评分。',
    image: '/assets/backgrounds/stormy.png',
    relatedWeather: 'Stormy',
    summary: {
      order_count: 7544,
      avg_delivery_duration_min: 25.866,
      delay_rate: 0.203,
      risk_score: 0.522,
      avg_distance_km: 9.749,
      delay_threshold_min: 32.0,
      source_filter: "weather == Stormy",
      description: "weather == Stormy 的订单样本。"
    },
    metrics: [
      { label: '天气', value: 'Stormy' },
      { label: '风险', value: '高延迟' },
      { label: '调度', value: '降载' }
    ]
  },
  {
    id: 'high_risk_residential',
    type: 'risk',
    title: '高风险住宅区',
    question: '高风险住宅区中的哪些订单组合最容易超过 ETA？',
    description: '高风险模块聚焦住宅末端配送、重复配送和较高延迟率的空间聚集。',
    image: '/assets/maps/high_risk_residential.png',
    summary: {
      order_count: 7264,
      avg_delivery_duration_min: 40.078,
      delay_rate: 1.0,
      risk_score: 0.892,
      avg_distance_km: 12.057,
      delay_threshold_min: 32.0,
      source_filter: "is_delayed == true AND delivery_duration >= p75 AND traffic_density in [High, Jam]",
      description: "高延迟且高交通压力订单，作为住宅末端高风险 proxy。"
    },
    metrics: [
      { label: '场景', value: 'Residential' },
      { label: '风险', value: 'High' },
      { label: '重点', value: '末端配送' }
    ]
  },
  {
    id: 'night_low_peak',
    type: 'time',
    title: '夜间低峰区',
    question: '夜间低峰是否降低订单压力，还是带来新的配送不确定性？',
    description: '夜间模块用于比较低峰订单量、长距离样本和夜间交通变化对 ETA 的影响。',
    image: '/assets/maps/night_low_peak.png',
    relatedTimePeriod: 'night',
    summary: {
      order_count: 14653,
      avg_delivery_duration_min: 25.554,
      delay_rate: 0.218,
      risk_score: 0.573,
      avg_distance_km: 12.015,
      delay_threshold_min: 32.0,
      source_filter: "time_period == night",
      description: "夜间订单。"
    },
    metrics: [
      { label: '时段', value: 'Night' },
      { label: '订单压力', value: 'Low' },
      { label: '风险点', value: '长距离' }
    ]
  },
  {
    id: 'traffic_hub',
    type: 'traffic',
    title: '交通主干道压力区',
    question: '交通主干道拥堵是否是 ETA 延迟的主要瓶颈？',
    description: '交通模块关注主干道路、拥堵节点和道路压力对配送时长的影响。',
    image: '/assets/maps/traffic_hub.png',
    summary: {
      order_count: 18450,
      avg_delivery_duration_min: 30.238,
      delay_rate: 0.394,
      risk_score: 0.677,
      avg_distance_km: 10.24,
      delay_threshold_min: 32.0,
      source_filter: "traffic_density in [High, Jam]",
      description: "高交通压力订单，作为主干道压力 proxy。"
    },
    metrics: [
      { label: '交通', value: 'High/Jam' },
      { label: '瓶颈', value: '主干道' },
      { label: '指标', value: 'Traffic' }
    ]
  },
  {
    id: 'mixed_food_community',
    type: 'area',
    title: '餐饮社区混合区',
    question: '餐饮与住宅混合区如何形成取餐和送达双重压力？',
    description: '混合区模块同时展示餐厅供给端和社区需求端的订单密度与延迟风险。',
    image: '/assets/maps/mixed_food_community.png',
    summary: {
      order_count: 6118,
      avg_delivery_duration_min: 30.617,
      delay_rate: 0.434,
      risk_score: 0.667,
      avg_distance_km: 11.409,
      delay_threshold_min: 32.0,
      source_filter: "time_period in [lunch_peak, dinner_peak] AND city in [Metropolitian, Urban] AND order_type not null AND distance_km between median and q75 AND NOT dispatch_center",
      description: "都市峰值中长距离餐饮订单，排除配送中心出发压力样本后作为餐饮社区混合区 proxy。"
    },
    metrics: [
      { label: '结构', value: 'Mixed' },
      { label: '压力', value: '双端聚集' },
      { label: '对象', value: '餐饮+社区' }
    ]
  },
  {
    id: 'sunny',
    type: 'weather',
    title: '晴天 ETA 基线',
    question: '晴天条件下的 ETA 基准表现是什么？',
    description: '晴天模块作为 weather == Sunny 的基线，用于对照其他天气下的 ETA 波动。',
    image: '/assets/backgrounds/sunny.png',
    relatedWeather: 'Sunny',
    summary: {
      order_count: 7238,
      avg_delivery_duration_min: 21.855,
      delay_rate: 0.102,
      risk_score: 0.44,
      avg_distance_km: 9.626,
      delay_threshold_min: 32.0,
      source_filter: "weather == Sunny",
      description: "晴天订单，用作天气基准。"
    },
    metrics: [
      { label: '天气', value: 'Sunny' },
      { label: '用途', value: '基准' },
      { label: '风险', value: '低-中' }
    ]
  },
  {
    id: 'sandstorm',
    type: 'weather',
    title: '沙尘 ETA 模块',
    question: '沙尘天气是否改变骑手速度和订单履约稳定性？',
    description: '沙尘模块用于观察 weather == Sandstorms 条件下的配送时长、延迟率和风险评分。',
    image: '/assets/backgrounds/sandstorms.png',
    relatedWeather: 'Sandstorms',
    summary: {
      order_count: 7442,
      avg_delivery_duration_min: 25.872,
      delay_rate: 0.202,
      risk_score: 0.521,
      avg_distance_km: 9.686,
      delay_threshold_min: 32.0,
      source_filter: "weather == Sandstorms",
      description: "沙尘天气订单。"
    },
    metrics: [
      { label: '天气', value: 'Sandstorms' },
      { label: '影响', value: '能见度' },
      { label: '风险', value: '中高' }
    ]
  },
  {
    id: 'cloudy',
    type: 'weather',
    title: '多云 ETA 模块',
    question: '多云天气下，订单压力和配送时长是否出现温和但持续的波动？',
    description: '多云模块用于观察 weather == Cloudy 条件下的 ETA 稳定性、订单量和延迟率。',
    image: '/assets/backgrounds/cloudy.png',
    relatedWeather: 'Cloudy',
    summary: {
      order_count: 7485,
      avg_delivery_duration_min: 28.922,
      delay_rate: 0.375,
      risk_score: 0.616,
      avg_distance_km: 9.802,
      delay_threshold_min: 32.0,
      source_filter: "weather == Cloudy",
      description: "多云天气订单。"
    },
    metrics: [
      { label: '天气', value: 'Cloudy' },
      { label: '影响', value: '稳定性波动' },
      { label: '风险', value: '中' }
    ]
  },
  {
    id: 'windy',
    type: 'weather',
    title: '大风 ETA 模块',
    question: '大风天气是否会提高骑手路径和速度的不稳定性？',
    description: '大风模块用于观察 weather == Windy 条件下的配送时长、延迟率和风险评分。',
    image: '/assets/backgrounds/windy.png',
    relatedWeather: 'Windy',
    summary: {
      order_count: 7382,
      avg_delivery_duration_min: 26.128,
      delay_rate: 0.212,
      risk_score: 0.528,
      avg_distance_km: 9.776,
      delay_threshold_min: 32.0,
      source_filter: "weather == Windy",
      description: "大风天气订单。"
    },
    metrics: [
      { label: '天气', value: 'Windy' },
      { label: '影响', value: '速度波动' },
      { label: '风险', value: '中' }
    ]
  }
];

export function getMapSceneById(sceneId: string) {
  return mapScenes.find((scene) => scene.id === sceneId) ?? mapScenes[0];
}
