import {
  CitySummary,
  CourierVehicleSummary,
  DeliveryTimeDistribution,
  DelayFactorFlow,
  DistanceTimePoint,
  HourSummary,
  OverviewSummary,
  RiskScenarioSummary,
  TimePeriodSummary,
  TimeAnnotation,
  WeatherTrafficSummary
} from '../types/data';
import { labelOf } from '../utils/format';

const API_BASE_URL = 'http://localhost:8000/api';
const processedModules = import.meta.glob('../../data/processed/*.json', { eager: true });

function staticJson<T>(fileName: string, fallback: T): T {
  const key = `../../data/processed/${fileName}`;
  const moduleValue = processedModules[key] as { default?: T } | undefined;
  return moduleValue?.default ?? fallback;
}

async function requestJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const payload = await response.json();
    if (payload && typeof payload === 'object' && payload.data_available === false) {
      return fallback;
    }
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload.data ?? fallback) as T;
    }
    return payload as T;
  } catch {
    return fallback;
  }
}

export async function getHealth(): Promise<{ status: string; source: string }> {
  return requestJson('/health', { status: 'unavailable', source: 'static-processed-json' });
}

export function getOverview(): Promise<OverviewSummary | null> {
  return requestJson('/overview', staticJson<OverviewSummary | null>('overview_summary.json', null));
}

export function getDeliveryTimeDistribution(): Promise<DeliveryTimeDistribution | null> {
  return requestJson(
    '/delivery-time-distribution',
    staticJson<DeliveryTimeDistribution | null>('delivery_time_distribution.json', null)
  );
}

export function getDistanceTimeSample(): Promise<DistanceTimePoint[]> {
  return requestJson(
    '/distance-time-sample',
    staticJson<DistanceTimePoint[]>('distance_time_sample.json', [])
  );
}

export function getHourSummary(): Promise<HourSummary[]> {
  return requestJson('/hour-summary', staticJson<HourSummary[]>('hour_summary.json', []));
}

export function getTimePeriodSummary(): Promise<TimePeriodSummary[]> {
  return requestJson('/time-period-summary', staticJson<TimePeriodSummary[]>('time_period_summary.json', []));
}

export function getWeatherTrafficSummary(): Promise<WeatherTrafficSummary[]> {
  return requestJson(
    '/weather-traffic-summary',
    staticJson<WeatherTrafficSummary[]>('weather_traffic_summary.json', [])
  );
}

export function getCourierVehicleSummary(): Promise<CourierVehicleSummary | null> {
  return requestJson(
    '/courier-vehicle-summary',
    staticJson<CourierVehicleSummary | null>('courier_vehicle_summary.json', null)
  );
}

export function getCitySummary(): Promise<CitySummary[]> {
  return requestJson('/city-summary', staticJson<CitySummary[]>('city_summary.json', []));
}

export async function getRiskScenarioSummary(): Promise<RiskScenarioSummary[]> {
  const apiData = await requestJson<RiskScenarioSummary[] | null>('/risk-scenario-summary', null);
  if (apiData) return apiData;
  const weatherTraffic = staticJson<WeatherTrafficSummary[]>('weather_traffic_summary.json', []);
  return weatherTraffic
    .slice()
    .sort((a, b) => b.delay_rate - a.delay_rate)
    .slice(0, 12)
    .map((item, index) => ({
      scenario_id: `derived-${index + 1}`,
      weather: item.weather,
      traffic_density: item.traffic_density,
      time_period: null,
      vehicle_type: null,
      order_count: item.order_count,
      avg_delivery_duration_min: item.avg_delivery_duration_min,
      avg_distance_km: item.avg_distance_km,
      delay_rate: item.delay_rate,
      risk_score: item.delay_rate * 0.55 + (item.avg_delivery_duration_min / 60) * 0.45
    }));
}

export async function getDelayFactorFlow(): Promise<DelayFactorFlow[]> {
  const apiData = await requestJson<DelayFactorFlow[] | null>('/delay-factor-flow', null);
  if (apiData) return apiData;
  const weatherTraffic = staticJson<WeatherTrafficSummary[]>('weather_traffic_summary.json', []);
  return weatherTraffic.slice(0, 10).flatMap((item, index) => [
    {
      source: labelOf(item.weather),
      target: labelOf(item.traffic_density),
      level: 1,
      order_count: item.order_count,
      avg_delivery_duration_min: item.avg_delivery_duration_min,
      delay_rate: item.delay_rate
    },
    {
      source: labelOf(item.traffic_density),
      target: item.delay_rate >= 0.25 ? 'Delayed' : 'On-time',
      level: 2 + index,
      order_count: item.order_count,
      avg_delivery_duration_min: item.avg_delivery_duration_min,
      delay_rate: item.delay_rate
    }
  ]);
}

export async function getTimeAnnotations(): Promise<TimeAnnotation[]> {
  const apiData = await requestJson<TimeAnnotation[] | null>('/time-annotations', null);
  if (apiData) return apiData;
  const hours = staticJson<HourSummary[]>('hour_summary.json', []);
  if (!hours.length) return [];
  const peakOrders = hours.reduce((best, item) => (item.order_count > best.order_count ? item : best), hours[0]);
  const peakDelay = hours.reduce((best, item) => (item.delay_rate > best.delay_rate ? item : best), hours[0]);
  return [
    {
      annotation_id: 'lunch-peak',
      time_value: 12,
      annotation_type: 'business-period',
      label: '午高峰',
      description: '午餐时段订单集中，适合观察距离和拥堵共同作用。',
      related_metric: 'order_count'
    },
    {
      annotation_id: 'dinner-peak',
      time_value: 19,
      annotation_type: 'business-period',
      label: '晚高峰',
      description: '晚餐时段通常承担最高配送压力。',
      related_metric: 'avg_delivery_duration_min'
    },
    {
      annotation_id: 'peak-orders',
      time_value: peakOrders.order_hour,
      annotation_type: 'data-peak',
      label: '订单量峰值',
      description: `${peakOrders.order_hour}:00 订单量最高，共 ${peakOrders.order_count} 单。`,
      related_metric: 'order_count'
    },
    {
      annotation_id: 'peak-delay',
      time_value: peakDelay.order_hour,
      annotation_type: 'data-peak',
      label: '延迟率峰值',
      description: `${peakDelay.order_hour}:00 延迟率最高。`,
      related_metric: 'delay_rate'
    }
  ];
}
