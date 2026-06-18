import type { WeatherComparisonMetric, WeatherComparisonRow } from '../../types/data';
import { highestMetricValue } from '../../data/weatherComparisonSelectors';

interface WeatherComparisonListProps {
  rows: WeatherComparisonRow[];
  metric: WeatherComparisonMetric;
  activeWeather: string | null;
  onPreview: (row: WeatherComparisonRow | null) => void;
  onSelect: (row: WeatherComparisonRow) => void;
}

const metricLabels: Record<WeatherComparisonMetric, string> = {
  delay_rate: '延迟率',
  avg_delivery_duration_min: '平均时长',
  order_count: '订单量'
};

const weatherCn: Record<string, string> = {
  Sunny: '晴天',
  Fog: '雾天',
  Cloudy: '多云',
  Stormy: '雷暴',
  Sandstorms: '沙尘',
  Windy: '大风'
};

function formatValue(metric: WeatherComparisonMetric, value: number | null) {
  if (value === null) return '无数据';
  if (metric === 'delay_rate') return `${Math.round(value * 100)}%`;
  if (metric === 'avg_delivery_duration_min') return `${value.toFixed(1)} 分钟`;
  return value.toLocaleString();
}

function formatSubMetric(metric: WeatherComparisonMetric, row: WeatherComparisonRow) {
  if (metric === 'delay_rate') return `延迟率 ${formatValue('delay_rate', row.delay_rate)}`;
  if (metric === 'avg_delivery_duration_min') return `平均时长 ${formatValue('avg_delivery_duration_min', row.avg_delivery_duration_min)}`;
  return `订单量 ${formatValue('order_count', row.order_count)}`;
}

export default function WeatherComparisonList({
  rows,
  metric,
  activeWeather,
  onPreview,
  onSelect
}: WeatherComparisonListProps) {
  const maxValue = highestMetricValue(rows, metric);

  return (
    <ol className="weather-comparison-list" aria-label="天气横向对比排行">
      {rows.map((row, index) => {
        const value = row[metric];
        const ratio = value !== null && value > 0 && maxValue && maxValue > 0 ? Math.max(0.04, value / maxValue) : 0;
        const isHighest = index === 0 && value !== null;
        const isActive = activeWeather === row.weather;

        return (
          <li key={row.weather}>
            <button
              type="button"
              className={`weather-comparison-row${isActive ? ' is-active' : ''}`}
              onMouseEnter={() => onPreview(row)}
              onFocus={() => onPreview(row)}
              onMouseLeave={() => onPreview(null)}
              onBlur={() => onPreview(null)}
              onClick={() => onSelect(row)}
            >
              <span className="weather-rank-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="weather-row-copy">
                <strong>{weatherCn[row.weather]}</strong>
                <small>{weatherCn[row.weather]} · {row.description}</small>
              </span>
              <span className="weather-row-bar" aria-hidden="true">
                <i style={{ transform: `scaleX(${ratio})` }} />
              </span>
              <span className="weather-row-metric">
                <b>{metricLabels[metric]}</b>
                <em>{formatSubMetric(metric, row)}</em>
              </span>
              <span className={`weather-row-badge${isHighest ? '' : ' is-placeholder'}`}>{isHighest ? '当前最高' : '占位'}</span>
              <span className="weather-row-arrow" aria-hidden="true">→</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
