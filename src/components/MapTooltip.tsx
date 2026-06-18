import { useEffect, useRef, useState } from 'react';
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
  if ('order_id' in item && item.order_id) metrics.push(['order_id', item.order_id]);
  if ('traffic_density' in item && item.traffic_density) metrics.push(['traffic_density', item.traffic_density]);
  if ('time_period' in item && item.time_period) metrics.push(['time_period', item.time_period]);
  if ('vehicle_type' in item && item.vehicle_type) metrics.push(['vehicle_type', item.vehicle_type]);
  if ('order_count' in item && item.order_count) metrics.push(['order_count', formatNumber(item.order_count)]);
  if ('avg_delivery_duration_min' in item && item.avg_delivery_duration_min) {
    metrics.push(['avg_delivery_duration_min', `${formatNumber(item.avg_delivery_duration_min, 1)} min`]);
  }
  if ('delivery_duration_min' in item && item.delivery_duration_min) {
    metrics.push(['delivery_duration_min', `${formatNumber(item.delivery_duration_min, 1)} min`]);
  }
  if ('delay_rate' in item && typeof item.delay_rate === 'number') metrics.push(['delay_rate', formatPercent(item.delay_rate)]);
  if ('risk_score' in item && item.risk_score) metrics.push(['risk_score', formatNumber(item.risk_score, 2)]);
  if ('avg_distance_km' in item && item.avg_distance_km) metrics.push(['avg_distance_km', `${formatNumber(item.avg_distance_km, 1)} km`]);
  if ('distance_km' in item && item.distance_km) {
    metrics.push(['distance_km', `${formatNumber(item.distance_km, 1)} km`]);
  }
  if ('is_delayed' in item && typeof item.is_delayed === 'boolean') metrics.push(['is_delayed', item.is_delayed ? 'true' : 'false']);

  return metrics;
}

function title(selection: MapSelection) {
  const item = selection.item;
  if ('label' in item) return item.label;
  return item.order_id ?? item.id;
}

export default function MapTooltip({ selection, x, y }: MapTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 14, top: y + 14 });

  useEffect(() => {
    if (!selection || !ref.current) return;

    const el = ref.current;
    const parent = el.closest('.interactive-scene-map, .module-map-card, .overall-module-map') as HTMLElement | null;
    if (!parent) {
      setPos({ left: x + 14, top: y + 14 });
      return;
    }

    const rect = parent.getBoundingClientRect();
    const tipW = el.offsetWidth || 220;
    const tipH = el.offsetHeight || 160;

    let left = x + 14;
    let top = y + 14;

    // Flip horizontally if overflowing right edge
    if (left + tipW > rect.width - 8) {
      left = x - tipW - 14;
    }
    // Flip vertically if overflowing bottom edge
    if (top + tipH > rect.height - 8) {
      top = y - tipH - 14;
    }
    // Clamp to not go negative
    left = Math.max(4, left);
    top = Math.max(4, top);

    setPos({ left, top });
  }, [x, y, selection]);

  if (!selection) return null;

  const metrics = tooltipMetrics(selection);

  return (
    <div
      ref={ref}
      className="map-tooltip"
      style={{ left: pos.left, top: pos.top }}
    >
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
