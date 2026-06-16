export type WeatherModuleId = 'overall' | 'sunny' | 'fog' | 'stormy' | 'sandstorms' | 'cloudy' | 'windy';

export interface WeatherModuleConfig {
  id: WeatherModuleId;
  label: string;
  weather: string;
  imageUrl: string;
  summary: string;
  keyQuestion: string;
  accentColor: string;
  riskHint: string;
}

export const weatherModules: WeatherModuleConfig[] = [
  {
    id: 'overall',
    label: 'Overall',
    weather: 'All',
    imageUrl: '/assets/backgrounds/overall.png',
    summary: '以城市配送总览作为入口，快速定位不同天气条件下的 ETA 风险来源。',
    keyQuestion: '哪些天气模块最需要调度关注？',
    accentColor: '#f97316',
    riskHint: '总览用于进入六个天气模块，并保留配送中心作为非跳转参考点。'
  },
  {
    id: 'sunny',
    label: 'Sunny',
    weather: 'Sunny',
    imageUrl: '/assets/backgrounds/sunny.png',
    summary: '晴天模块作为正常天气基准，用于识别非天气因素造成的 ETA 波动。',
    keyQuestion: '晴天条件下的 ETA 基准表现是什么？',
    accentColor: '#f59e0b',
    riskHint: '风险通常较低，异常点更可能来自距离、交通或局部订单积压。'
  },
  {
    id: 'fog',
    label: 'Fog',
    weather: 'Fog',
    imageUrl: '/assets/backgrounds/fog.png',
    summary: '雾天模块聚焦低能见度下的路径不确定性、速度下降和商务区订单压力。',
    keyQuestion: '低能见度天气下，商务区配送 ETA 如何变慢？',
    accentColor: '#64748b',
    riskHint: '关注低能见度与高楼商务区订单密度叠加形成的延迟风险。'
  },
  {
    id: 'stormy',
    label: 'Stormy',
    weather: 'Stormy',
    imageUrl: '/assets/backgrounds/stormy.png',
    summary: '雷暴模块用于观察暴雨、湿滑道路和极端天气对配送履约稳定性的影响。',
    keyQuestion: '暴雨雷暴是否导致高延迟率场景集中出现？',
    accentColor: '#2563eb',
    riskHint: '关注高风险场景是否集中在暴雨、拥堵和峰值时段组合中。'
  },
  {
    id: 'sandstorms',
    label: 'Sandstorms',
    weather: 'Sandstorms',
    imageUrl: '/assets/backgrounds/sandstorms.png',
    summary: '沙尘模块关注能见度、空气质量和道路状态对骑手速度及异常 ETA 的影响。',
    keyQuestion: '沙尘天气是否改变骑手速度和订单履约稳定性？',
    accentColor: '#b45309',
    riskHint: '重点观察中高风险订单是否与长距离和复杂交通共同出现。'
  },
  {
    id: 'cloudy',
    label: 'Cloudy',
    weather: 'Cloudy',
    imageUrl: '/assets/backgrounds/cloudy.png',
    summary: '多云模块用于观察非极端天气下订单压力和配送时长的持续波动。',
    keyQuestion: '多云天气下，订单压力和配送时长是否出现温和但持续的波动？',
    accentColor: '#0f766e',
    riskHint: '关注中等风险是否由局部订单密度和交通压力共同推高。'
  },
  {
    id: 'windy',
    label: 'Windy',
    weather: 'Windy',
    imageUrl: '/assets/backgrounds/windy.png',
    summary: '大风模块解释骑行速度波动、路线不稳定和末端配送不确定性。',
    keyQuestion: '大风天气是否会提高骑手路径和速度的不稳定性？',
    accentColor: '#0891b2',
    riskHint: '关注桥梁、临水道路或开阔区域中速度波动带来的 ETA 风险。'
  }
];

const moduleToScene: Record<WeatherModuleId, string> = {
  overall: 'overall',
  sunny: 'sunny',
  fog: 'fog_business',
  stormy: 'storm_area',
  sandstorms: 'sandstorm',
  cloudy: 'cloudy',
  windy: 'windy'
};

const sceneToModule: Record<string, WeatherModuleId> = Object.fromEntries(
  Object.entries(moduleToScene).map(([moduleId, sceneId]) => [sceneId, moduleId])
) as Record<string, WeatherModuleId>;

export function getWeatherModuleById(moduleId: string | null | undefined) {
  return weatherModules.find((module) => module.id === moduleId) ?? weatherModules[0];
}

export function getWeatherByModuleId(moduleId: string | null | undefined) {
  return getWeatherModuleById(moduleId).weather;
}

export function getModuleIdByWeather(weather: string | null | undefined): WeatherModuleId {
  return weatherModules.find((module) => module.weather === weather)?.id ?? 'overall';
}

export function getSceneIdByModuleId(moduleId: string | null | undefined) {
  return moduleToScene[getWeatherModuleById(moduleId).id];
}

export function getModuleIdBySceneId(sceneId: string | null | undefined): WeatherModuleId {
  if (!sceneId) return 'overall';
  return sceneToModule[sceneId] ?? 'overall';
}
