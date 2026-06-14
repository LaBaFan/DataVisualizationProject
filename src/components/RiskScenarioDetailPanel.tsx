import { RiskScenario } from '../types/data';

interface RiskScenarioDetailPanelProps {
  scenario: RiskScenario | null;
  fallbackScenario: RiskScenario | null;
  selected: boolean;
}

function formatNumber(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function formatPercent(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

function labelOf(value: string | null | undefined) {
  return value && value.trim() ? value : '未知';
}

function riskTone(score: number) {
  if (score >= 0.86) return '极高';
  if (score >= 0.72) return '高';
  if (score >= 0.55) return '中高';
  return '可控';
}

export default function RiskScenarioDetailPanel({ scenario, fallbackScenario, selected }: RiskScenarioDetailPanelProps) {
  const activeScenario = scenario ?? fallbackScenario;

  if (!activeScenario) {
    return (
      <aside className="risk-detail-panel">
        <span className="risk-detail-eyebrow">Scenario Explanation</span>
        <h3>暂无可解释场景</h3>
        <p>等待风险场景数据加载后展示最高风险组合。</p>
      </aside>
    );
  }

  const conditions = [
    ['天气', labelOf(activeScenario.weather)],
    ['交通', labelOf(activeScenario.traffic_density)],
    ['时段', labelOf(activeScenario.time_period)],
    ['车辆', labelOf(activeScenario.vehicle_type)]
  ];

  return (
    <aside className={`risk-detail-panel${selected ? ' is-selected' : ''}`}>
      <span className="risk-detail-eyebrow">{selected ? 'Selected Scenario' : 'Highest Risk Scenario'}</span>
      <h3>{activeScenario.label}</h3>
      <p>
        {conditions.map(([, value]) => value).join('、')} 同时出现时，平均配送时长达到{' '}
        <strong>{formatNumber(activeScenario.avg_delivery_duration_min, 1)} 分钟</strong>，延迟率为{' '}
        <strong>{formatPercent(activeScenario.delay_rate)}</strong>。该组合风险处于
        <strong>{riskTone(activeScenario.risk_score)}</strong> 水平，建议优先关注调度缓冲和骑手路线冗余。
      </p>

      <div className="risk-condition-grid">
        {conditions.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="risk-detail-metrics">
        <div>
          <span>订单数</span>
          <strong>{activeScenario.order_count.toLocaleString()}</strong>
        </div>
        <div>
          <span>平均配送时长</span>
          <strong>{formatNumber(activeScenario.avg_delivery_duration_min, 1)} min</strong>
        </div>
        <div>
          <span>延迟率</span>
          <strong>{formatPercent(activeScenario.delay_rate)}</strong>
        </div>
        <div>
          <span>风险评分</span>
          <strong>{formatNumber(activeScenario.risk_score, 3)}</strong>
        </div>
        <div>
          <span>平均距离</span>
          <strong>{formatNumber(activeScenario.avg_distance_km, 1)} km</strong>
        </div>
      </div>
    </aside>
  );
}
