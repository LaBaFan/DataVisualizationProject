import { useInteraction } from '../../store/interactionContext';
import {
  barWidth,
  fmt,
  pct,
  scenarioToRiskSelection,
  timeLabel,
  type WeatherViewData
} from './weatherViewUtils';

interface WeatherRiskViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

export default function WeatherRiskView({ selectedWeather, selectedTimePeriod, data }: WeatherRiskViewProps) {
  const { selectedScenarioId, setSelectedItem, setSelectedScenarioId } = useInteraction();
  const rows = data.scenarios
    .filter((row) => selectedWeather === 'All' || row.weather === selectedWeather)
    .filter((row) => selectedTimePeriod === 'All' || row.time_period === selectedTimePeriod)
    .sort((a, b) => b.risk_score - a.risk_score || b.order_count - a.order_count)
    .slice(0, 16);

  return (
    <section className="weather-subview" aria-label="天气风险组合">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">风险 / 05</span>
        <h2>高风险组合前 {rows.length} 项</h2>
        <p>按风险评分排序天气 × 交通 × 时段 × 载具组合。点击任一组合会锁定右侧 ETA 风险票据。</p>
      </div>

      <div className="risk-table-wrap weather-risk-table">
        <div className="risk-table-head">
          <span>#</span>
          <span>天气</span>
          <span>交通</span>
          <span>时段</span>
          <span>订单数</span>
          <span>时长</span>
          <span>延迟率</span>
          <span>风险</span>
        </div>
        {rows.length ? rows.map((row, index) => {
          const active = selectedScenarioId === row.scenario_id;
          return (
            <button
              key={row.scenario_id}
              type="button"
              className={`risk-table-row weather-risk-row${active ? ' is-active' : ''}`}
              onClick={() => {
                setSelectedScenarioId(row.scenario_id);
                setSelectedItem({ type: 'risk_heat_halo', item: scenarioToRiskSelection(row) });
              }}
            >
              <span className="risk-rank">{index + 1}</span>
              <span>{row.weather ?? '-'}</span>
              <span>{row.traffic_density ?? '-'}</span>
              <span>{timeLabel(row.time_period)}</span>
              <span>{row.order_count.toLocaleString()}</span>
              <span>{fmt(row.avg_delivery_duration_min, 1)}</span>
              <span className={row.delay_rate > 0.5 ? 'is-high' : ''}>{pct(row.delay_rate)}</span>
              <span className="risk-score-cell">
                <i style={{ width: barWidth(row.risk_score, 1) }} />
                <em>{fmt(row.risk_score, 2)}</em>
              </span>
            </button>
          );
        }) : <p className="detail-empty">暂无当前筛选下的风险组合</p>}
      </div>
    </section>
  );
}
