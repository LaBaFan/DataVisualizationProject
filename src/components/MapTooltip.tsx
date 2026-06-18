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

const WEATHER_LABELS: Record<string, string> = {
  Sunny: '晴天',
  Cloudy: '多云',
  Fog: '雾天',
  Windy: '大风',
  Stormy: '暴雨',
  Sandstorms: '沙尘'
};

const TRAFFIC_LABELS: Record<string, string> = {
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵',
  Unknown: '未知交通'
};

const TIME_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间'
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: '摩托车',
  scooter: '踏板车',
  electric_scooter: '电动车'
};

function tooltipMetrics(selection: MapSelection): Array<[string, string]> {
  const item = selection.item;
  const metrics: Array<[string, string]> = [];

  if ('weather' in item && item.weather) metrics.push(['天气', WEATHER_LABELS[item.weather] ?? item.weather]);
  if ('order_id' in item && item.order_id) metrics.push(['订单', item.order_id]);
  if ('traffic_density' in item && item.traffic_density) metrics.push(['交通密度', TRAFFIC_LABELS[item.traffic_density] ?? item.traffic_density]);
  if ('time_period' in item && item.time_period) metrics.push(['时段', TIME_LABELS[item.time_period] ?? item.time_period]);
  if ('vehicle_type' in item && item.vehicle_type) metrics.push(['载具', VEHICLE_LABELS[item.vehicle_type] ?? item.vehicle_type]);
  if ('order_count' in item && item.order_count) metrics.push(['订单量', formatNumber(item.order_count)]);
  if ('avg_delivery_duration_min' in item && item.avg_delivery_duration_min) {
    metrics.push(['平均配送时长', `${formatNumber(item.avg_delivery_duration_min, 1)} 分钟`]);
  }
  if ('delivery_duration_min' in item && item.delivery_duration_min) {
    metrics.push(['配送时长', `${formatNumber(item.delivery_duration_min, 1)} 分钟`]);
  }
  if ('delay_rate' in item && typeof item.delay_rate === 'number') metrics.push(['延迟率', formatPercent(item.delay_rate)]);
  if ('avg_distance_km' in item && item.avg_distance_km) metrics.push(['平均距离', `${formatNumber(item.avg_distance_km, 1)} 公里`]);
  if ('distance_km' in item && item.distance_km) {
    metrics.push(['配送距离', `${formatNumber(item.distance_km, 1)} 公里`]);
  }
  if ('is_delayed' in item && typeof item.is_delayed === 'boolean') metrics.push(['延迟状态', item.is_delayed ? '已延迟' : '正常']);

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
