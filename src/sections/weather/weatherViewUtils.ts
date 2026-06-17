import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadRiskScenarioSummary,
  loadScenarioDistanceTimePoints,
  loadSceneFilterSummary,
  loadWeatherImpactSummary,
  loadWeatherTrafficSummary
} from '../../api/staticDataClient';
import type {
  DistanceTimePoint,
  OverviewSummary,
  RiskHeatHalo,
  RiskScenario,
  SceneFilterSummary,
  WeatherImpactSummary,
  WeatherTrafficSummary
} from '../../types/data';

export const TIME_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间'
};

export const TIME_ORDER = ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];

export const TRAFFIC_ORDER = ['Low', 'Medium', 'High', 'Jam'];

export const WEATHER_LABELS: Record<string, string> = {
  Sunny: '晴天',
  Cloudy: '多云',
  Fog: '雾天',
  Stormy: '暴雨',
  Sandstorms: '沙尘',
  Windy: '大风',
  All: '全部天气'
};

export interface VehicleSummary {
  vehicle_type: string;
  order_count: number;
  avg_delivery_duration_min: number;
  avg_distance_km: number;
  delay_rate: number;
  delayed_orders: number;
}

export interface WeatherViewData {
  overview: OverviewSummary | null;
  weatherImpact: WeatherImpactSummary[];
  weatherTraffic: WeatherTrafficSummary[];
  sceneFilters: SceneFilterSummary[];
  scenarios: RiskScenario[];
  points: DistanceTimePoint[];
}

export function useWeatherViewData() {
  const [data, setData] = useState<WeatherViewData>({
    overview: null,
    weatherImpact: [],
    weatherTraffic: [],
    sceneFilters: [],
    scenarios: [],
    points: []
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadOverviewSummary(),
      loadWeatherImpactSummary(),
      loadWeatherTrafficSummary(),
      loadSceneFilterSummary(),
      loadRiskScenarioSummary(),
      loadScenarioDistanceTimePoints()
    ]).then(([overview, weatherImpact, weatherTraffic, sceneFilters, scenarios, points]) => {
      if (!mounted) return;
      setData({ overview, weatherImpact, weatherTraffic, sceneFilters, scenarios, points });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return data;
}

export function isAll(value: string | null | undefined) {
  return !value || value === 'All';
}

export function fmt(value: number | undefined | null, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

export function pct(value: number | undefined | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

export function normalizeRate(value: number | undefined | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : Math.max(0, value);
}

export function barWidth(value: number | undefined | null, max: number) {
  if (!max || !Number.isFinite(max)) return '0%';
  return `${Math.max(3, Math.min(100, Math.round(((value ?? 0) / max) * 100)))}%`;
}

export function weatherLabel(weather: string | null | undefined) {
  return WEATHER_LABELS[weather ?? ''] ?? weather ?? '-';
}

export function timeLabel(timePeriod: string | null | undefined) {
  return TIME_LABELS[timePeriod ?? ''] ?? timePeriod ?? '-';
}

export function filteredByWeatherAndTime<T extends { weather?: string | null; time_period?: string | null }>(
  rows: T[],
  weather: string,
  timePeriod: string
) {
  return rows.filter((row) => {
    if (!isAll(weather) && row.weather !== weather) return false;
    if (!isAll(timePeriod) && row.time_period !== timePeriod) return false;
    return true;
  });
}

export function weightedAverage(totalWeight: number, weightedValue: number) {
  return totalWeight > 0 ? weightedValue / totalWeight : 0;
}

export function summarizeVehicle(points: DistanceTimePoint[], weather: string, timePeriod: string): VehicleSummary[] {
  const grouped = new Map<string, {
    order_count: number;
    duration: number;
    distance: number;
    delayed_orders: number;
  }>();

  filteredByWeatherAndTime(points, weather, timePeriod).forEach((point) => {
    const vehicle = point.vehicle_type || 'Unknown';
    const current = grouped.get(vehicle) ?? { order_count: 0, duration: 0, distance: 0, delayed_orders: 0 };
    current.order_count += 1;
    current.duration += point.delivery_duration_min;
    current.distance += point.distance_km;
    current.delayed_orders += point.is_delayed ? 1 : 0;
    grouped.set(vehicle, current);
  });

  return Array.from(grouped.entries())
    .map(([vehicle_type, row]) => ({
      vehicle_type,
      order_count: row.order_count,
      avg_delivery_duration_min: weightedAverage(row.order_count, row.duration),
      avg_distance_km: weightedAverage(row.order_count, row.distance),
      delay_rate: weightedAverage(row.order_count, row.delayed_orders),
      delayed_orders: row.delayed_orders
    }))
    .sort((a, b) => b.order_count - a.order_count);
}

export function scenarioToRiskSelection(scenario: RiskScenario): RiskHeatHalo {
  return {
    id: `weather-risk-${scenario.scenario_id}`,
    scenario_id: scenario.scenario_id,
    label: scenario.label,
    x: 760,
    y: 460,
    radius: Math.round(34 + normalizeRate(scenario.risk_score) * 32),
    order_count: scenario.order_count,
    avg_delivery_duration_min: scenario.avg_delivery_duration_min,
    delay_rate: scenario.delay_rate,
    risk_score: scenario.risk_score,
    weather: scenario.weather ?? undefined,
    traffic_density: scenario.traffic_density ?? undefined,
    time_period: scenario.time_period ?? undefined,
    vehicle_type: scenario.vehicle_type ?? undefined
  };
}

export function useWeatherContextRows(data: WeatherViewData, selectedWeather: string, selectedTimePeriod: string) {
  return useMemo(
    () => ({
      trafficRows: data.weatherTraffic
        .filter((row) => isAll(selectedWeather) || row.weather === selectedWeather)
        .sort((a, b) => TRAFFIC_ORDER.indexOf(a.traffic_density ?? '') - TRAFFIC_ORDER.indexOf(b.traffic_density ?? '')),
      timeRows: data.scenarios
        .filter((row) => isAll(selectedWeather) || row.weather === selectedWeather)
        .reduce<RiskScenario[]>((acc, row) => {
          const existing = acc.find((item) => item.time_period === row.time_period);
          if (!existing) {
            acc.push({ ...row });
            return acc;
          }
          const total = existing.order_count + row.order_count;
          existing.avg_delivery_duration_min = weightedAverage(total, existing.avg_delivery_duration_min * existing.order_count + row.avg_delivery_duration_min * row.order_count);
          existing.delay_rate = weightedAverage(total, normalizeRate(existing.delay_rate) * existing.order_count + normalizeRate(row.delay_rate) * row.order_count);
          existing.risk_score = Math.max(existing.risk_score, row.risk_score);
          existing.order_count = total;
          return acc;
        }, [])
        .filter((row) => isAll(selectedTimePeriod) || row.time_period === selectedTimePeriod)
        .sort((a, b) => TIME_ORDER.indexOf(a.time_period ?? '') - TIME_ORDER.indexOf(b.time_period ?? '')),
      riskRows: filteredByWeatherAndTime(data.scenarios, selectedWeather, selectedTimePeriod)
        .sort((a, b) => b.risk_score - a.risk_score || b.order_count - a.order_count),
      orderPoints: filteredByWeatherAndTime(data.points, selectedWeather, selectedTimePeriod)
    }),
    [data, selectedWeather, selectedTimePeriod]
  );
}
