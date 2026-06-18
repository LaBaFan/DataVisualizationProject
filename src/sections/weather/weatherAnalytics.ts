import type {
  DistanceTimePoint,
  RiskScenario,
  SceneFilterSummary,
  WeatherImpactSummary,
  WeatherOrderSample,
  WeatherTrafficSummary,
  WeatherVehicleSummary
} from '../../types/data';

export const DELAY_THRESHOLD_MIN = 32;
export const WEATHER_ORDER = ['Sunny', 'Cloudy', 'Fog', 'Windy', 'Stormy', 'Sandstorms'];
export const TRAFFIC_ORDER = ['Low', 'Medium', 'High', 'Jam'];
export const TIME_ORDER = ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];
export const VEHICLE_ORDER = ['motorcycle', 'scooter', 'electric_scooter', 'bicycle'];

export const RISK_COLORS = {
  low: '#2563eb',
  medium: '#f59e0b',
  high: '#f97316',
  severe: '#dc2626'
};

export const WEATHER_LABELS: Record<string, string> = {
  Sunny: '晴天',
  Cloudy: '多云',
  Fog: '雾天',
  Foggy: '雾天',
  Windy: '大风',
  Stormy: '暴雨',
  Rainy: '暴雨',
  Sandstorms: '沙尘',
  Sandstorm: '沙尘',
  All: '全部天气',
  Unknown: '未知天气'
};

export const TRAFFIC_LABELS: Record<string, string> = {
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵',
  Unknown: '未知交通'
};

export const TIME_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间',
  Unknown: '未知时段'
};

export const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: '摩托车',
  scooter: '踏板车',
  electric_scooter: '电动车',
  bicycle: '自行车',
  Unknown: '未知载具'
};

export interface WeatherMetricRow {
  key: string;
  label: string;
  weather?: string | null;
  traffic_density?: string | null;
  time_period?: string | null;
  vehicle_type?: string | null;
  order_count: number;
  delayed_orders: number;
  avg_delivery_duration_min: number;
  avg_distance_km: number;
  delay_rate: number;
  risk_score: number;
}

export interface WeatherOverviewPair {
  current: WeatherImpactSummary;
  baseline: WeatherImpactSummary;
}

export interface WeatherScatterData {
  points: WeatherOrderSample[];
  fullCount: number;
  delayedCount: number;
  avgDeliveryDurationMin: number;
  avgDistanceKm: number;
  delayRate: number;
  riskScore: number;
}

type GroupKey = 'traffic_density' | 'time_period' | 'vehicle_type';

function isAll(value: string | null | undefined) {
  return !value || value === 'All';
}

function canonicalWeather(weather: string | null | undefined) {
  if (!weather) return null;
  const aliases: Record<string, string> = {
    Foggy: 'Fog',
    Sandstorm: 'Sandstorms',
    Rainy: 'Stormy'
  };
  return aliases[weather] ?? weather;
}

function inferWeather(orders: DistanceTimePoint[]) {
  const values = Array.from(new Set(orders.map((order) => canonicalWeather(order.weather)).filter(Boolean)));
  return values.length === 1 ? values[0] : 'All';
}

export function normalizeRate(value: number | undefined | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

export function getDelayFlag(order: Pick<DistanceTimePoint, 'delivery_duration_min'>, threshold = DELAY_THRESHOLD_MIN) {
  return order.delivery_duration_min > threshold;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function normalizeDuration(value: number) {
  return clamp01((value - 18) / 42);
}

function normalizeDistance(value: number) {
  return clamp01(value / 18);
}

export function getOrderRiskScore(order: DistanceTimePoint) {
  if (typeof order.risk_score === 'number' && Number.isFinite(order.risk_score)) return normalizeRate(order.risk_score);
  return clamp01(normalizeDuration(order.delivery_duration_min) * 0.62 + normalizeDistance(order.distance_km) * 0.18 + (getDelayFlag(order) ? 0.2 : 0));
}

function aggregateOrders(orders: DistanceTimePoint[], key: string, label: string, extra: Partial<WeatherMetricRow> = {}): WeatherMetricRow {
  const order_count = orders.length;
  const delayed_orders = orders.filter((order) => getDelayFlag(order)).length;
  const avgDuration = mean(orders.map((order) => order.delivery_duration_min));
  const avgDistance = mean(orders.map((order) => order.distance_km));
  const delayRate = order_count ? delayed_orders / order_count : 0;
  const orderRiskMean = mean(orders.map(getOrderRiskScore));

  return {
    key,
    label,
    order_count,
    delayed_orders,
    avg_delivery_duration_min: avgDuration,
    avg_distance_km: avgDistance,
    delay_rate: delayRate,
    // 订单级 risk_score 可能缺失，因此聚合风险用时长、延迟率和订单风险均值组合，统一压到 0-1。
    risk_score: clamp01(normalizeDuration(avgDuration) * 0.45 + delayRate * 0.4 + orderRiskMean * 0.15),
    ...extra
  };
}

function groupOrders(orders: DistanceTimePoint[], key: GroupKey, order: string[], formatter: (value: string | null | undefined) => string) {
  const grouped = new Map<string, DistanceTimePoint[]>();
  orders.forEach((item) => {
    const value = item[key] ?? 'Unknown';
    grouped.set(value, [...(grouped.get(value) ?? []), item]);
  });

  return Array.from(grouped.entries())
    .map(([value, rows]) => aggregateOrders(rows, value, formatter(value), { [key]: value }))
    .sort((a, b) => {
      const ai = order.indexOf(a.key);
      const bi = order.indexOf(b.key);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return a.label.localeCompare(b.label, 'zh-Hans-CN');
    });
}

export function filterOrdersByWeather(orders: DistanceTimePoint[], weather: string) {
  const selected = canonicalWeather(weather);
  if (isAll(selected)) return orders;
  return orders.filter((order) => canonicalWeather(order.weather) === selected);
}

export function filterOrdersByTimePeriod(orders: DistanceTimePoint[], timePeriod: string) {
  if (isAll(timePeriod)) return orders;
  return orders.filter((order) => order.time_period === timePeriod);
}

export function aggregateWeatherOverview(allOrders: DistanceTimePoint[], weather: string): WeatherOverviewPair {
  const weatherOrders = filterOrdersByWeather(allOrders, weather);
  const baselineOrders = filterOrdersByWeather(allOrders, 'All');
  const selectedWeather = canonicalWeather(weather) ?? 'All';
  const currentRow = aggregateOrders(weatherOrders, selectedWeather, formatWeatherName(selectedWeather), { weather: selectedWeather });
  const baselineRow = aggregateOrders(baselineOrders, 'All', '全部天气', { weather: 'All' });

  return {
    current: {
      weather: selectedWeather,
      order_count: currentRow.order_count,
      avg_delivery_duration_min: currentRow.avg_delivery_duration_min,
      avg_distance_km: currentRow.avg_distance_km,
      delay_rate: currentRow.delay_rate,
      risk_score: currentRow.risk_score
    },
    baseline: {
      weather: 'All',
      order_count: baselineRow.order_count,
      avg_delivery_duration_min: baselineRow.avg_delivery_duration_min,
      avg_distance_km: baselineRow.avg_distance_km,
      delay_rate: baselineRow.delay_rate,
      risk_score: baselineRow.risk_score
    }
  };
}

export function aggregateByTrafficDensity(weatherOrders: DistanceTimePoint[]) {
  const weather = inferWeather(weatherOrders);
  return groupOrders(weatherOrders, 'traffic_density', TRAFFIC_ORDER, formatTrafficDensity)
    .map((row) => ({ ...row, weather }));
}

export function aggregateByTimePeriod(weatherOrders: DistanceTimePoint[]) {
  const weather = inferWeather(weatherOrders);
  return groupOrders(weatherOrders, 'time_period', TIME_ORDER, formatTimePeriod)
    .map((row) => ({ ...row, weather }));
}

export function aggregateByVehicleType(weatherOrders: DistanceTimePoint[]) {
  const weather = inferWeather(weatherOrders);
  return groupOrders(weatherOrders, 'vehicle_type', VEHICLE_ORDER, formatVehicleType)
    .map((row) => ({ ...row, weather }))
    .sort((a, b) => b.avg_delivery_duration_min - a.avg_delivery_duration_min || b.order_count - a.order_count);
}

export function aggregateRiskScenarios(weatherOrders: DistanceTimePoint[], minOrderCount = 10): RiskScenario[] {
  const grouped = new Map<string, DistanceTimePoint[]>();
  weatherOrders.forEach((order) => {
    const traffic = order.traffic_density ?? 'Unknown';
    const time = order.time_period ?? 'Unknown';
    const vehicle = order.vehicle_type ?? 'Unknown';
    const key = `${traffic}__${time}__${vehicle}`;
    grouped.set(key, [...(grouped.get(key) ?? []), order]);
  });

  return Array.from(grouped.entries())
    .map(([key, rows]) => {
      const [traffic, time, vehicle] = key.split('__');
      const aggregate = aggregateOrders(rows, key, `${formatTrafficDensity(traffic)} · ${formatTimePeriod(time)} · ${formatVehicleType(vehicle)}`, {
        weather: canonicalWeather(rows[0]?.weather) ?? 'Unknown',
        traffic_density: traffic,
        time_period: time,
        vehicle_type: vehicle
      });
      return {
        scenario_id: `weather-${canonicalWeather(rows[0]?.weather) ?? 'Unknown'}-${key}`,
        label: aggregate.label,
        weather: aggregate.weather,
        traffic_density: traffic,
        time_period: time,
        vehicle_type: vehicle,
        order_count: aggregate.order_count,
        avg_delivery_duration_min: aggregate.avg_delivery_duration_min,
        avg_distance_km: aggregate.avg_distance_km,
        delay_rate: aggregate.delay_rate,
        risk_score: aggregate.risk_score
      };
    })
    .filter((row) => row.order_count >= minOrderCount)
    .sort((a, b) => b.risk_score - a.risk_score || b.order_count - a.order_count);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getOrderScatterData(weatherOrders: DistanceTimePoint[], limit = 260): WeatherScatterData {
  const sorted = [...weatherOrders].sort((a, b) => hashString(`${a.order_id}:${a.distance_km}`) - hashString(`${b.order_id}:${b.distance_km}`));
  const sampled = sorted.length <= limit
    ? sorted
    : Array.from({ length: limit }, (_, index) => sorted[Math.floor(index * (sorted.length / limit))]);
  const aggregate = aggregateOrders(weatherOrders, 'orders', '订单散点');

  return {
    points: sampled.map((order) => ({
      id: order.order_id,
      order_id: order.order_id,
      scenario_id: order.scenario_id,
      x: 0,
      y: 0,
      city: order.city,
      weather: canonicalWeather(order.weather) ?? 'Unknown',
      traffic_density: order.traffic_density ?? 'Unknown',
      time_period: order.time_period ?? 'Unknown',
      vehicle_type: order.vehicle_type ?? 'Unknown',
      distance_km: order.distance_km,
      delivery_duration_min: order.delivery_duration_min,
      is_delayed: getDelayFlag(order),
      delay_rate: getDelayFlag(order) ? 1 : 0,
      risk_score: getOrderRiskScore(order),
      risk_visual_score: getOrderRiskScore(order)
    })),
    fullCount: weatherOrders.length,
    delayedCount: aggregate.delayed_orders,
    avgDeliveryDurationMin: aggregate.avg_delivery_duration_min,
    avgDistanceKm: aggregate.avg_distance_km,
    delayRate: aggregate.delay_rate,
    riskScore: aggregate.risk_score
  };
}

export function getRiskLevel(value: number, thresholdConfig = { medium: 0.34, high: 0.56, severe: 0.72 }) {
  if (value >= thresholdConfig.severe) return 'severe';
  if (value >= thresholdConfig.high) return 'high';
  if (value >= thresholdConfig.medium) return 'medium';
  return 'low';
}

export function getRiskColor(value: number) {
  return RISK_COLORS[getRiskLevel(value)];
}

function shortInsight(value: string) {
  return value.length <= 30 ? value : value.slice(0, 30);
}

function scenePhrase(row: Pick<RiskScenario, 'traffic_density' | 'time_period'>) {
  const traffic = formatTrafficDensity(row.traffic_density);
  const time = formatTimePeriod(row.time_period);
  if (row.traffic_density === 'Jam') return `拥堵${time}组合需优先干预`;
  if (row.traffic_density === 'High') return `高密度${time}需提前调度`;
  return `${traffic}${time}组合需关注`;
}

export function getWeatherInsight(type: string, rows: WeatherMetricRow[] | RiskScenario[] | WeatherScatterData | WeatherOverviewPair, weather: string) {
  const label = formatWeatherName(weather);
  if (type === 'overview') {
    const { current, baseline } = rows as WeatherOverviewPair;
    const delta = (current.avg_delivery_duration_min ?? 0) - (baseline.avg_delivery_duration_min ?? 0);
    return shortInsight(`${label}ETA较全局${delta >= 0 ? '高' : '低'}${Math.abs(delta).toFixed(1)}分钟`);
  }
  if (type === 'traffic') {
    const top = [...(rows as WeatherMetricRow[])].sort((a, b) => b.risk_score - a.risk_score)[0];
    return top ? shortInsight(`${top.label}延迟压力最突出`) : '暂无交通分组样本';
  }
  if (type === 'time') {
    const top = [...(rows as WeatherMetricRow[])].sort((a, b) => b.risk_score - a.risk_score)[0];
    return top ? shortInsight(`${top.label}窗口需加密监控`) : '暂无时段样本';
  }
  if (type === 'vehicle') {
    const top = [...(rows as WeatherMetricRow[])][0];
    return top ? shortInsight(`${top.label}履约时长偏慢`) : '暂无载具样本';
  }
  if (type === 'risk') {
    const top = (rows as RiskScenario[])[0];
    return top ? shortInsight(scenePhrase(top)) : '暂无稳定高风险组合';
  }
  const scatter = rows as WeatherScatterData;
  const points = scatter.points;
  const delayed = points.filter((point) => point.is_delayed);
  const shortDelayed = delayed.filter((point) => point.distance_km <= scatter.avgDistanceKm).length;
  const longDelayed = delayed.length - shortDelayed;
  if (!delayed.length) return '订单散点整体较稳定';
  return shortInsight(shortDelayed >= longDelayed ? '短距离延迟提示非距离因素' : '长距离订单延迟更集中');
}

export function formatWeatherName(weather: string | null | undefined) {
  const canonical = canonicalWeather(weather);
  return WEATHER_LABELS[canonical ?? ''] ?? canonical ?? '-';
}

export function formatWeatherFilterName(weather: string | null | undefined) {
  return isAll(weather) ? '全部天气' : formatWeatherName(weather);
}

export function formatTrafficDensity(value: string | null | undefined) {
  return TRAFFIC_LABELS[value ?? ''] ?? value ?? '-';
}

export function formatTimePeriod(value: string | null | undefined) {
  return TIME_LABELS[value ?? ''] ?? value ?? '-';
}

export function formatVehicleType(value: string | null | undefined) {
  return VEHICLE_LABELS[value ?? ''] ?? value ?? '-';
}

export function formatNumber(value: number | undefined | null, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

export function formatPercent(value: number | undefined | null) {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(normalizeRate(value) * 100)}%` : '-';
}

export function toWeatherTrafficSummary(row: WeatherMetricRow): WeatherTrafficSummary {
  return {
    weather: row.weather ?? null,
    traffic_density: row.traffic_density ?? null,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score
  };
}

export function toSceneFilterSummary(row: WeatherMetricRow): SceneFilterSummary {
  return {
    scene_id: 'weather_time_orders',
    weather: row.weather ?? null,
    time_period: row.time_period ?? null,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score,
    delay_threshold_min: DELAY_THRESHOLD_MIN
  };
}

export function toWeatherVehicleSummary(row: WeatherMetricRow): WeatherVehicleSummary {
  return {
    weather: row.weather ?? null,
    vehicle_type: row.vehicle_type ?? row.key,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score
  };
}
