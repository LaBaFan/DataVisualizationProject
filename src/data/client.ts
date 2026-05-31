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

const processedModules = import.meta.glob('../../data/processed/*.json', { eager: true });

function staticJson<T>(fileName: string, fallback: T): T {
  const key = `../../data/processed/${fileName}`;
  const moduleValue = processedModules[key] as { default?: T } | undefined;
  return moduleValue?.default ?? fallback;
}

export async function getHealth(): Promise<{ status: string; source: string }> {
  return { status: 'ok', source: 'static-processed-json' };
}

export function getOverview(): Promise<OverviewSummary | null> {
  return Promise.resolve(staticJson<OverviewSummary | null>('overview_summary.json', null));
}

export function getDeliveryTimeDistribution(): Promise<DeliveryTimeDistribution | null> {
  return Promise.resolve(staticJson<DeliveryTimeDistribution | null>('delivery_time_distribution.json', null));
}

export function getDistanceTimeSample(): Promise<DistanceTimePoint[]> {
  return Promise.resolve(staticJson<DistanceTimePoint[]>('distance_time_sample.json', []));
}

export function getHourSummary(): Promise<HourSummary[]> {
  return Promise.resolve(staticJson<HourSummary[]>('hour_summary.json', []));
}

export function getTimePeriodSummary(): Promise<TimePeriodSummary[]> {
  return Promise.resolve(staticJson<TimePeriodSummary[]>('time_period_summary.json', []));
}

export function getWeatherTrafficSummary(): Promise<WeatherTrafficSummary[]> {
  return Promise.resolve(staticJson<WeatherTrafficSummary[]>('weather_traffic_summary.json', []));
}

export function getCourierVehicleSummary(): Promise<CourierVehicleSummary | null> {
  return Promise.resolve(staticJson<CourierVehicleSummary | null>('courier_vehicle_summary.json', null));
}

export function getCitySummary(): Promise<CitySummary[]> {
  return Promise.resolve(staticJson<CitySummary[]>('city_summary.json', []));
}

export async function getRiskScenarioSummary(): Promise<RiskScenarioSummary[]> {
  const data = staticJson<RiskScenarioSummary[] | null>('risk_scenario_summary.json', null);
  if (data) return data;
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
  const data = staticJson<DelayFactorFlow[] | null>('delay_factor_flow.json', null);
  if (data) return data;
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
  const data = staticJson<TimeAnnotation[] | null>('time_annotations.json', null);
  if (data) return data;
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
