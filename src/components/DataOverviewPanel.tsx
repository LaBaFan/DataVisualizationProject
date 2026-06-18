import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadSceneFilterSummary,
  loadTimePeriodSummary,
  loadTrafficDensitySummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import { getMapSceneById } from '../data/mapScenes';
import { getWeatherModuleById } from '../data/weatherModules';
import { buildSceneHudMetrics } from '../data/sceneMetrics';
import { useInteraction, type WeatherSubView } from '../store/interactionContext';
import { getWeatherSummary } from '../utils/moduleData';
import {
  ActiveSection,
  MapSelection,
  OverviewSummary,
  SceneFilterSummary,
  TimePeriodSummary,
  TrafficDensitySummary,
  ViewContextMetrics,
  WeatherImpactSummary
} from '../types/data';


const moduleDisplayName: Record<string, string> = {
  overall: '总览',
  sunny: '晴天',
  fog: '雾天',
  cloudy: '多云',
  stormy: '雷暴',
  sandstorms: '沙尘',
  windy: '大风'
};

const subViewCopy: Record<WeatherSubView, { label: string; groupBy: string; question: string; finding: string }> = {
  overview: {
    label: '概览',
    groupBy: '天气基线',
    question: '当前天气的 ETA 表现相对全局基线有何差异？',
    finding: '当前视图按天气筛选订单，并用全局均值作为对照解释 ETA 风险。'
  },
  traffic: {
    label: '交通',
    groupBy: '交通密度',
    question: '在当前天气下，不同交通密度如何改变 ETA？',
    finding: '当前视图按交通密度分组，重点比较拥堵、高密度、中密度、低密度的配送时长和延迟率。'
  },
  time: {
    label: '时段',
    groupBy: '履约时段',
    question: '在当前天气下，不同时段的 ETA 节奏如何变化？',
    finding: '当前视图按履约时段分组，观察早餐、午高峰、下午、晚高峰、夜间的延迟差异。'
  },
  vehicle: {
    label: '载具',
    groupBy: '载具类型',
    question: '在当前天气下，不同载具的配送表现有何差异？',
    finding: '当前视图按载具类型对比订单量、平均配送时长和延迟率，辅助判断车辆类型的稳定性。'
  },
  risk: {
    label: '风险',
    groupBy: '高风险组合',
    question: '当前天气下哪些风险组合最容易放大 ETA？',
    finding: '当前视图筛选当前天气下的高风险组合，并比较其配送时长、延迟率和订单量。'
  },
  orders: {
    label: '订单',
    groupBy: '订单级距离-时长样本',
    question: '当前天气下哪些订单呈现距离-时长异常？',
    finding: '当前视图使用订单级配送距离与配送时长样本，识别短距离长耗时和高风险订单。'
  }
};

const analysisReceiptTitle: Record<WeatherSubView, string> = {
  overview: '天气分析小票',
  traffic: '交通分析小票',
  time: '时段分析小票',
  vehicle: '载具分析小票',
  risk: '风险分析小票',
  orders: '订单分析小票'
};

const WEATHER_LABELS: Record<string, string> = {
  All: '全部天气',
  Sunny: '晴天',
  Cloudy: '多云',
  Fog: '雾天',
  Windy: '大风',
  Stormy: '暴雨',
  Sandstorms: '沙尘'
};

const TRAFFIC_LABELS: Record<string, string> = {
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵',
  Unknown: '未知交通'
};

const TIME_LABELS: Record<string, string> = {
  All: '全部时段',
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间',
  Unknown: '未知时段'
};

const VEHICLE_LABELS: Record<string, string> = {
  electric_scooter: '电动车',
  scooter: '踏板车',
  motorcycle: '摩托车',
  bicycle: '自行车',
  Unknown: '未知载具'
};

function fmt(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function pct(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

function normalizeRate(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

function deltaPercent(current: number | undefined, baseline: number | undefined) {
  if (
    typeof current !== 'number' ||
    typeof baseline !== 'number' ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline) ||
    baseline === 0
  ) {
    return '-';
  }

  const delta = ((current - baseline) / baseline) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function deltaRatePoints(current: number | undefined, baseline: number | undefined) {
  if (
    typeof current !== 'number' ||
    typeof baseline !== 'number' ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline)
  ) {
    return '-';
  }

  const currentNormalized = current > 1 ? current / 100 : current;
  const baselineNormalized = baseline > 1 ? baseline / 100 : baseline;
  const delta = (currentNormalized - baselineNormalized) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(0)} pts`;
}

function weatherLabel(value: string | null | undefined) {
  return WEATHER_LABELS[value ?? ''] ?? value ?? '-';
}

function trafficLabel(value: string | null | undefined) {
  return TRAFFIC_LABELS[value ?? ''] ?? value ?? '-';
}

function timeLabel(value: string | null | undefined) {
  return TIME_LABELS[value ?? ''] ?? value ?? '-';
}

function vehicleLabel(value: string | null | undefined) {
  return VEHICLE_LABELS[value ?? ''] ?? value ?? '-';
}

function selectionDisplayTitle(selection: MapSelection | null) {
  if (!selection) return null;
  const item = selection.item;
  if (selection.type === 'traffic_segment') {
    if ('vehicle_type' in item && item.vehicle_type) return vehicleLabel(item.vehicle_type);
    return trafficLabel(item.traffic_density);
  }
  if (selection.type === 'delivery_flow_segment') return timeLabel(item.time_period);
  if (selection.type === 'risk_pulse' || selection.type === 'risk_heat_halo') {
    const parts = [
      'traffic_density' in item ? trafficLabel(item.traffic_density) : null,
      'time_period' in item ? timeLabel(item.time_period) : null,
      'vehicle_type' in item ? vehicleLabel(item.vehicle_type) : null
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : ('label' in item ? item.label : item.id);
  }
  if ('label' in item) return item.label;
  return 'order_id' in item && item.order_id ? item.order_id : item.id;
}

function conciseInsight(moduleLabel: string, moduleWeather: string, moduleDelayRate: number | undefined, globalDelayRate: number | undefined) {
  const current = typeof moduleDelayRate === 'number' ? (moduleDelayRate > 1 ? moduleDelayRate / 100 : moduleDelayRate) : undefined;
  const global = typeof globalDelayRate === 'number' ? (globalDelayRate > 1 ? globalDelayRate / 100 : globalDelayRate) : undefined;
  const direction = current !== undefined && global !== undefined && current < global ? '低于' : '高于';

  if (moduleWeather === 'All') {
    return '总览用于定位天气分区与配送风险的空间关系；先从地图热区进入具体天气，再用右侧对比解释 ETA 变化。';
  }

  return `${moduleLabel} 的延迟风险${direction}全局基线，说明天气条件正在改变配送稳定性。优先结合地图热区、时段切换和异常抽样点判断风险来源。`;
}

function hotspotInsight(description: string | undefined, fallback: string) {
  if (!description) return fallback;
  return `${fallback} 总览入口热区补充说明：${description}`;
}

function selectionTitle(selection: MapSelection | null) {
  if (!selection) return null;
  const displayTitle = selectionDisplayTitle(selection);
  if (displayTitle) return displayTitle;
  return 'order_id' in selection.item && selection.item.order_id ? selection.item.order_id : selection.item.id;
}

function selectionTypeLabel(selection: MapSelection | null) {
  if (!selection) return '-';
  if (selection.type === 'scene_hotspot') return '天气模块入口';
  if (selection.type === 'traffic_segment') {
    return selection.item.vehicle_type ? '天气 × 载具' : '天气 × 交通';
  }
  if (selection.type === 'order_dot') return '订单样本';
  if (selection.type === 'risk_pulse') return '风险组合';
  if (selection.type === 'metric_tag') return '指标摘要';
  if (selection.type === 'risk_heat_halo') return '延迟风险摘要';
  if (selection.type === 'delivery_flow_segment') return '时段节奏摘要';

  const labels: Record<typeof selection.item.type, string> = {
    restaurant: '订单来源代理',
    building: '指标锚点',
    road: '交通密度摘要',
    weather: '天气筛选',
    risk_zone: '风险组合',
    customer_area: '订单需求代理',
    order_point: '订单样本',
    rider: '载具信号'
  };
  return labels[selection.item.type];
}

function dataFilterForSubView(weather: string, subView: WeatherSubView) {
  const base = weather === 'All' ? '全部清洗订单' : `当前筛选：${weatherLabel(weather)}`;
  if (subView === 'traffic') return `${base}；按交通密度分组`;
  if (subView === 'time') return `${base}；按履约时段分组`;
  if (subView === 'vehicle') return `${base}；按载具类型分组`;
  if (subView === 'risk') return `${base}；提取高风险组合`;
  if (subView === 'orders') return `${base}；配送距离与配送时长样本`;
  return base;
}

function dataFilterForSelection(selection: MapSelection | null, weather: string, subView: WeatherSubView) {
  if (!selection) return dataFilterForSubView(weather, subView);
  const item = selection.item;
  const filters = [
    'weather' in item && item.weather ? `天气：${weatherLabel(item.weather)}` : weather !== 'All' ? `天气：${weatherLabel(weather)}` : null,
    'traffic_density' in item && item.traffic_density && item.traffic_density !== 'Unknown' ? `交通密度：${trafficLabel(item.traffic_density)}` : null,
    'time_period' in item && item.time_period ? `时段：${timeLabel(item.time_period)}` : null,
    'vehicle_type' in item && item.vehicle_type ? `载具：${vehicleLabel(item.vehicle_type)}` : null,
    'order_id' in item && item.order_id ? `订单：${item.order_id}` : null,
    'scenario_id' in item && item.scenario_id ? `组合：${item.scenario_id}` : null
  ].filter(Boolean);

  return filters.length ? filters.join('；') : dataFilterForSubView(weather, subView);
}

function keyDifferenceText(
  moduleLabel: string,
  subView: WeatherSubView,
  moduleMetrics: {
    avg_delivery_duration_min?: number;
    delay_rate?: number;
    risk_score?: number;
  },
  globalMetrics: {
    avg_delivery_duration_min?: number;
    delay_rate?: number;
    risk_score?: number;
  }
) {
  const avgDelta = deltaPercent(moduleMetrics.avg_delivery_duration_min, globalMetrics.avg_delivery_duration_min);
  const delayDelta = deltaRatePoints(moduleMetrics.delay_rate, globalMetrics.delay_rate);
  if (subView === 'traffic') return `${moduleLabel} 内优先比较拥堵与低密度。相对基线：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
  if (subView === 'time') return `${moduleLabel} 内优先比较高峰与非高峰。相对基线：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
  if (subView === 'vehicle') return `${moduleLabel} 内按载具类型比较。相对基线：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
  if (subView === 'risk') return `高风险组合按延迟率和平均时长优先排序。当前模块延迟率：${pct(moduleMetrics.delay_rate)}。`;
  if (subView === 'orders') return `订单点用于比较配送距离与配送时长。当前模块平均时长相对基线：${avgDelta}。`;
  return `${moduleLabel} 相对全局：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
}

function metricsForSelection(
  selection: MapSelection | null,
  filteredRow?: SceneFilterSummary | null
): Array<[string, string]> | null {
  if (!selection) return null;
  const item = selection.item;

  // For scene_hotspot, prefer filtered data from scene_filter_summary
  if (selection.type === 'scene_hotspot' && filteredRow) {
    const rows: Array<[string, string]> = [
      ['对象类型', selectionTypeLabel(selection)],
      ['订单数', fmt(filteredRow.order_count)],
      ['平均时长', `${fmt(filteredRow.avg_delivery_duration_min, 1)} 分钟`],
      ['延迟率', pct(filteredRow.delay_rate)],
      ['平均距离', filteredRow.avg_distance_km ? `${fmt(filteredRow.avg_distance_km, 1)} 公里` : '-']
    ];
    return rows.filter(([, value]) => value !== '-');
  }

  const values: Array<[string, string]> = [
    ['对象类型', selectionTypeLabel(selection)],
    ['订单数', 'order_count' in item ? fmt(item.order_count) : '-'],
    ['平均时长', 'avg_delivery_duration_min' in item ? `${fmt(item.avg_delivery_duration_min, 1)} 分钟` : '-'],
    ['配送时长', 'delivery_duration_min' in item ? `${fmt(item.delivery_duration_min, 1)} 分钟` : '-'],
    ['延迟率', 'delay_rate' in item ? pct(item.delay_rate) : '-'],
    ['平均距离', 'avg_distance_km' in item ? `${fmt(item.avg_distance_km, 1)} 公里` : '-'],
    ['距离', 'distance_km' in item ? `${fmt(item.distance_km, 1)} 公里` : '-']
  ];
  return values.filter(([, value]) => value !== '-');
}

function selectionExplanation(selection: MapSelection | null) {
  if (!selection) return '';
  if (selection.type === 'scene_hotspot') {
    return selection.item.description ?? '该入口用于从总览进入对应天气模块。';
  }
  if (selection.type === 'traffic_segment') {
    if (selection.item.vehicle_type) {
      return '该对象按载具类型汇总当前天气下的订单表现，平均配送时长和延迟率用于比较载具稳定性。';
    }
    return '该对象按交通密度汇总当前天气下的订单表现，延迟率用于判断 ETA 风险是否被交通条件放大。';
  }
  if (selection.type === 'order_dot') {
    return '该对象表示订单样本或订单聚合点，配送距离、配送时长和延迟状态用于识别异常 ETA。';
  }
  if (selection.type === 'metric_tag') {
    return '该标签仅汇总当前筛选下的真实指标，用于快速读取延迟率、平均时长和订单量。';
  }
  if (selection.type === 'risk_heat_halo') {
    return '该对象用订单量、延迟率和平均时长表达当前筛选下的 ETA 风险强度。';
  }
  if (selection.type === 'delivery_flow_segment') {
    return '该对象用于表达当前筛选下的配送节奏摘要，重点读取订单量、平均配送时长和延迟率。';
  }
  if (selection.type === 'risk_pulse') {
    return '该对象表示延迟率较高的组合，可结合天气、交通密度、时段和载具解释延迟。';
  }
  return selection.item.description ?? '当前对象用于解释真实字段组合下的 ETA 延迟风险。';
}

function selectionPills(selection: MapSelection | null) {
  if (!selection) return [];
  const item = selection.item;
  return [
    ['类型', selectionTypeLabel(selection)],
    ['天气', 'weather' in item ? weatherLabel(item.weather) : undefined],
    ['交通', 'traffic_density' in item ? trafficLabel(item.traffic_density) : undefined],
    ['时段', 'time_period' in item ? timeLabel(item.time_period) : undefined],
    ['车辆', 'vehicle_type' in item ? vehicleLabel(item.vehicle_type) : undefined]
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;
}

const ETA_THRESHOLD_MIN = 32;

type ReceiptRiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ReceiptKind = 'order' | 'scenario' | 'weather';
type ImpactLevel = '低' | '中' | '中高' | '高';

interface ReceiptModel {
  kind: ReceiptKind;
  title: string;
  identifier?: string;
  riskScore: number;
  riskLevel: ReceiptRiskLevel;
  riskLabel: string;
  statusCode: 'DELAYED' | 'AT RISK' | 'ON TIME';
  statusLabel: string;
  duration?: number;
  overTime?: number;
  distance?: number;
  orderCount?: number;
  delayRate?: number;
  weather?: string;
  traffic?: string;
  timePeriod?: string;
  vehicle?: string;
  details: Array<[string, string | undefined]>;
  sources: Array<{ label: string; level: ImpactLevel }>;
  note: string;
}

function receiptRiskLevel(score: number): ReceiptRiskLevel {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.35) return 'medium';
  return 'low';
}

function receiptRiskLabel(level: ReceiptRiskLevel) {
  const labels: Record<ReceiptRiskLevel, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险'
  };
  return labels[level];
}

function receiptStatus(duration: number | undefined) {
  if (typeof duration !== 'number') return { statusCode: 'AT RISK' as const, statusLabel: '需关注' };
  if (duration > ETA_THRESHOLD_MIN) return { statusCode: 'DELAYED' as const, statusLabel: '已延迟' };
  if (duration >= 28) return { statusCode: 'AT RISK' as const, statusLabel: '临近延迟' };
  return { statusCode: 'ON TIME' as const, statusLabel: '正常' };
}

function selectionDuration(selection: MapSelection, filteredRow?: SceneFilterSummary | null) {
  if (selection.type === 'scene_hotspot' && filteredRow) return filteredRow.avg_delivery_duration_min;
  const item = selection.item;
  if ('delivery_duration_min' in item && typeof item.delivery_duration_min === 'number') return item.delivery_duration_min;
  if ('avg_delivery_duration_min' in item && typeof item.avg_delivery_duration_min === 'number') return item.avg_delivery_duration_min;
  return undefined;
}

function selectionRiskScore(selection: MapSelection, filteredRow?: SceneFilterSummary | null) {
  if (selection.type === 'scene_hotspot' && filteredRow?.risk_score !== undefined) return normalizeRate(filteredRow.risk_score);
  const item = selection.item;
  if ('risk_score' in item && typeof item.risk_score === 'number') return normalizeRate(item.risk_score);
  if ('delay_rate' in item && typeof item.delay_rate === 'number') return normalizeRate(item.delay_rate);
  const duration = selectionDuration(selection, filteredRow);
  return typeof duration === 'number' ? Math.max(0, Math.min(1, (duration - 18) / 42)) : 0.18;
}

function selectionReceiptKind(selection: MapSelection) {
  if (selection.type === 'order_dot') return 'order';
  if (selection.type === 'module' && selection.item.type === 'weather') return 'weather';
  if (selection.type === 'scene_hotspot' && selection.item.weather && !selection.item.traffic_density) return 'weather';
  return 'scenario';
}

function impactClass(level: ImpactLevel) {
  if (level === '高') return 'high';
  if (level === '中高') return 'midhigh';
  if (level === '中') return 'medium';
  return 'low';
}

function receiptSources(input: {
  weather?: string;
  traffic?: string;
  timePeriod?: string;
  vehicle?: string;
  distance?: number;
  duration?: number;
}) {
  const sources: Array<{ label: string; level: ImpactLevel }> = [];

  if (typeof input.duration === 'number' && input.duration > ETA_THRESHOLD_MIN) {
    sources.push({ label: `配送超时 ${fmt(input.duration - ETA_THRESHOLD_MIN, 1)} 分钟`, level: '高' });
  }
  if (input.weather) {
    const level: ImpactLevel = ['暴雨', '沙尘'].includes(input.weather)
      ? '高'
      : ['雾天', '大风'].includes(input.weather)
        ? '中高'
        : '低';
    sources.push({ label: `${input.weather}天气`, level });
  }
  if (input.traffic) {
    const level: ImpactLevel = input.traffic === '拥堵' ? '高' : input.traffic === '高密度' ? '中高' : input.traffic === '中密度' ? '中' : '低';
    sources.push({ label: `${input.traffic}交通`, level });
  }
  if (typeof input.distance === 'number') {
    const level: ImpactLevel = input.distance > 10 ? '高' : input.distance > 6 ? '中高' : input.distance > 3 ? '中' : '低';
    sources.push({ label: `配送距离 ${fmt(input.distance, 1)} 公里`, level });
  }
  if (input.timePeriod) {
    const level: ImpactLevel = input.timePeriod === '午高峰' || input.timePeriod === '晚高峰' ? '中高' : input.timePeriod === '夜间' ? '中' : '低';
    sources.push({ label: `${input.timePeriod}时段`, level });
  }
  if (input.vehicle) {
    const harshWeather = input.weather && ['暴雨', '沙尘', '雾天', '大风'].includes(input.weather);
    const level: ImpactLevel = input.vehicle === '自行车' && harshWeather ? '中高' : input.vehicle === '踏板车' && harshWeather ? '中' : '低';
    sources.push({ label: input.vehicle, level });
  }

  return sources.slice(0, 5);
}

function receiptNote(model: Pick<ReceiptModel, 'kind' | 'duration' | 'overTime' | 'weather' | 'traffic' | 'distance' | 'timePeriod' | 'orderCount' | 'delayRate'>) {
  const delayed = typeof model.overTime === 'number' && model.overTime > 0;
  const subject = model.kind === 'order' ? '该订单' : model.kind === 'weather' ? '该天气模块' : '该风险场景';
  const prefix = delayed && typeof model.duration === 'number'
    ? `${subject}配送时长为 ${fmt(model.duration, 1)} 分钟，已超过 ${ETA_THRESHOLD_MIN} 分钟延迟阈值 ${fmt(model.overTime, 1)} 分钟。`
    : `${subject}当前低于 ${ETA_THRESHOLD_MIN} 分钟延迟阈值，但仍需关注天气、交通或距离带来的 ETA 波动。`;
  const causes: string[] = [];

  if (model.weather === '暴雨') causes.push('暴雨可能导致骑手速度下降和路径绕行');
  else if (model.weather === '大风') causes.push('大风会降低骑行速度和路线稳定性');
  else if (model.weather === '雾天') causes.push('雾天能见度下降，配送速度更保守');
  else if (model.weather === '沙尘') causes.push('沙尘会恶化道路环境并拖慢骑行');
  if (model.traffic === '拥堵') causes.push('拥堵会增加等待与绕行时间');
  else if (model.traffic === '高密度') causes.push('高密度交通会放大局部延迟');
  if (typeof model.distance === 'number' && model.distance > 6) causes.push('配送距离偏长增加在途不确定性');
  if (model.timePeriod === '午高峰' || model.timePeriod === '晚高峰') causes.push('高峰时段订单压力更集中');
  if (model.kind === 'scenario' && model.orderCount) causes.push(`${model.orderCount} 单样本指向该组合风险`);
  if (model.kind === 'weather' && typeof model.delayRate === 'number') causes.push(`该天气延迟率为 ${pct(model.delayRate)}`);

  return causes.length ? `${prefix}${causes.slice(0, 2).join('，')}。` : prefix;
}

function buildReceipt(selection: MapSelection, filteredRow?: SceneFilterSummary | null): ReceiptModel {
  const item = selection.item;
  const kind = selectionReceiptKind(selection);
  const duration = selectionDuration(selection, filteredRow);
  const overTime = typeof duration === 'number' ? duration - ETA_THRESHOLD_MIN : undefined;
  const riskScore = selectionRiskScore(selection, filteredRow);
  const riskLevel = receiptRiskLevel(riskScore);
  const { statusCode, statusLabel } = receiptStatus(duration);
  const weather = 'weather' in item ? weatherLabel(item.weather) : undefined;
  const traffic = 'traffic_density' in item ? trafficLabel(item.traffic_density) : undefined;
  const timePeriod = 'time_period' in item ? timeLabel(item.time_period) : undefined;
  const vehicle = 'vehicle_type' in item ? vehicleLabel(item.vehicle_type) : undefined;
  const distance = 'distance_km' in item && typeof item.distance_km === 'number' ? item.distance_km : undefined;
  const orderCount = selection.type === 'scene_hotspot' && filteredRow
    ? filteredRow.order_count
    : 'order_count' in item && typeof item.order_count === 'number'
      ? item.order_count
      : undefined;
  const delayRate = selection.type === 'scene_hotspot' && filteredRow
    ? filteredRow.delay_rate
    : 'delay_rate' in item && typeof item.delay_rate === 'number'
      ? item.delay_rate
      : undefined;
  const identifier = kind === 'order'
    ? 'order_id' in item && item.order_id ? `#${item.order_id}` : 'id' in item ? `#${item.id}` : undefined
    : kind === 'weather'
      ? weather
      : selectionDisplayTitle(selection) ?? undefined;
  const title = kind === 'order' ? '外卖订单风险小票' : kind === 'weather' ? '天气风险小票' : '风险场景小票';
  const details: Array<[string, string | undefined]> = kind === 'order'
    ? [
      ['配送距离', typeof distance === 'number' ? `${fmt(distance, 1)} 公里` : undefined],
      ['配送时长', typeof duration === 'number' ? `${fmt(duration, 1)} 分钟` : undefined],
      ['延迟阈值', `${ETA_THRESHOLD_MIN.toFixed(1)} 分钟`],
      ['延迟状态', statusLabel],
      ['延迟率', delayRate !== undefined ? pct(delayRate) : statusCode === 'DELAYED' ? '100%' : '0%']
    ]
    : [
      ['订单量', typeof orderCount === 'number' ? `${fmt(orderCount)} 单` : undefined],
      ['平均配送时长', typeof duration === 'number' ? `${fmt(duration, 1)} 分钟` : undefined],
      ['延迟阈值', `${ETA_THRESHOLD_MIN.toFixed(1)} 分钟`],
      ['延迟率', delayRate !== undefined ? pct(delayRate) : undefined]
    ];
  const sources = receiptSources({ weather, traffic, timePeriod, vehicle, distance, duration });
  const note = receiptNote({ kind, duration, overTime, weather, traffic, distance, timePeriod, orderCount, delayRate });

  return {
    kind,
    title,
    identifier,
    riskScore,
    riskLevel,
    riskLabel: receiptRiskLabel(riskLevel),
    statusCode,
    statusLabel,
    duration,
    overTime,
    distance,
    orderCount,
    delayRate,
    weather,
    traffic,
    timePeriod,
    vehicle,
    details,
    sources,
    note
  };
}

function ReceiptRow({ label, value }: { label: string; value?: string }) {
  if (!value || value === '-') return null;
  return (
    <div className="eta-receipt-row">
      <span>{label}</span>
      <i aria-hidden="true" />
      <strong>{value}</strong>
    </div>
  );
}

function AnalysisReceipt({
  title,
  moduleName,
  panelIndex,
  subView,
  filterRows,
  metricRows,
  comparisonRows,
  explanation,
  keyDifference,
  delayRate
}: {
  title: string;
  moduleName: string;
  panelIndex: string;
  subView: typeof subViewCopy[WeatherSubView];
  filterRows: Array<[string, string]>;
  metricRows: Array<[string, string]>;
  comparisonRows: Array<{
    label: string;
    currentLabel: string;
    currentValue: string;
    baselineLabel: string;
    baselineValue: string;
    delta: string;
  }>;
  explanation: string;
  keyDifference: string;
  delayRate: number | undefined;
}) {
  const riskLevel = receiptRiskLevel(normalizeRate(delayRate));
  const riskLabel = receiptRiskLabel(riskLevel);
  const etaTotal = metricRows.find(([label]) => label === '平均时长')?.[1] ?? '-';
  const orderTotal = metricRows.find(([label]) => label === '样本订单')?.[1] ?? '-';

  return (
    <section className={`eta-risk-receipt default-analysis-receipt receipt-risk-${riskLevel}`} aria-label="FoodETA 分析小票">
      <div className="eta-receipt-head">
        <div>
          <span>FOODETA ANALYSIS RECEIPT</span>
          <h2>{title}</h2>
        </div>
        <em>{riskLabel}</em>
      </div>

      <div className="eta-receipt-idline">
        <div>
          <small>MODULE</small>
          <strong>{moduleName} · {subView.label}</strong>
        </div>
        <b>{panelIndex}</b>
      </div>
      <strong className="eta-receipt-status-label">{subView.question}</strong>

      <div className="eta-receipt-chips" aria-label="当前筛选">
        {filterRows.map(([label, value]) => (
          <span key={`${label}-${value}`}>{label}: {value}</span>
        ))}
      </div>

      <section className="eta-total-block">
        <span>ETA TOTAL</span>
        <strong>{etaTotal}</strong>
        <em>{orderTotal} 样本 · {subView.groupBy}</em>
      </section>

      <section className="eta-receipt-section">
        <h3>筛选条件</h3>
        <div className="eta-ticket-metrics">
          {filterRows.map(([label, value]) => <ReceiptRow key={label} label={label} value={value} />)}
        </div>
      </section>

      <section className="eta-receipt-section">
        <h3>ETA 明细</h3>
        <div className="eta-ticket-metrics overview-metric-list">
          {metricRows.map(([label, value]) => <ReceiptRow key={label} label={label} value={value} />)}
        </div>
      </section>

      <section className="eta-receipt-section">
        <h3>关键差异</h3>
        <p className="eta-receipt-copy">{keyDifference}</p>
        <div className="analysis-compare-stack">
          {comparisonRows.map((row) => (
            <article key={row.label} className="analysis-compare-card">
              <ReceiptRow label={row.label} value={`${row.currentValue} / ${row.baselineValue}`} />
              <ReceiptRow label={`${row.currentLabel} 对 ${row.baselineLabel}`} value={`差异 ${row.delta}`} />
            </article>
          ))}
        </div>
      </section>

      <section className="eta-risk-note">
        <strong>当前发现</strong>
        <p>{explanation}</p>
      </section>

      <p className="eta-receipt-footer">ETA Checked by FoodETA</p>
    </section>
  );
}

function RiskReceipt({
  receipt,
  currentModuleName,
  onFullAnalysis,
  onReturn
}: {
  receipt: ReceiptModel;
  currentModuleName: string;
  onFullAnalysis: () => void;
  onReturn: () => void;
}) {
  const chips = [receipt.weather, receipt.traffic ? `${receipt.traffic}交通` : undefined, receipt.timePeriod, receipt.vehicle].filter(Boolean);
  const returnLabel = receipt.weather ? `返回${receipt.weather}订单` : `返回${currentModuleName}订单`;

  return (
    <section className={`eta-risk-receipt receipt-risk-${receipt.riskLevel}`} aria-label="FoodETA ETA 风险小票">
      <div className="eta-receipt-head">
        <div>
          <span>FOODETA DELIVERY</span>
          <h2>{receipt.title}</h2>
        </div>
        <em>{receipt.riskLabel}</em>
      </div>
      <div className="eta-receipt-idline">
        <div>
          <small>{receipt.kind === 'order' ? 'ORDER' : receipt.kind === 'weather' ? 'WEATHER' : 'SCENARIO'}</small>
          <strong>{receipt.identifier}</strong>
        </div>
        <b>{receipt.statusCode}</b>
      </div>
      <strong className="eta-receipt-status-label">{receipt.statusLabel}</strong>
      {chips.length ? (
        <div className="eta-receipt-chips">
          {chips.map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      ) : null}
      <section className="eta-total-block">
        <span>ETA TOTAL</span>
        <strong>{fmt(receipt.duration, 1)} 分钟</strong>
        {typeof receipt.overTime === 'number' ? (
          <em className={receipt.overTime > 0 ? 'is-delayed' : 'is-early'}>
            {receipt.overTime > 0 ? `超过延迟阈值 +${fmt(receipt.overTime, 1)} 分钟` : `低于延迟阈值 ${fmt(Math.abs(receipt.overTime), 1)} 分钟`}
          </em>
        ) : <em>缺少配送时长数据</em>}
      </section>
      <section className="eta-receipt-section">
        <h3>ETA 明细</h3>
        <div className="eta-ticket-metrics">
          {receipt.details.map(([label, value]) => <ReceiptRow key={label} label={label} value={value} />)}
        </div>
      </section>
      {receipt.sources.length ? (
        <section className="eta-receipt-section">
          <h3>风险来源</h3>
          <div className="eta-risk-source-list">
            {receipt.sources.map((source) => (
              <div className="eta-risk-source-row" key={source.label}>
                <span>{source.label}</span>
                <i aria-hidden="true" />
                <strong className={`impact-${impactClass(source.level)}`}>{source.level}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="eta-risk-note">
        <strong>风险备注</strong>
        <p>{receipt.note}</p>
      </section>
      <div className="overview-ticket-actions eta-receipt-actions">
        <button type="button" onClick={onFullAnalysis}>查看完整分析</button>
        <button type="button" onClick={onReturn}>{returnLabel}</button>
      </div>
      <p className="eta-receipt-footer">ETA Risk Checked by FoodETA</p>
    </section>
  );
}

function sectionForSelection(selection: MapSelection | null, fallback: ActiveSection): ActiveSection {
  if (!selection) return fallback;
  if (selection.type === 'scene_hotspot') return 'overview';
  if (selection.type === 'order_dot') return 'outlier';
  if (selection.type === 'traffic_segment') return selection.item.vehicle_type ? 'weather' : 'traffic';
  if (selection.type === 'delivery_flow_segment') return 'time';
  if (selection.type === 'risk_heat_halo' || selection.type === 'metric_tag' || selection.type === 'risk_pulse') {
    return 'risk';
  }
  if (selection.type === 'module' && selection.item.type === 'risk_zone') return 'risk';
  return fallback ?? 'overview';
}

export default function DataOverviewPanel() {
  const { activeModule, activeSection, selectedWeather, selectedTimePeriod, selectedSubView, selectedSceneId, selectedItem, setSelectedItem } = useInteraction();
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [weatherRows, setWeatherRows] = useState<WeatherImpactSummary[]>([]);
  const [timeRows, setTimeRows] = useState<TimePeriodSummary[]>([]);
  const [trafficDensityRows, setTrafficDensityRows] = useState<TrafficDensitySummary[]>([]);
  const [sceneFilterRows, setSceneFilterRows] = useState<SceneFilterSummary[]>([]);
  const [moduleSummary, setModuleSummary] = useState<WeatherImpactSummary | SceneFilterSummary | null>(null);

  useEffect(() => {
    Promise.all([
      loadOverviewSummary(),
      loadWeatherImpactSummary(),
      loadTimePeriodSummary(),
      loadTrafficDensitySummary(),
      loadSceneFilterSummary()
    ]).then(([overviewData, weatherData, timeData, trafficDensityData, sceneFilterData]) => {
      setOverview(overviewData);
      setWeatherRows(weatherData);
      setTimeRows(timeData);
      setTrafficDensityRows(trafficDensityData);
      setSceneFilterRows(sceneFilterData);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    getWeatherSummary(activeModule, selectedTimePeriod)
      .then((summary) => {
        if (mounted) setModuleSummary(summary);
      })
      .catch((error) => {
        console.warn('[DataOverviewPanel] Failed to load module summary.', error);
        if (mounted) setModuleSummary(null);
      });

    return () => {
      mounted = false;
    };
  }, [activeModule, selectedTimePeriod]);

  const selectedScene = getMapSceneById(selectedSceneId);
  const currentModule = getWeatherModuleById(activeModule);

  // For scene_hotspot: find matching scene_filter_summary row
  const hotspotFilteredRow = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'scene_hotspot') return null;
    const hotspot = selectedItem.item;
    const targetSceneId = hotspot.targetSceneId;
    if (!targetSceneId || !sceneFilterRows.length) return null;

    const timePeriod = !selectedTimePeriod || selectedTimePeriod === 'All' ? 'All' : selectedTimePeriod;
    const weather = !selectedWeather || selectedWeather === 'All' ? 'All' : selectedWeather;

    // Try exact match (scene + weather + time)
    const exact = sceneFilterRows.find(
      (r) => r.scene_id === targetSceneId && r.weather === weather && r.time_period === timePeriod
    );
    if (exact) return exact;

    // Fallback: scene + time only
    const timeOnly = sceneFilterRows.find(
      (r) => r.scene_id === targetSceneId && r.weather === 'All' && r.time_period === timePeriod
    );
    if (timeOnly) return timeOnly;

    // Fallback: scene base (All/All)
    return sceneFilterRows.find(
      (r) => r.scene_id === targetSceneId && r.weather === 'All' && r.time_period === 'All'
    ) ?? null;
  }, [selectedItem, sceneFilterRows, selectedTimePeriod, selectedWeather]);

  const selectedMetrics = metricsForSelection(selectedItem, hotspotFilteredRow);
  const contextMetrics: ViewContextMetrics = useMemo(
    () =>
      buildSceneHudMetrics({
        selectedScene,
        selectedWeather,
        selectedTimePeriod,
        overview,
        weatherRows,
        timeRows,
        trafficRows: trafficDensityRows,
        sceneFilterRows
      }),
    [overview, sceneFilterRows, selectedScene, selectedTimePeriod, selectedWeather, timeRows, trafficDensityRows, weatherRows]
  );

  const metrics = useMemo<Array<[string, string]>>(() => {
    if (selectedMetrics) return selectedMetrics;

    return [
      ['样本订单', fmt(contextMetrics.order_count)],
      ['平均时长', `${fmt(contextMetrics.avg_delivery_duration_min, 1)} 分钟`],
      ['延迟率', pct(contextMetrics.delay_rate)],
      ['平均距离', `${fmt(contextMetrics.avg_distance_km, 1)} 公里`]
    ];
  }, [contextMetrics, moduleSummary, selectedMetrics]);

  const globalMetrics = {
    avg_delivery_duration_min: overview?.avg_delivery_duration_min,
    delay_rate: overview?.delay_rate,
    avg_distance_km: overview?.avg_distance_km
  };
  const moduleMetrics = {
    order_count: moduleSummary?.order_count ?? contextMetrics.order_count,
    avg_delivery_duration_min: moduleSummary?.avg_delivery_duration_min ?? contextMetrics.avg_delivery_duration_min,
    delay_rate: moduleSummary?.delay_rate ?? contextMetrics.delay_rate,
    avg_distance_km: moduleSummary?.avg_distance_km ?? contextMetrics.avg_distance_km
  };
  const currentSubView = subViewCopy[selectedSubView];
  const currentModuleName = moduleDisplayName[currentModule.id] ?? currentModule.label;
  const comparisonRows = [
    {
      label: '平均配送时长',
      currentLabel: currentModuleName,
      currentValue: `${fmt(moduleMetrics.avg_delivery_duration_min, 1)} 分钟`,
      baselineLabel: '全局',
      baselineValue: `${fmt(globalMetrics.avg_delivery_duration_min, 1)} 分钟`,
      delta: deltaPercent(moduleMetrics.avg_delivery_duration_min, globalMetrics.avg_delivery_duration_min)
    },
    {
      label: '延迟率',
      currentLabel: currentModuleName,
      currentValue: pct(moduleMetrics.delay_rate),
      baselineLabel: '全局',
      baselineValue: pct(globalMetrics.delay_rate),
      delta: deltaRatePoints(moduleMetrics.delay_rate, globalMetrics.delay_rate)
    },
    {
      label: '平均配送距离',
      currentLabel: currentModuleName,
      currentValue: `${fmt(moduleMetrics.avg_distance_km, 1)} 公里`,
      baselineLabel: '全局',
      baselineValue: `${fmt(globalMetrics.avg_distance_km, 1)} 公里`,
      delta: deltaPercent(moduleMetrics.avg_distance_km, globalMetrics.avg_distance_km)
    }
  ];

  const filterPills = selectedItem
    ? selectionPills(selectedItem)
    : [
        ['天气', weatherLabel(currentModule.weather)],
        ['时段', timeLabel(selectedTimePeriod)],
        ['子视图', currentSubView.label]
      ];
  const explanation = selectedItem
    ? selectionExplanation(selectedItem)
    : `${currentSubView.finding} ${conciseInsight(currentModuleName, currentModule.weather, moduleMetrics.delay_rate, globalMetrics.delay_rate)}`;
  const panelIndex = activeModule === 'overall' ? '00 总览' : `${String(['sunny', 'fog', 'cloudy', 'stormy', 'sandstorms', 'windy'].indexOf(activeModule) + 1).padStart(2, '0')} ${currentModuleName}`;
  const dataFilter = dataFilterForSelection(selectedItem, currentModule.weather, selectedSubView);
  const keyDifference = keyDifferenceText(currentModuleName, selectedSubView, moduleMetrics, globalMetrics);
  const receipt = selectedItem ? buildReceipt(selectedItem, hotspotFilteredRow) : null;
  const handleFullAnalysisClick = () => {
    const targetSection = sectionForSelection(selectedItem, activeSection ?? 'overview');
    setSelectedItem(null);

    // Map section to detail panel anchor
    const detailAnchorMap: Partial<Record<ActiveSection, string>> = {
      time: 'detail-time-rhythm',
      risk: 'detail-risk-scenarios',
      outlier: 'detail-scatter'
    };
    const anchorId = detailAnchorMap[targetSection] ?? 'scene-detail-panel';
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="data-overview-panel" aria-label="分析面板">
      <div
        key={`${activeModule}-${activeSection}-${selectedWeather}-${selectedTimePeriod}-${selectedSubView}-${selectionTitle(selectedItem) ?? 'none'}`}
        className="overview-content"
      >
        {receipt ? (
          <RiskReceipt
            receipt={receipt}
            currentModuleName={currentModuleName}
            onFullAnalysis={handleFullAnalysisClick}
            onReturn={() => setSelectedItem(null)}
          />
        ) : (
          <AnalysisReceipt
            title={analysisReceiptTitle[selectedSubView]}
            moduleName={currentModuleName}
            panelIndex={panelIndex}
            subView={currentSubView}
            filterRows={[
              ...(filterPills as Array<[string, string]>),
              ['数据过滤', dataFilter]
            ]}
            metricRows={metrics}
            comparisonRows={comparisonRows}
            explanation={explanation}
            keyDifference={keyDifference}
            delayRate={moduleMetrics.delay_rate}
          />
        )}
      </div>
    </aside>
  );
}
