import {
  MapScene,
  MapSceneSummary,
  OverviewSummary,
  SceneFilterSummary,
  TimePeriodSummary,
  TrafficDensitySummary,
  ViewContextMetrics,
  WeatherImpactSummary
} from '../types/data';

interface BuildSceneHudMetricsArgs {
  selectedScene: MapScene;
  selectedWeather: string;
  selectedTimePeriod: string;
  overview?: OverviewSummary | null;
  weatherRows: WeatherImpactSummary[];
  timeRows: TimePeriodSummary[];
  trafficRows: TrafficDensitySummary[];
  sceneFilterRows: SceneFilterSummary[];
}

type HudMetricSource = MapSceneSummary & {
  weather?: string;
  time_period?: string;
};

const DEFAULT_HUD_METRICS: ViewContextMetrics = {
  weather: 'All',
  time_period: 'All',
  order_count: 0,
  avg_delivery_duration_min: 34,
  delay_threshold_min: 32,
  delay_rate: 0.28
};

function isAll(value: string | null | undefined) {
  return !value || value === 'All';
}

function keyOf(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function normalizeRate(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value > 1) return value / 100;
  if (value < 0) return 0;
  return value;
}

function firstFiniteNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value));
}

function averageFinite(...values: Array<number | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!validValues.length) return undefined;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function overviewToSource(overview?: OverviewSummary | null): HudMetricSource | null {
  if (!overview) return null;

  const orderCount = firstFiniteNumber(overview.order_count, overview.valid_orders, overview.total_orders);
  const avgDeliveryDuration = firstFiniteNumber(overview.avg_delivery_duration_min);
  const delayRate = normalizeRate(overview.delay_rate);

  if (orderCount === undefined || avgDeliveryDuration === undefined || delayRate === undefined) return null;

  return {
    order_count: Math.round(orderCount),
    avg_delivery_duration_min: avgDeliveryDuration,
    delay_rate: delayRate,
    delay_threshold_min: firstFiniteNumber(overview.delay_threshold_min, 32)
  };
}

function weatherToSource(row: WeatherImpactSummary | undefined, fallbackThreshold: number): HudMetricSource | null {
  if (!row) return null;

  return {
    weather: row.weather ?? 'All',
    order_count: Math.round(row.order_count),
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    delay_rate: normalizeRate(row.delay_rate) ?? row.delay_rate,
    risk_score: normalizeRate(row.risk_score),
    delay_threshold_min: fallbackThreshold
  };
}

function timeToSource(row: TimePeriodSummary | undefined, fallbackThreshold: number): HudMetricSource | null {
  if (!row) return null;

  return {
    time_period: row.time_period ?? 'All',
    order_count: Math.round(row.order_count),
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    delay_rate: normalizeRate(row.delay_rate) ?? row.delay_rate,
    delay_threshold_min: fallbackThreshold
  };
}

function sceneSummaryToSource(summary: MapSceneSummary | undefined, fallbackThreshold: number): HudMetricSource | null {
  if (!summary) return null;

  return {
    ...summary,
    order_count: Math.round(summary.order_count),
    delay_rate: normalizeRate(summary.delay_rate) ?? summary.delay_rate,
    risk_score: normalizeRate(summary.risk_score),
    delay_threshold_min: firstFiniteNumber(summary.delay_threshold_min, fallbackThreshold)
  };
}

function sceneFilterToSource(row: SceneFilterSummary | undefined, fallbackThreshold: number): HudMetricSource | null {
  if (!row) return null;

  return {
    ...row,
    weather: row.weather ?? 'All',
    time_period: row.time_period ?? 'All',
    order_count: Math.round(row.order_count),
    delay_rate: normalizeRate(row.delay_rate) ?? row.delay_rate,
    risk_score: normalizeRate(row.risk_score),
    delay_threshold_min: firstFiniteNumber(row.delay_threshold_min, fallbackThreshold)
  };
}

function zeroFilterSource(
  selectedWeather: string,
  selectedTimePeriod: string,
  fallbackSource: HudMetricSource,
  fallbackThreshold: number
): HudMetricSource {
  return {
    weather: selectedWeather,
    time_period: selectedTimePeriod,
    order_count: 0,
    avg_delivery_duration_min: fallbackSource.avg_delivery_duration_min,
    delay_rate: 0,
    risk_score: 0,
    avg_distance_km: fallbackSource.avg_distance_km,
    delay_threshold_min: firstFiniteNumber(fallbackSource.delay_threshold_min, fallbackThreshold)
  };
}

function trafficToSource(rows: TrafficDensitySummary[], fallbackThreshold: number): HudMetricSource | null {
  const targetRows = rows.filter((row) => ['high', 'jam'].includes(keyOf(row.traffic_density)));
  if (!targetRows.length) return null;

  const totalOrders = targetRows.reduce((sum, row) => sum + Math.max(0, row.order_count), 0);
  if (totalOrders <= 0) return null;

  const weightedDuration = targetRows.reduce((sum, row) => sum + row.avg_delivery_duration_min * row.order_count, 0);
  const weightedDelay = targetRows.reduce((sum, row) => sum + (normalizeRate(row.delay_rate) ?? row.delay_rate) * row.order_count, 0);
  const weightedRisk = targetRows.reduce((sum, row) => sum + (normalizeRate(row.risk_score) ?? row.risk_score) * row.order_count, 0);

  return {
    order_count: Math.round(totalOrders),
    avg_delivery_duration_min: weightedDuration / totalOrders,
    delay_rate: weightedDelay / totalOrders,
    risk_score: weightedRisk / totalOrders,
    delay_threshold_min: fallbackThreshold
  };
}

function combineSources(
  weatherSource: HudMetricSource,
  timeSource: HudMetricSource,
  globalSource: HudMetricSource,
  fallbackThreshold: number
): HudMetricSource {
  const estimatedOrders = Math.max(
    1,
    Math.round((weatherSource.order_count * timeSource.order_count) / Math.max(globalSource.order_count, 1))
  );

  return {
    weather: weatherSource.weather,
    time_period: timeSource.time_period,
    order_count: estimatedOrders,
    avg_delivery_duration_min:
      averageFinite(weatherSource.avg_delivery_duration_min, timeSource.avg_delivery_duration_min) ??
      globalSource.avg_delivery_duration_min,
    delay_rate: averageFinite(weatherSource.delay_rate, timeSource.delay_rate) ?? globalSource.delay_rate,
    risk_score: averageFinite(weatherSource.risk_score, timeSource.risk_score),
    delay_threshold_min: firstFiniteNumber(weatherSource.delay_threshold_min, timeSource.delay_threshold_min, fallbackThreshold)
  };
}

function toHudMetrics(source: HudMetricSource, selectedWeather: string, selectedTimePeriod: string): ViewContextMetrics {
  return {
    weather: source.weather ?? selectedWeather,
    time_period: source.time_period ?? selectedTimePeriod,
    order_count: Math.round(source.order_count),
    avg_delivery_duration_min: source.avg_delivery_duration_min,
    delay_threshold_min: source.delay_threshold_min ?? DEFAULT_HUD_METRICS.delay_threshold_min,
    delay_rate: normalizeRate(source.delay_rate) ?? source.delay_rate,
    risk_score: normalizeRate(source.risk_score),
    avg_distance_km: source.avg_distance_km
  };
}

export function buildSceneHudMetrics({
  selectedScene,
  selectedWeather,
  selectedTimePeriod,
  overview,
  weatherRows,
  timeRows,
  trafficRows,
  sceneFilterRows
}: BuildSceneHudMetricsArgs): ViewContextMetrics {
  const overviewSource = overviewToSource(overview);
  const fallbackThreshold = firstFiniteNumber(
    overviewSource?.delay_threshold_min,
    selectedScene.summary?.delay_threshold_min,
    DEFAULT_HUD_METRICS.delay_threshold_min
  )!;
  const globalSource = overviewSource ?? {
    ...DEFAULT_HUD_METRICS,
    delay_threshold_min: fallbackThreshold
  };

  const sourceForWeather = (weather: string | null | undefined) =>
    weatherToSource(
      weatherRows.find((row) => keyOf(row.weather) === keyOf(weather)),
      fallbackThreshold
    );
  const sourceForTimePeriod = (timePeriod: string | null | undefined) =>
    timeToSource(
      timeRows.find((row) => keyOf(row.time_period) === keyOf(timePeriod)),
      fallbackThreshold
    );
  const selectedWeatherSource = isAll(selectedWeather) ? null : sourceForWeather(selectedWeather);
  const selectedTimeSource = isAll(selectedTimePeriod) ? null : sourceForTimePeriod(selectedTimePeriod);
  const sceneSource = sceneSummaryToSource(selectedScene.summary, fallbackThreshold);
  const hasSceneFilterTable = sceneFilterRows.length > 0;
  const sceneFilterWeather = isAll(selectedWeather) ? 'All' : selectedWeather;
  const sceneFilterTimePeriod = isAll(selectedTimePeriod) ? 'All' : selectedTimePeriod;
  const sceneFilterSource = sceneFilterToSource(
    sceneFilterRows.find(
      (row) =>
        row.scene_id === selectedScene.id &&
        keyOf(row.weather) === keyOf(sceneFilterWeather) &&
        keyOf(row.time_period) === keyOf(sceneFilterTimePeriod)
    ),
    fallbackThreshold
  );
  const filterIsActive = !isAll(selectedWeather) || !isAll(selectedTimePeriod);
  const fallbackForZero = sceneSource ?? globalSource;

  if (hasSceneFilterTable && (selectedScene.type !== 'overall' || filterIsActive)) {
    if (sceneFilterSource) {
      return toHudMetrics(sceneFilterSource, selectedWeather, selectedTimePeriod);
    }

    return toHudMetrics(
      zeroFilterSource(sceneFilterWeather, sceneFilterTimePeriod, fallbackForZero, fallbackThreshold),
      selectedWeather,
      selectedTimePeriod
    );
  }

  if (selectedScene.type === 'overall') {
    if (selectedWeatherSource && selectedTimeSource) {
      return toHudMetrics(
        combineSources(selectedWeatherSource, selectedTimeSource, globalSource, fallbackThreshold),
        selectedWeather,
        selectedTimePeriod
      );
    }

    if (selectedWeatherSource) {
      return toHudMetrics(selectedWeatherSource, selectedWeather, selectedTimePeriod);
    }

    if (selectedTimeSource) {
      return toHudMetrics(selectedTimeSource, selectedWeather, selectedTimePeriod);
    }

    if (overviewSource) {
      return toHudMetrics(overviewSource, selectedWeather, selectedTimePeriod);
    }

    if (sceneSource) {
      return toHudMetrics(sceneSource, selectedWeather, selectedTimePeriod);
    }

    return toHudMetrics(globalSource, selectedWeather, selectedTimePeriod);
  }

  if (selectedScene.type === 'weather') {
    const relatedWeatherSource = sourceForWeather(selectedScene.relatedWeather);
    const weatherSource = relatedWeatherSource ?? selectedWeatherSource;
    if (weatherSource) {
      return toHudMetrics(weatherSource, selectedWeather, selectedTimePeriod);
    }

    if (sceneSource) {
      return toHudMetrics(sceneSource, selectedWeather, selectedTimePeriod);
    }

    return toHudMetrics(globalSource, selectedWeather, selectedTimePeriod);
  }

  if (selectedScene.type === 'time') {
    const relatedTimeSource = sourceForTimePeriod(selectedScene.relatedTimePeriod);
    const timeSource = relatedTimeSource ?? selectedTimeSource;
    if (timeSource) {
      return toHudMetrics(timeSource, selectedWeather, selectedTimePeriod);
    }

    if (sceneSource) {
      return toHudMetrics(sceneSource, selectedWeather, selectedTimePeriod);
    }

    return toHudMetrics(globalSource, selectedWeather, selectedTimePeriod);
  }

  if (selectedScene.type === 'traffic') {
    const trafficSource = trafficToSource(trafficRows, fallbackThreshold);
    if (trafficSource) return toHudMetrics(trafficSource, selectedWeather, selectedTimePeriod);

    if (sceneSource) {
      return toHudMetrics(sceneSource, selectedWeather, selectedTimePeriod);
    }

    return toHudMetrics(globalSource, selectedWeather, selectedTimePeriod);
  }

  if (sceneSource) {
    return toHudMetrics(sceneSource, selectedWeather, selectedTimePeriod);
  }

  return toHudMetrics(globalSource, selectedWeather, selectedTimePeriod);
}
