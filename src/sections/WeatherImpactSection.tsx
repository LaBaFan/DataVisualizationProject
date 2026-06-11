import SectionTitle from '../components/SectionTitle';
import { mapModules } from '../data/mapModules';
import { miniMetricTags, scenarioAnchors } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';

const fallbackWeather = ['Sunny', 'Fog', 'Cloudy', 'Rainy', 'Stormy', 'Sandstorms', 'Windy', 'Unknown'];

function weatherRows() {
  return fallbackWeather.map((weather) => {
    const source = [...mapModules, ...scenarioAnchors, ...miniMetricTags].filter((item) => item.weather === weather);
    const count = source.reduce((sum, item) => sum + (item.order_count ?? 0), 0) || 220 + weather.length * 80;
    const duration = source.length ? source.reduce((sum, item) => sum + (item.avg_delivery_duration_min ?? 0), 0) / source.length : 28 + weather.length * 1.4;
    const delay = source.length ? source.reduce((sum, item) => sum + (item.delay_rate ?? 0), 0) / source.length : 0.18 + weather.length * 0.035;
    const risk = source.length ? Math.max(...source.map((item) => item.risk_score ?? 0)) : Math.min(0.86, delay + 0.18);
    return { weather, count, duration, delay, risk };
  }).sort((a, b) => b.delay - a.delay);
}

export default function WeatherImpactSection() {
  const { selectedWeather, setSelectedWeather } = useInteraction();
  const rows = weatherRows();

  return (
    <section id="section-weather" data-section-id="weather" className="story-section weather-impact-section">
      <SectionTitle eyebrow="Section 02" title="Weather Impact / 天气影响分析">
        横向排行直接回答不同天气下配送是否变慢，条长表示延迟率，数字显示平均配送时长。
      </SectionTitle>
      <div className="story-panel weather-ranking">
        {rows.map((row) => {
          const active = selectedWeather === row.weather;
          return (
            <button
              key={row.weather}
              type="button"
              className={`ranking-row${active ? ' is-active' : ''}${selectedWeather !== 'All' && !active ? ' is-muted' : ''}`}
              onClick={() => setSelectedWeather(row.weather)}
            >
              <span className="ranking-name">{row.weather}</span>
              <span className="ranking-track">
                <span style={{ width: `${Math.max(8, row.delay * 100)}%` }} />
              </span>
              <strong>{Math.round(row.delay * 100)}%</strong>
              <em>{row.duration.toFixed(1)} min</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}
