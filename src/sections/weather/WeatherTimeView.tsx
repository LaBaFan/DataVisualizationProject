import { useEffect, useState } from 'react';
import { getWeatherTimeRows } from '../../data/weatherSelectors';
import { DELAY_THRESHOLD_MIN, getWeatherInsight } from './weatherAnalytics';
import { fmt, pct, rowToMetric, timeLabel, type WeatherViewData } from './weatherViewUtils';
import type { SceneFilterSummary } from '../../types/data';

interface WeatherTimeViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

const W = 740;
const H = 340;
const PAD = { left: 58, right: 28, top: 34, bottom: 64 };

export default function WeatherTimeView({ selectedWeather, selectedTimePeriod, data }: WeatherTimeViewProps) {
  const [rows, setRows] = useState<SceneFilterSummary[]>([]);

  useEffect(() => {
    let mounted = true;
    getWeatherTimeRows(selectedWeather)
      .then((nextRows) => {
        if (mounted) setRows(nextRows);
      })
      .catch((error) => {
        console.warn('[WeatherTimeView] Failed to load weather time summary.', error);
        if (mounted) setRows([]);
      });

    return () => {
      mounted = false;
    };
  }, [selectedWeather]);

  const maxDuration = Math.max(DELAY_THRESHOLD_MIN + 8, ...rows.map((row) => row.avg_delivery_duration_min)) * 1.08;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const barGap = 20;
  const barW = rows.length ? (plotW - barGap * (rows.length - 1)) / rows.length : 0;
  const y = (value: number) => H - PAD.bottom - (value / maxDuration) * plotH;
  const slowestKey = rows.reduce((top, row) => row.avg_delivery_duration_min > (top?.avg_delivery_duration_min ?? -1) ? row : top, rows[0])?.time_period;

  return (
    <section className="weather-subview" aria-label="天气条件下的时段节奏">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">时段 / 03</span>
        <h2>时段平均配送时长</h2>
        <p>{getWeatherInsight('time', rows.map((row) => ({ ...rowToMetric(row), key: row.time_period ?? 'Unknown', label: timeLabel(row.time_period) })), selectedWeather)}</p>
      </div>

      <div className="weather-chart-card">
        {rows.length ? (
          <svg className="weather-svg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="时段平均配送时长柱状图">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const value = maxDuration * tick;
              return (
                <g key={tick}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y(value)} y2={y(value)} className="weather-grid-line" />
                  <text x={PAD.left - 10} y={y(value) + 4} textAnchor="end" className="weather-axis-tick">{fmt(value)}</text>
                </g>
              );
            })}
            <line x1={PAD.left} x2={W - PAD.right} y1={y(DELAY_THRESHOLD_MIN)} y2={y(DELAY_THRESHOLD_MIN)} className="weather-threshold-line" />
            <text x={W - PAD.right - 4} y={y(DELAY_THRESHOLD_MIN) - 6} textAnchor="end" className="weather-threshold-label">32 分钟延迟线</text>
            {rows.map((row, index) => {
              const x = PAD.left + index * (barW + barGap);
              const height = H - PAD.bottom - y(row.avg_delivery_duration_min);
              const active = selectedTimePeriod === row.time_period;
              const muted = selectedTimePeriod !== 'All' && !active;
              const highest = row.time_period === slowestKey;
              const fill = row.avg_delivery_duration_min > DELAY_THRESHOLD_MIN ? '#dc2626' : row.delay_rate >= 0.3 ? '#f97316' : '#2563eb';
              return (
                <g key={row.time_period ?? index} className={`${muted ? 'is-muted' : ''}${highest ? ' is-highlight' : ''}`} style={{ opacity: muted ? 0.32 : 1 }}>
                  <rect
                    x={x}
                    y={y(row.avg_delivery_duration_min)}
                    width={barW}
                    height={height}
                    rx={6}
                    fill={fill}
                    className="weather-duration-bar"
                  >
                    <title>{`${timeLabel(row.time_period)}：平均 ${fmt(row.avg_delivery_duration_min, 1)} 分钟，延迟率 ${pct(row.delay_rate)}，订单 ${row.order_count} 单`}</title>
                  </rect>
                  <text x={x + barW / 2} y={y(row.avg_delivery_duration_min) - 8} textAnchor="middle" className="weather-bar-value">
                    {fmt(row.avg_delivery_duration_min, 1)}
                  </text>
                  <text x={x + barW / 2} y={H - 34} textAnchor="middle" className="weather-axis-label">{timeLabel(row.time_period)}</text>
                  <text x={x + barW / 2} y={H - 18} textAnchor="middle" className="weather-axis-tick">{fmt(row.order_count)} 单</text>
                </g>
              );
            })}
            <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} className="weather-axis-line" />
            <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="weather-axis-line" />
            <text x={16} y={H / 2} textAnchor="middle" className="weather-axis-label" transform={`rotate(-90 16 ${H / 2})`}>平均配送时长（分钟）</text>
          </svg>
        ) : <p className="detail-empty">暂无当前天气的时段节奏数据</p>}
        <div className="weather-chart-legend">
          <em>数据源：scene_filter_summary.json；范围：天气与时段汇总</em>
        </div>
      </div>
    </section>
  );
}
