import { MapScene, MapSceneType } from '../types/data';

export type { MapScene, MapSceneType };

export const mapScenes: MapScene[] = [
  {
    id: 'overall',
    type: 'overall',
    title: 'FoodETA 总览地图',
    question: '当前城市配送系统中，哪些天气条件最需要调度关注？',
    description: '总览图用于进入六个天气模块，并保留订单量、平均配送时长、延迟率和平均距离等全局基线。',
    image: '/assets/backgrounds/overall.png',
    summary: {
      order_count: 45162,
      avg_delivery_duration_min: 26.298,
      delay_rate: 0.247,
      avg_distance_km: 9.735,
      delay_threshold_min: 32.0,
      source_filter: 'all clean orders',
      description: '全量清洗订单。'
    },
    metrics: [
      { label: '天气模块', value: '6' },
      { label: '有效订单', value: '45,162' },
      { label: '默认视图', value: '总览' }
    ]
  },
  {
    id: 'sunny',
    type: 'weather',
    title: '晴天 ETA 模块',
    question: '晴天条件下的 ETA 基准表现是什么？',
    description: '晴天模块作为 weather == Sunny 的基线，用于对照其他天气下的 ETA 波动。',
    image: '/assets/backgrounds/sunny.png',
    relatedWeather: 'Sunny',
    summary: {
      order_count: 7238,
      avg_delivery_duration_min: 21.855,
      delay_rate: 0.102,
      avg_distance_km: 9.626,
      delay_threshold_min: 32.0,
      source_filter: 'weather == Sunny',
      description: '晴天订单，用作天气基准。'
    },
    metrics: [
      { label: '天气', value: 'Sunny' },
      { label: '用途', value: '基准' },
      { label: '入口', value: 'Weather Module' }
    ]
  },
  {
    id: 'fog',
    type: 'weather',
    title: '雾天 ETA 模块',
    question: '低能见度天气下，ETA 如何变慢？',
    description: '雾天模块用于观察 weather == Fog 条件下的订单量、配送时长、延迟率和平均距离。',
    image: '/assets/backgrounds/fog.png',
    relatedWeather: 'Fog',
    summary: {
      order_count: 7604,
      avg_delivery_duration_min: 28.933,
      delay_rate: 0.382,
      avg_distance_km: 9.77,
      delay_threshold_min: 32.0,
      source_filter: 'weather == Fog',
      description: 'weather == Fog 的订单样本。'
    },
    metrics: [
      { label: '天气', value: 'Fog' },
      { label: '字段', value: 'weather' },
      { label: '关注', value: '延迟率' }
    ]
  },
  {
    id: 'stormy',
    type: 'weather',
    title: '雷暴 ETA 模块',
    question: '暴雨雷暴是否导致高延迟率场景集中出现？',
    description: '雷暴模块用于观察 weather == Stormy 条件下的订单量、配送时长、延迟率和平均距离。',
    image: '/assets/backgrounds/stormy.png',
    relatedWeather: 'Stormy',
    summary: {
      order_count: 7544,
      avg_delivery_duration_min: 25.866,
      delay_rate: 0.203,
      avg_distance_km: 9.749,
      delay_threshold_min: 32.0,
      source_filter: 'weather == Stormy',
      description: 'weather == Stormy 的订单样本。'
    },
    metrics: [
      { label: '天气', value: 'Stormy' },
      { label: '字段', value: 'weather' },
      { label: '关注', value: '极端天气' }
    ]
  },
  {
    id: 'sandstorms',
    type: 'weather',
    title: '沙尘 ETA 模块',
    question: '沙尘天气是否改变骑手速度和订单履约稳定性？',
    description: '沙尘模块用于观察 weather == Sandstorms 条件下的配送时长、延迟率和平均距离。',
    image: '/assets/backgrounds/sandstorms.png',
    relatedWeather: 'Sandstorms',
    summary: {
      order_count: 7442,
      avg_delivery_duration_min: 25.872,
      delay_rate: 0.202,
      avg_distance_km: 9.686,
      delay_threshold_min: 32.0,
      source_filter: 'weather == Sandstorms',
      description: '沙尘天气订单。'
    },
    metrics: [
      { label: '天气', value: 'Sandstorms' },
      { label: '字段', value: 'weather' },
      { label: '关注', value: '能见度' }
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
      avg_distance_km: 9.802,
      delay_threshold_min: 32.0,
      source_filter: 'weather == Cloudy',
      description: '多云天气订单。'
    },
    metrics: [
      { label: '天气', value: 'Cloudy' },
      { label: '字段', value: 'weather' },
      { label: '关注', value: '稳定性' }
    ]
  },
  {
    id: 'windy',
    type: 'weather',
    title: '大风 ETA 模块',
    question: '大风天气是否会提高骑手路径和速度的不稳定性？',
    description: '大风模块用于观察 weather == Windy 条件下的配送时长、延迟率和平均距离。',
    image: '/assets/backgrounds/windy.png',
    relatedWeather: 'Windy',
    summary: {
      order_count: 7382,
      avg_delivery_duration_min: 26.128,
      delay_rate: 0.212,
      avg_distance_km: 9.776,
      delay_threshold_min: 32.0,
      source_filter: 'weather == Windy',
      description: '大风天气订单。'
    },
    metrics: [
      { label: '天气', value: 'Windy' },
      { label: '字段', value: 'weather' },
      { label: '关注', value: '速度波动' }
    ]
  }
];

export function getMapSceneById(sceneId: string) {
  return mapScenes.find((scene) => scene.id === sceneId) ?? mapScenes[0];
}
