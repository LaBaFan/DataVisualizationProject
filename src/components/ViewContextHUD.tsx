import { ViewContextMetrics } from '../types/data';

interface ViewContextHUDProps {
  metrics: ViewContextMetrics;
}

const TIME_LABELS: Record<string, string> = {
  All: '全部时段',
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间'
};

const WEATHER_LABELS: Record<string, string> = {
  All: '全部天气',
  Sunny: '晴天',
  Cloudy: '多云',
  Fog: '雾天',
  Stormy: '暴雨',
  Sandstorms: '沙尘',
  Windy: '大风'
};

function label(map: Record<string, string>, value: string, fallback: string) {
  return map[value] ?? fallback;
}

function minutes(value: number) {
  return `${Math.round(value)}m`;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function ViewContextHUD({ metrics }: ViewContextHUDProps) {
  return (
    <aside className="view-context-hud" aria-label="当前地图视图状态">
      <span>{label(WEATHER_LABELS, metrics.weather, metrics.weather)}</span>
      <span>{label(TIME_LABELS, metrics.time_period, metrics.time_period)}</span>
      <span>样本 {metrics.order_count.toLocaleString()}</span>
      <span>Avg {minutes(metrics.avg_delivery_duration_min)}</span>
      <strong>Delay {percent(metrics.delay_rate)}</strong>
    </aside>
  );
}
