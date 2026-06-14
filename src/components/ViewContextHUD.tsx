import { ViewContextMetrics } from '../types/data';

interface ViewContextHUDProps {
  metrics: ViewContextMetrics;
}

function label(value: string, fallback: string) {
  return value === 'All' ? fallback : value;
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
      <span>{label(metrics.weather, '全部天气')}</span>
      <span>{label(metrics.time_period, '全部时段')}</span>
      <span>样本 {metrics.order_count}</span>
      <span>Avg {minutes(metrics.avg_delivery_duration_min)}</span>
      <span>阈值 {minutes(metrics.delay_threshold_min)}</span>
      <strong>Delay {percent(metrics.delay_rate)}</strong>
    </aside>
  );
}
