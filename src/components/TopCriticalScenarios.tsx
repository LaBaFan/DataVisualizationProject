import { RiskScenario } from '../types/data';

interface TopCriticalScenariosProps {
  scenarios: Array<RiskScenario & { highlighted: boolean }>;
  selectedScenarioId: string | null;
  onSelectScenario: (scenario: RiskScenario) => void;
}

function formatNumber(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function formatPercent(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

export default function TopCriticalScenarios({ scenarios, selectedScenarioId, onSelectScenario }: TopCriticalScenariosProps) {
  return (
    <div className="top-critical-scenarios" aria-label="Top 5 critical risk scenarios">
      <div className="top-critical-head">
        <span>Top 5 关键场景</span>
        <span>只保留最需要调度介入的组合</span>
      </div>
      <div className="top-critical-list">
        {scenarios.slice(0, 5).map((scenario, index) => (
          <button
            key={scenario.scenario_id}
            type="button"
            className={`top-critical-row${selectedScenarioId === scenario.scenario_id ? ' is-active' : ''}${scenario.highlighted ? '' : ' is-muted'}`}
            onClick={() => onSelectScenario(scenario)}
          >
            <span className="top-critical-rank">{index + 1}</span>
            <span className="top-critical-copy">
              <strong>{scenario.label}</strong>
              <em>{[scenario.weather, scenario.traffic_density, scenario.time_period, scenario.vehicle_type].filter(Boolean).join(' · ')}</em>
            </span>
            <span>{formatNumber(scenario.risk_score, 3)}</span>
            <span>{formatPercent(scenario.delay_rate)}</span>
            <span>{formatNumber(scenario.avg_delivery_duration_min, 1)}m</span>
            <span>{scenario.order_count.toLocaleString()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
