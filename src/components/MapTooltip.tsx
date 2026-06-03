import { MapSelection } from '../types/data';

interface MapTooltipProps {
  selection: MapSelection | null;
  x: number;
  y: number;
}

function formatNumber(value: number | undefined, digits = 0) {
  return typeof value === 'number' ? value.toFixed(digits) : '';
}

function formatPercent(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '';
}

function typeLabel(selection: MapSelection) {
  if (selection.type === 'traffic_segment') return '交通压力流量条';
  if (selection.type === 'order_dot') return '订单密度点';
  if (selection.type === 'risk_pulse') return '延迟风险脉冲圈';
  if (selection.type === 'metric_tag') return '区域微型指标';

  const labels: Record<typeof selection.item.type, string> = {
    restaurant: '餐厅',
    building: '建筑',
    road: '道路',
    weather: '天气区域',
    risk_zone: '风险区域',
    customer_area: '客户区域',
    order_point: '订单点',
    rider: '骑手'
  };
  return labels[selection.item.type];
}

function tooltipMetrics(selection: MapSelection): Array<[string, string]> {
  const item = selection.item;
  const metrics: Array<[string, string]> = [];

  if ('order_count' in item && item.order_count) metrics.push(['订单数', formatNumber(item.order_count)]);
  if ('avg_delivery_duration_min' in item && item.avg_delivery_duration_min) {
    metrics.push(['平均时长', `${formatNumber(item.avg_delivery_duration_min, 1)} min`]);
  }
  if ('delivery_duration_min' in item && item.delivery_duration_min) {
    metrics.push(['配送时长', `${formatNumber(item.delivery_duration_min, 1)} min`]);
  }
  if ('delay_rate' in item && typeof item.delay_rate === 'number') metrics.push(['延迟率', formatPercent(item.delay_rate)]);
  if ('risk_score' in item && item.risk_score) metrics.push(['风险评分', formatNumber(item.risk_score, 2)]);
  if ('distance_km' in item && item.distance_km) metrics.push(['距离', `${formatNumber(item.distance_km, 1)} km`]);

  return metrics;
}

function title(selection: MapSelection) {
  const item = selection.item;
  if ('label' in item) return item.label;
  return item.order_id ?? item.id;
}

export default function MapTooltip({ selection, x, y }: MapTooltipProps) {
  if (!selection) return null;

  const metrics = tooltipMetrics(selection);

  return (
    <div className="map-tooltip" style={{ left: x + 14, top: y + 14 }}>
      <strong>{title(selection)}</strong>
      <span>{typeLabel(selection)}</span>
      {metrics.length ? (
        <dl>
          {metrics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
