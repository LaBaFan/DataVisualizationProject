import { TrafficDensitySummary } from '../types/data';

interface TrafficDensityTooltipProps {
  item: TrafficDensitySummary | null;
  x: number;
  y: number;
}

function number(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function percent(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

function trafficLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    Low: '低密度',
    Medium: '中密度',
    High: '高密度',
    Jam: '拥堵'
  };
  return labels[value ?? ''] ?? value ?? '-';
}

export default function TrafficDensityTooltip({ item, x, y }: TrafficDensityTooltipProps) {
  if (!item) return null;

  return (
    <div className="traffic-density-tooltip" style={{ left: x + 14, top: y + 14 }}>
      <strong>{trafficLabel(item.traffic_density)}</strong>
      <span>交通压力分层</span>
      <dl>
        <div>
          <dt>订单数</dt>
          <dd>{number(item.order_count)}</dd>
        </div>
        <div>
          <dt>平均配送时长</dt>
          <dd>{number(item.avg_delivery_duration_min, 1)} 分钟</dd>
        </div>
        <div>
          <dt>延迟率</dt>
          <dd>{percent(item.delay_rate)}</dd>
        </div>
        <div>
          <dt>平均距离</dt>
          <dd>{number(item.avg_distance_km, 1)} 公里</dd>
        </div>
      </dl>
    </div>
  );
}
