import { getModuleIdByWeather, getWeatherModuleById } from '../../data/weatherModules';
import { barWidth, fmt, pct, weatherLabel, type WeatherViewData } from './weatherViewUtils';

interface WeatherOverviewViewProps {
  selectedWeather: string;
  data: WeatherViewData;
}

export default function WeatherOverviewView({ selectedWeather, data }: WeatherOverviewViewProps) {
  const module = getWeatherModuleById(selectedWeather === 'All' ? 'overall' : getModuleIdByWeather(selectedWeather));
  const current = data.weatherImpact.find((row) => row.weather === selectedWeather);
  const baseline = data.overview;
  const maxDuration = Math.max(
    1,
    current?.avg_delivery_duration_min ?? 0,
    baseline?.avg_delivery_duration_min ?? 0
  );
  const durationDelta = current && baseline?.avg_delivery_duration_min
    ? current.avg_delivery_duration_min - baseline.avg_delivery_duration_min
    : null;
  const delayDelta = current && baseline?.delay_rate !== undefined
    ? current.delay_rate - baseline.delay_rate
    : null;

  return (
    <section className="weather-subview weather-overview-view" aria-label="天气概览">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">概览 / 01</span>
        <h2>{weatherLabel(selectedWeather)} ETA 表现</h2>
        <p>
          以全局基线作为参照，先判断当前天气是否整体推高配送时长和延迟暴露，再进入后续章节拆解交通、时段和订单样本。
        </p>
      </div>

      <div className="weather-chapter-band">
        <div className="weather-kpi-rail">
          <div>
            <span>天气订单</span>
            <strong>{fmt(current?.order_count)}</strong>
          </div>
          <div>
            <span>平均 ETA</span>
            <strong>{fmt(current?.avg_delivery_duration_min, 1)} 分钟</strong>
          </div>
          <div>
            <span>延迟率</span>
            <strong>{pct(current?.delay_rate)}</strong>
          </div>
          <div>
            <span>风险评分</span>
            <strong>{fmt(current?.risk_score, 2)}</strong>
          </div>
        </div>

        <div className="weather-baseline-compare">
          <div className="compare-row">
            <span>{weatherLabel(selectedWeather)}</span>
            <i style={{ width: barWidth(current?.avg_delivery_duration_min, maxDuration) }} />
            <strong>{fmt(current?.avg_delivery_duration_min, 1)} 分钟</strong>
          </div>
          <div className="compare-row is-baseline">
            <span>全局基线</span>
            <i style={{ width: barWidth(baseline?.avg_delivery_duration_min, maxDuration) }} />
            <strong>{fmt(baseline?.avg_delivery_duration_min, 1)} 分钟</strong>
          </div>
        </div>

        <div className="weather-analysis-note">
          <strong>对比结论</strong>
          <p>
            ETA {durationDelta === null ? '暂无足够样本对比' : `${durationDelta >= 0 ? '高于' : '低于'}全局 ${fmt(Math.abs(durationDelta), 1)} 分钟`}；
            延迟率 {delayDelta === null ? '暂无足够样本对比' : `${delayDelta >= 0 ? '高于' : '低于'}全局 ${pct(Math.abs(delayDelta))}`}。
            {module.riskHint ? ` ${module.riskHint}` : ''}
          </p>
        </div>
      </div>
    </section>
  );
}
