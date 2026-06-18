import { useEffect, useState } from 'react';
import { loadDistanceTimeSample } from '../../api/staticDataClient';
import type {
  DistanceTimePoint,
  RiskHeatHalo,
  RiskScenario,
  WeatherImpactSummary,
  WeatherTrafficSummary,
  WeatherVehicleSummary,
  SceneFilterSummary
} from '../../types/data';
import {
  formatNumber,
  formatPercent,
  formatTimePeriod,
  formatTrafficDensity,
  formatVehicleType,
  formatWeatherName,
  normalizeRate,
  TIME_LABELS,
  TIME_ORDER,
  TRAFFIC_ORDER,
  WEATHER_LABELS
} from './weatherAnalytics';

export { TIME_LABELS, TIME_ORDER, TRAFFIC_ORDER, WEATHER_LABELS };

export interface WeatherViewData {
  orders: DistanceTimePoint[];
  loading: boolean;
}

export type WeatherSummaryRow = WeatherTrafficSummary | WeatherVehicleSummary | SceneFilterSummary | WeatherImpactSummary;

export function rowToMetric(row: WeatherSummaryRow) {
  return {
    key: row.weather ?? 'All',
    label: weatherLabel(row.weather),
    weather: row.weather,
    traffic_density: 'traffic_density' in row ? row.traffic_density : undefined,
    time_period: 'time_period' in row ? row.time_period : undefined,
    vehicle_type: 'vehicle_type' in row ? row.vehicle_type : undefined,
    order_count: row.order_count,
    delayed_orders: Math.round(row.order_count * row.delay_rate),
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km ?? 0,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score ?? row.delay_rate
  };
}

export function useWeatherViewData() {
  const [data, setData] = useState<WeatherViewData>({
    orders: [],
    loading: true
  });

  useEffect(() => {
    let mounted = true;
    loadDistanceTimeSample()
      .then((orders) => {
        if (!mounted) return;
        setData({ orders, loading: false });
      })
      .catch((error) => {
        console.warn('[FoodETA] Failed to load weather detail order data.', error);
        if (mounted) setData({ orders: [], loading: false });
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
  return formatNumber(value, digits);
}

export function pct(value: number | undefined | null) {
  return formatPercent(value);
}

export function barWidth(value: number | undefined | null, max: number) {
  if (!max || !Number.isFinite(max)) return '0%';
  return `${Math.max(3, Math.min(100, Math.round(((value ?? 0) / max) * 100)))}%`;
}

export function weatherLabel(weather: string | null | undefined) {
  return formatWeatherName(weather);
}

export function timeLabel(timePeriod: string | null | undefined) {
  return formatTimePeriod(timePeriod);
}

export function trafficLabel(trafficDensity: string | null | undefined) {
  return formatTrafficDensity(trafficDensity);
}

export function vehicleLabel(vehicleType: string | null | undefined) {
  return formatVehicleType(vehicleType);
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
