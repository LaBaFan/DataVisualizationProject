import {
  loadRiskScenarioSummary,
  loadSceneFilterSummary,
  loadWeatherImpactSummary,
  loadWeatherTrafficSummary
} from '../api/staticDataClient';
import type {
  RiskScenario,
  SceneFilterSummary,
  WeatherComparisonMetric,
  WeatherComparisonMode,
  WeatherComparisonRow,
  WeatherComparisonWeather,
  WeatherImpactSummary,
  WeatherTrafficSummary
} from '../types/data';
import type { WeatherModuleId } from './weatherModules';

export const WEATHER_COMPARISON_WEATHERS: WeatherComparisonWeather[] = [
  'Sunny',
  'Fog',
  'Cloudy',
  'Stormy',
  'Sandstorms',
  'Windy'
];

const weatherToModule: Record<WeatherComparisonWeather, WeatherModuleId> = {
  Sunny: 'sunny',
  Fog: 'fog',
  Cloudy: 'cloudy',
  Stormy: 'stormy',
  Sandstorms: 'sandstorms',
  Windy: 'windy'
};

const weatherDescriptions: Record<WeatherComparisonWeather, string> = {
  Sunny: '晴天基线，用于对照非极端天气下的 ETA 波动。',
  Fog: '雾天强调能见度下降后的配送速度变化。',
  Cloudy: '多云呈现常规压力下的配送稳定性。',
  Stormy: '雷暴关注强天气对配送时长和延迟率的放大。',
  Sandstorms: '沙尘关注道路环境变化下的履约稳定性。',
  Windy: '大风关注骑行速度和路径稳定性的波动。'
};

const sceneWeatherMap: Record<string, WeatherComparisonWeather> = {
  sunny: 'Sunny',
  fog: 'Fog',
  fog_business: 'Fog',
  cloudy: 'Cloudy',
  stormy: 'Stormy',
  storm_area: 'Stormy',
  sandstorms: 'Sandstorms',
  sandstorm: 'Sandstorms',
  windy: 'Windy'
};

const modeLabel: Record<WeatherComparisonMode, string> = {
  all: '全部天气基线对比',
  time_period: '按时段横向对比',
  traffic_density: '按交通密度横向对比',
  vehicle_type: '按载具类型横向对比'
};

const timeLabels: Record<string, string> = {
  All: '全部时段',
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间'
};

const trafficLabels: Record<string, string> = {
  All: '全部密度',
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵'
};

const vehicleLabels: Record<string, string> = {
  All: '全部载具',
  motorcycle: '摩托车',
  scooter: '踏板车',
  electric_scooter: '电动车'
};

type MetricCarrier = {
  order_count?: number | null;
  avg_delivery_duration_min?: number | null;
  delay_rate?: number | null;
  risk_score?: number | null;
  avg_distance_km?: number | null;
};

type AggregateBucket = {
  order_count: number;
  durationWeighted: number;
  durationWeight: number;
  delayWeighted: number;
  delayWeight: number;
  riskWeighted: number;
  riskWeight: number;
  distanceWeighted: number;
  distanceWeight: number;
};

export interface WeatherComparisonInput {
  mode: WeatherComparisonMode;
  selectedTimePeriod: string;
  selectedTrafficDensity: string;
  selectedVehicleType: string;
  metric: WeatherComparisonMetric;
}

function finiteNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeRate(value: number | null | undefined) {
  const numeric = finiteNumber(value);
  if (numeric === null) return null;
  return numeric > 1 ? numeric / 100 : Math.max(0, numeric);
}

function emptyBucket(): AggregateBucket {
  return {
    order_count: 0,
    durationWeighted: 0,
    durationWeight: 0,
    delayWeighted: 0,
    delayWeight: 0,
    riskWeighted: 0,
    riskWeight: 0,
    distanceWeighted: 0,
    distanceWeight: 0
  };
}

function addWeighted(bucket: AggregateBucket, row: MetricCarrier) {
  const orderCount = finiteNumber(row.order_count);
  const weight = orderCount && orderCount > 0 ? orderCount : 0;
  if (orderCount && orderCount > 0) bucket.order_count += orderCount;

  const duration = finiteNumber(row.avg_delivery_duration_min);
  if (duration !== null && weight > 0) {
    bucket.durationWeighted += duration * weight;
    bucket.durationWeight += weight;
  }

  const delayRate = normalizeRate(row.delay_rate);
  if (delayRate !== null && weight > 0) {
    bucket.delayWeighted += delayRate * weight;
    bucket.delayWeight += weight;
  }

  const riskScore = normalizeRate(row.risk_score);
  if (riskScore !== null && weight > 0) {
    bucket.riskWeighted += riskScore * weight;
    bucket.riskWeight += weight;
  }

  const distance = finiteNumber(row.avg_distance_km);
  if (distance !== null && weight > 0) {
    bucket.distanceWeighted += distance * weight;
    bucket.distanceWeight += weight;
  }
}

function fromBucket(weather: WeatherComparisonWeather, bucket: AggregateBucket, dataFilter: string, sourceFile: string): WeatherComparisonRow {
  return {
    weather,
    moduleId: weatherToModule[weather],
    order_count: bucket.order_count > 0 ? bucket.order_count : null,
    avg_delivery_duration_min: bucket.durationWeight > 0 ? bucket.durationWeighted / bucket.durationWeight : null,
    delay_rate: bucket.delayWeight > 0 ? bucket.delayWeighted / bucket.delayWeight : null,
    risk_score: bucket.riskWeight > 0 ? bucket.riskWeighted / bucket.riskWeight : null,
    avg_distance_km: bucket.distanceWeight > 0 ? bucket.distanceWeighted / bucket.distanceWeight : null,
    dataFilter,
    sourceFile,
    description: weatherDescriptions[weather]
  };
}

function fromSingleRow(weather: WeatherComparisonWeather, row: MetricCarrier | undefined, dataFilter: string, sourceFile: string): WeatherComparisonRow {
  return {
    weather,
    moduleId: weatherToModule[weather],
    order_count: finiteNumber(row?.order_count),
    avg_delivery_duration_min: finiteNumber(row?.avg_delivery_duration_min),
    delay_rate: normalizeRate(row?.delay_rate),
    risk_score: normalizeRate(row?.risk_score),
    avg_distance_km: finiteNumber(row?.avg_distance_km),
    dataFilter,
    sourceFile,
    description: weatherDescriptions[weather]
  };
}

function sortRows(rows: WeatherComparisonRow[], metric: WeatherComparisonMetric) {
  return [...rows].sort((a, b) => {
    const left = a[metric];
    const right = b[metric];
    if (left === null && right === null) return WEATHER_COMPARISON_WEATHERS.indexOf(a.weather) - WEATHER_COMPARISON_WEATHERS.indexOf(b.weather);
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left;
  });
}

function inferWeatherFromScene(row: SceneFilterSummary): WeatherComparisonWeather | null {
  if (row.weather && row.weather !== 'All' && WEATHER_COMPARISON_WEATHERS.includes(row.weather as WeatherComparisonWeather)) {
    return row.weather as WeatherComparisonWeather;
  }
  return sceneWeatherMap[row.scene_id] ?? null;
}

function buildAllRows(rows: WeatherImpactSummary[]) {
  const byWeather = new Map(rows.map((row) => [row.weather, row]));
  return WEATHER_COMPARISON_WEATHERS.map((weather) =>
    fromSingleRow(weather, byWeather.get(weather), '比较方式：全部天气', 'weather_impact_summary.json')
  );
}

function buildTimeRows(rows: SceneFilterSummary[], selectedTimePeriod: string) {
  const buckets = new Map<WeatherComparisonWeather, AggregateBucket>();
  rows
    .filter((row) => row.time_period === selectedTimePeriod)
    .forEach((row) => {
      const weather = inferWeatherFromScene(row);
      if (!weather) return;
      const bucket = buckets.get(weather) ?? emptyBucket();
      addWeighted(bucket, row);
      buckets.set(weather, bucket);
    });

  return WEATHER_COMPARISON_WEATHERS.map((weather) =>
    fromBucket(weather, buckets.get(weather) ?? emptyBucket(), `配送时段：${timeLabels[selectedTimePeriod] ?? selectedTimePeriod}`, 'scene_filter_summary.json')
  );
}

function buildTrafficRows(rows: WeatherTrafficSummary[], selectedTrafficDensity: string) {
  if (selectedTrafficDensity === 'All') {
    const buckets = new Map<WeatherComparisonWeather, AggregateBucket>();
    rows.forEach((row) => {
      if (!row.weather || !WEATHER_COMPARISON_WEATHERS.includes(row.weather as WeatherComparisonWeather)) return;
      const weather = row.weather as WeatherComparisonWeather;
      const bucket = buckets.get(weather) ?? emptyBucket();
      addWeighted(bucket, row);
      buckets.set(weather, bucket);
    });

    return WEATHER_COMPARISON_WEATHERS.map((weather) =>
      fromBucket(weather, buckets.get(weather) ?? emptyBucket(), '交通密度：全部密度', 'weather_traffic_summary.json')
    );
  }

  const byWeather = new Map(
    rows
      .filter((row) => row.traffic_density === selectedTrafficDensity)
      .map((row) => [row.weather, row])
  );

  return WEATHER_COMPARISON_WEATHERS.map((weather) =>
    fromSingleRow(weather, byWeather.get(weather), `交通密度：${trafficLabels[selectedTrafficDensity] ?? selectedTrafficDensity}`, 'weather_traffic_summary.json')
  );
}

function buildVehicleRows(rows: RiskScenario[], selectedVehicleType: string) {
  const supportedVehicles = new Set(['motorcycle', 'scooter', 'electric_scooter']);
  const buckets = new Map<WeatherComparisonWeather, AggregateBucket>();
  rows
    .filter((row) => {
      if (!row.weather) return false;
      if (selectedVehicleType === 'All') return supportedVehicles.has(row.vehicle_type ?? '');
      return row.vehicle_type === selectedVehicleType;
    })
    .forEach((row) => {
      if (!WEATHER_COMPARISON_WEATHERS.includes(row.weather as WeatherComparisonWeather)) return;
      const weather = row.weather as WeatherComparisonWeather;
      const bucket = buckets.get(weather) ?? emptyBucket();
      addWeighted(bucket, row);
      buckets.set(weather, bucket);
    });

  return WEATHER_COMPARISON_WEATHERS.map((weather) =>
    fromBucket(weather, buckets.get(weather) ?? emptyBucket(), `载具类型：${vehicleLabels[selectedVehicleType] ?? selectedVehicleType}`, 'risk_scenario_summary.json')
  );
}

export async function getWeatherComparisonRows(input: WeatherComparisonInput): Promise<WeatherComparisonRow[]> {
  let rows: WeatherComparisonRow[];

  if (input.mode === 'time_period') {
    rows = input.selectedTimePeriod === 'All'
      ? buildAllRows(await loadWeatherImpactSummary()).map((row) => ({
        ...row,
        dataFilter: '配送时段：全部时段',
        sourceFile: 'weather_impact_summary.json'
      }))
      : buildTimeRows(await loadSceneFilterSummary(), input.selectedTimePeriod);
  } else if (input.mode === 'traffic_density') {
    rows = buildTrafficRows(await loadWeatherTrafficSummary(), input.selectedTrafficDensity);
  } else if (input.mode === 'vehicle_type') {
    rows = input.selectedVehicleType === 'All'
      ? buildAllRows(await loadWeatherImpactSummary()).map((row) => ({
        ...row,
        dataFilter: '载具类型：全部载具',
        sourceFile: 'weather_impact_summary.json'
      }))
      : buildVehicleRows(await loadRiskScenarioSummary(), input.selectedVehicleType);
  } else {
    rows = buildAllRows(await loadWeatherImpactSummary());
  }

  return sortRows(rows, input.metric).map((row, index) => ({
    ...row,
    description: `${row.description} ${index === 0 && row[input.metric] !== null ? '当前指标最高。' : modeLabel[input.mode]}`
  }));
}

export function highestMetricValue(rows: WeatherComparisonRow[], metric: WeatherComparisonMetric) {
  return rows.find((row) => row[metric] !== null)?.[metric] ?? null;
}
