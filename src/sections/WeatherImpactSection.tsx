import { useEffect, useMemo, useState } from 'react';
import { loadWeatherImpactSummary } from '../api/staticDataClient';
import SectionTitle from '../components/SectionTitle';
import { useInteraction } from '../store/interactionContext';
import { WeatherImpactSummary } from '../types/data';

const allowedWeather = new Set(['Sunny', 'Fog', 'Cloudy', 'Stormy', 'Sandstorms', 'Windy']);

function pct(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
}

export default function WeatherImpactSection() {
  const { selectedWeather, setSelectedWeather } = useInteraction();
  const [rows, setRows] = useState<WeatherImpactSummary[]>([]);

  useEffect(() => {
    loadWeatherImpactSummary().then((data) => {
      setRows(data.filter((row) => row.weather && allowedWeather.has(row.weather)));
    });
  }, []);

  const rankedRows = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => (b.risk_score ?? b.delay_rate ?? 0) - (a.risk_score ?? a.delay_rate ?? 0)),
    [rows]
  );

  const maxOrders = Math.max(...rankedRows.map((row) => row.order_count), 1);

  return (
    <section id="section-weather" data-section-id="weather" className="story-section weather-impact-section">
      <SectionTitle eyebrow="Section 02" title="Weather Risk Ranking / 天气影响">
        哪些天气会让 ETA 变慢？按延迟率与平均配送时长排序，辅助查看订单量和配送效率。
      </SectionTitle>
      <div className="story-panel weather-ranking" aria-label="Weather Risk Ranking">
        {rankedRows.map((row, index) => {
          const weather = row.weather ?? 'Unknown';
          const active = selectedWeather === weather;
          const risk = row.risk_score ?? row.delay_rate ?? 0;
          return (
            <button
              key={weather}
              type="button"
              className={`ranking-row weather-risk-row${active ? ' is-active' : ''}${selectedWeather !== 'All' && !active ? ' is-muted' : ''}`}
              onClick={() => setSelectedWeather(weather)}
              title={`选择 ${weather} 天气筛选所有视图`}
            >
              <span className="ranking-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="ranking-name">{weather}</span>
              <span className="ranking-track">
                <span style={{ width: `${Math.max(8, risk * 100)}%` }} />
              </span>
              <span className="ranking-order-bar" style={{ width: `${Math.max(18, (row.order_count / maxOrders) * 100)}%` }} />
              <strong>{risk.toFixed(2)}</strong>
              <em>
                {row.order_count.toLocaleString()} orders · {row.avg_delivery_duration_min.toFixed(1)} min · {pct(row.delay_rate)} delay
              </em>
            </button>
          );
        })}
      </div>
    </section>
  );
}
