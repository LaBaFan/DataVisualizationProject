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

function tooltipMetrics(selection: MapSelection): Array<[string, string]> {
  const item = selection.item;
  const metrics: Array<[string, string]> = [];

  if ('weather' in item && item.weather) metrics.push(['weather', item.weather]);
  if ('traffic_density' in item && item.traffic_density) metrics.push(['traffic_density', item.traffic_density]);
  if ('time_period' in item && item.time_period) metrics.push(['time_period', item.time_period]);
  if ('vehicle_type' in item && item.vehicle_type) metrics.push(['vehicle_type', item.vehicle_type]);
  if ('order_count' in item && item.order_count) metrics.push(['order_count', formatNumber(item.order_count)]);
  if ('avg_delivery_duration_min' in item && item.avg_delivery_duration_min) {
    metrics.push(['avg_delivery_duration_min', `${formatNumber(item.avg_delivery_duration_min, 1)} min`]);
  }
  if ('delivery_duration_min' in item && item.delivery_duration_min && !('avg_delivery_duration_min' in item)) {
    metrics.push(['avg_delivery_duration_min', `${formatNumber(item.delivery_duration_min, 1)} min`]);
  }
  if ('delay_rate' in item && typeof item.delay_rate === 'number') metrics.push(['delay_rate', formatPercent(item.delay_rate)]);
  if ('risk_score' in item && item.risk_score) metrics.push(['risk_score', formatNumber(item.risk_score, 2)]);
  if ('avg_distance_km' in item && item.avg_distance_km) metrics.push(['avg_distance_km', `${formatNumber(item.avg_distance_km, 1)} km`]);
  if ('distance_km' in item && item.distance_km && !('avg_distance_km' in item)) {
    metrics.push(['avg_distance_km', `${formatNumber(item.distance_km, 1)} km`]);
  }

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
