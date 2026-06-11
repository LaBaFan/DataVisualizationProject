import SectionTitle from '../components/SectionTitle';
import { mapModules } from '../data/mapModules';
import { scenarioAnchors } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { MapModule, ScenarioAnchor } from '../types/data';

function anchorToModule(anchor: ScenarioAnchor): MapModule {
  return {
    id: anchor.id,
    type: 'risk_zone',
    label: anchor.label,
    shape: 'circle',
    coords: [anchor.x, anchor.y, anchor.radius],
    scenario_id: anchor.scenario_id,
    weather: anchor.weather,
    traffic_density: anchor.traffic_density,
    time_period: anchor.time_period,
    vehicle_type: anchor.vehicle_type,
    order_count: anchor.order_count,
    avg_delivery_duration_min: anchor.avg_delivery_duration_min,
    delay_rate: anchor.delay_rate,
    risk_score: anchor.risk_score
  };
}

export default function RiskScenarioSection() {
  const { selectedWeather, selectedTimePeriod, selectedScenarioId, setSelectedItem } = useInteraction();
  const rows = [...mapModules.filter((module) => module.risk_score), ...scenarioAnchors.map(anchorToModule)]
    .filter((module) => selectedWeather === 'All' || !module.weather || module.weather === selectedWeather)
    .filter((module) => selectedTimePeriod === 'All' || !module.time_period || module.time_period === selectedTimePeriod)
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
    .slice(0, 8);

  return (
    <section id="section-risk" data-section-id="risk" className="story-section risk-scenario-section">
      <SectionTitle eyebrow="Section 05" title="Risk Scenario Explain / 高风险场景解释">
        用排行形式表达多属性组合风险，先支持 LineUp 式排序，后续可升级为 Parallel Sets 流向图。
      </SectionTitle>
      <div className="story-panel scenario-ranking">
        {rows.map((row, index) => {
          const active = selectedScenarioId === row.scenario_id || selectedScenarioId === row.id;
          return (
            <button
              key={`${row.id}-${index}`}
              type="button"
              className={`scenario-row${active ? ' is-active' : ''}`}
              onClick={() => setSelectedItem({ type: 'module', item: row })}
            >
              <span className="scenario-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="scenario-copy">
                <strong>{row.label}</strong>
                <em>{[row.weather, row.traffic_density, row.time_period, row.vehicle_type].filter(Boolean).join(' · ')}</em>
              </span>
              <span className="scenario-score-track">
                <span style={{ width: `${Math.max(8, (row.risk_score ?? 0) * 100)}%` }} />
              </span>
              <span className="scenario-values">
                <strong>{(row.risk_score ?? 0).toFixed(2)}</strong>
                <em>{Math.round((row.delay_rate ?? 0) * 100)}% delay</em>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
