import {
  aggregateWeatherOverview,
  getWeatherInsight,
  DELAY_THRESHOLD_MIN
} from './weatherAnalytics';
import { barWidth, fmt, pct, weatherLabel, type WeatherViewData } from './weatherViewUtils';

interface WeatherOverviewViewProps {
  selectedWeather: string;
  data: WeatherViewData;
}

function deltaText(value: number, unit: string, reverse = false) {
  const up = reverse ? value < 0 : value >= 0;
  return `${up ? '高于' : '低于'}全局 ${fmt(Math.abs(value), unit === '%' ? 0 : 1)}${unit}`;
}

export default function WeatherOverviewView({ selectedWeather, data }: WeatherOverviewViewProps) {
  const overview = aggregateWeatherOverview(data.orders, selectedWeather);
  const { current, baseline } = overview;
  const maxDuration = Math.max(1, current.avg_delivery_duration_min ?? 0, baseline.avg_delivery_duration_min ?? 0);
  const maxDistance = Math.max(1, current.avg_distance_km ?? 0, baseline.avg_distance_km ?? 0);
  const durationDelta = (current.avg_delivery_duration_min ?? 0) - (baseline.avg_delivery_duration_min ?? 0);
  const delayDelta = (current.delay_rate ?? 0) - (baseline.delay_rate ?? 0);
  const distanceDelta = (current.avg_distance_km ?? 0) - (baseline.avg_distance_km ?? 0);
  const sampleWarning = (current.order_count ?? 0) < 50;

  return (
    <section className="weather-subview weather-overview-view" aria-label="天气概览">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">概览 / 01</span>
        <h2>{weatherLabel(selectedWeather)} ETA 表现</h2>
        <p>{getWeatherInsight('overview', overview, selectedWeather)}</p>
      </div>

      <div className="weather-chart-card">
        <div className="weather-kpi-rail">
          <div>
            <span>天气订单</span>
            <strong>{fmt(current.order_count)}</strong>
            <em>n / 全量订单</em>
          </div>
          <div>
            <span>平均配送时长</span>
            <strong>{fmt(current.avg_delivery_duration_min, 1)} 分钟</strong>
            <em>{deltaText(durationDelta, ' 分钟')}</em>
          </div>
          <div>
            <span>延迟率</span>
            <strong>{pct(current.delay_rate)}</strong>
            <em>{deltaText(delayDelta * 100, '%')}</em>
          </div>
          <div>
            <span>平均配送距离</span>
            <strong>{fmt(current.avg_distance_km, 1)} 公里</strong>
            <em>{deltaText(distanceDelta, ' 公里')}</em>
          </div>
        </div>

        <div className="weather-baseline-compare" aria-label="当前天气与全局基线对比">
          <div className="compare-row">
            <span>{weatherLabel(selectedWeather)}</span>
            <i style={{ width: barWidth(current.avg_delivery_duration_min, maxDuration) }} />
            <strong>{fmt(current.avg_delivery_duration_min, 1)} 分钟</strong>
          </div>
          <div className="compare-row is-baseline">
            <span>全局基线</span>
            <i style={{ width: barWidth(baseline.avg_delivery_duration_min, maxDuration) }} />
            <strong>{fmt(baseline.avg_delivery_duration_min, 1)} 分钟</strong>
          </div>
          <div className="compare-row">
            <span>当前距离</span>
            <i className="is-risk" style={{ width: barWidth(current.avg_distance_km, maxDistance) }} />
            <strong>{fmt(current.avg_distance_km, 1)} 公里</strong>
          </div>
          <div className="compare-row is-baseline">
            <span>基线距离</span>
            <i style={{ width: barWidth(baseline.avg_distance_km, maxDistance) }} />
            <strong>{fmt(baseline.avg_distance_km, 1)} 公里</strong>
          </div>
        </div>

        <div className="weather-chart-insight">
          <strong>统一阈值</strong>
          <span>延迟定义为配送时长 &gt; {DELAY_THRESHOLD_MIN} 分钟，延迟率仅展示时转百分比。</span>
          {sampleWarning ? <b>当前天气样本少于 50 单，结论需谨慎。</b> : null}
        </div>
      </div>
    </section>
  );
}
