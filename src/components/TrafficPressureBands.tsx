import { CSSProperties, MouseEvent, useMemo, useState } from 'react';
import { TrafficDensitySummary } from '../types/data';
import TrafficDensityTooltip from './TrafficDensityTooltip';

interface TrafficPressureBandsProps {
  rows: TrafficDensitySummary[];
  selectedDensity?: string;
  selectedWeather: string;
  selectedTimePeriod: string;
  onSelect: (row: TrafficDensitySummary) => void;
}

const densityCopy: Record<TrafficDensitySummary['traffic_density'], string> = {
  Low: '低压力',
  Medium: '中压力',
  High: '高压力',
  Jam: '拥堵'
};

function normalizedRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return Math.min(1, value / 100);
  return Math.max(0, value);
}

function percent(value: number) {
  return `${Math.round(normalizedRate(value) * 100)}%`;
}

function number(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function bandColor(delayRate: number) {
  const rate = normalizedRate(delayRate);
  if (rate >= 0.55) return '#dc2626';
  if (rate >= 0.35) return '#f97316';
  if (rate >= 0.18) return '#d97706';
  return '#0f766e';
}

function pointCount(orderCount: number, maxOrders: number) {
  if (maxOrders <= 0) return 6;
  return Math.max(5, Math.min(18, Math.round(5 + (orderCount / maxOrders) * 13)));
}

export default function TrafficPressureBands({
  rows,
  selectedDensity,
  selectedWeather,
  selectedTimePeriod,
  onSelect
}: TrafficPressureBandsProps) {
  const [hovered, setHovered] = useState<TrafficDensitySummary | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const stats = useMemo(
    () => ({
      maxOrders: Math.max(1, ...rows.map((row) => row.order_count)),
      maxDuration: Math.max(1, ...rows.map((row) => row.avg_delivery_duration_min)),
      rushFocus: ['lunch_peak', 'dinner_peak', 'night'].includes(selectedTimePeriod)
    }),
    [rows, selectedTimePeriod]
  );

  const move = (row: TrafficDensitySummary, event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.closest('.traffic-bands-stage')?.getBoundingClientRect();
    setHovered(row);
    setPos({ x: rect ? event.clientX - rect.left : event.clientX, y: rect ? event.clientY - rect.top : event.clientY });
  };

  return (
    <div className="traffic-bands-stage" aria-label="Traffic Pressure Bands">
      <div className="traffic-bands-head">
        <div>
          <h3>Traffic Pressure Bands</h3>
          <p>条带长度表示订单量，颜色表示延迟率，厚度表示平均配送时长。</p>
        </div>
        <span>
          {selectedWeather === 'All' && selectedTimePeriod === 'All'
            ? '全局分层'
            : '筛选条件作为参考高亮'}
        </span>
      </div>

      <div className="traffic-band-grid">
        {rows.map((row) => {
          const selected = selectedDensity === row.traffic_density;
          const length = 28 + (row.order_count / stats.maxOrders) * 72;
          const height = 24 + (row.avg_delivery_duration_min / stats.maxDuration) * 32;
          const color = bandColor(row.delay_rate);
          const emphasizedByFilter =
            (selectedWeather !== 'All' && (row.traffic_density === 'High' || row.traffic_density === 'Jam')) ||
            (stats.rushFocus && row.traffic_density !== 'Low');
          const dots = Array.from({ length: pointCount(row.order_count, stats.maxOrders) });

          return (
            <button
              key={row.traffic_density}
              type="button"
              className={`traffic-band-row${selected ? ' is-selected' : ''}${emphasizedByFilter ? ' is-filter-emphasized' : ''}`}
              style={
                {
                  '--band-color': color,
                  '--band-length': `${length}%`,
                  '--band-height': `${height}px`,
                  '--delay-rate': normalizedRate(row.delay_rate),
                  '--band-fill': `${Math.max(28, length)}%`
                } as CSSProperties
              }
              onMouseMove={(event) => move(row, event)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(row)}
              aria-pressed={selected}
            >
              <span className="traffic-band-label">
                <strong>{row.traffic_density}</strong>
                <em>{densityCopy[row.traffic_density]}</em>
              </span>

              <span className="traffic-band-track">
                <span className="traffic-band-fill" style={{ width: 'var(--band-fill)' }}>
                  {dots.map((_, index) => (
                    <i key={index} style={{ left: `${((index + 1) / (dots.length + 1)) * 100}%` }} />
                  ))}
                </span>
              </span>

              <span className="traffic-band-metrics">
                <span>
                  <em>Orders</em>
                  <strong>{number(row.order_count)}</strong>
                </span>
                <span>
                  <em>Avg time</em>
                  <strong>{number(row.avg_delivery_duration_min, 1)}m</strong>
                </span>
                <span>
                  <em>Delay</em>
                  <strong>{percent(row.delay_rate)}</strong>
                </span>
                <span>
                  <em>Risk</em>
                  <strong>{number(row.risk_score, 2)}</strong>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="traffic-band-filter-note">
        当前天气：{selectedWeather}；当前时段：{selectedTimePeriod}。没有更细分数据时，条带使用全局交通密度汇总，筛选用于提示高压状态。
      </p>

      <TrafficDensityTooltip item={hovered} x={pos.x} y={pos.y} />
    </div>
  );
}
