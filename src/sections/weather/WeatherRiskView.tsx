import { useInteraction } from '../../store/interactionContext';
import {
  aggregateRiskScenarios,
  DELAY_THRESHOLD_MIN,
  filterOrdersByTimePeriod,
  filterOrdersByWeather,
  getRiskColor,
  getWeatherInsight
} from './weatherAnalytics';
import {
  fmt,
  pct,
  scenarioToRiskSelection,
  timeLabel,
  trafficLabel,
  vehicleLabel,
  type WeatherViewData
} from './weatherViewUtils';

interface WeatherRiskViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

const W = 740;
const H = 390;
const PAD = { left: 62, right: 36, top: 34, bottom: 58 };

export default function WeatherRiskView({ selectedWeather, selectedTimePeriod, data }: WeatherRiskViewProps) {
  const { selectedScenarioId, setSelectedItem, setSelectedScenarioId } = useInteraction();
  const weatherOrders = filterOrdersByWeather(data.orders, selectedWeather);
  const scopedOrders = filterOrdersByTimePeriod(weatherOrders, selectedTimePeriod);
  const rows = aggregateRiskScenarios(scopedOrders);
  const visibleRows = rows.slice(0, 18);
  const topLabels = new Set(rows.slice(0, 5).map((row) => row.scenario_id));
  const avgDelayRate = scopedOrders.length
    ? scopedOrders.filter((order) => order.delivery_duration_min > DELAY_THRESHOLD_MIN).length / scopedOrders.length
    : 0;
  const maxDuration = Math.max(DELAY_THRESHOLD_MIN + 8, ...visibleRows.map((row) => row.avg_delivery_duration_min)) * 1.08;
  const maxDelay = Math.max(0.55, ...visibleRows.map((row) => row.delay_rate)) * 1.08;
  const maxOrders = Math.max(1, ...visibleRows.map((row) => row.order_count));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (value: number) => PAD.left + (value / maxDuration) * plotW;
  const y = (value: number) => H - PAD.bottom - (value / maxDelay) * plotH;

  return (
    <section className="weather-subview" aria-label="天气风险组合">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">风险 / 05</span>
        <h2>风险组合象限图</h2>
        <p>{getWeatherInsight('risk', rows, selectedWeather)}</p>
      </div>

      <div className="weather-chart-card">
        {visibleRows.length ? (
          <svg className="weather-svg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="风险组合象限图">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(maxDelay * tick)} y2={y(maxDelay * tick)} className="weather-grid-line" />
                <line x1={x(maxDuration * tick)} x2={x(maxDuration * tick)} y1={PAD.top} y2={H - PAD.bottom} className="weather-grid-line" />
                <text x={PAD.left - 10} y={y(maxDelay * tick) + 4} textAnchor="end" className="weather-axis-tick">{pct(maxDelay * tick)}</text>
                <text x={x(maxDuration * tick)} y={H - 26} textAnchor="middle" className="weather-axis-tick">{fmt(maxDuration * tick)}</text>
              </g>
            ))}
            <line x1={x(DELAY_THRESHOLD_MIN)} x2={x(DELAY_THRESHOLD_MIN)} y1={PAD.top} y2={H - PAD.bottom} className="weather-threshold-line" />
            <line x1={PAD.left} x2={W - PAD.right} y1={y(avgDelayRate)} y2={y(avgDelayRate)} className="weather-average-line" />
            <text x={x(DELAY_THRESHOLD_MIN) + 6} y={PAD.top + 12} className="weather-threshold-label">32 分钟</text>
            <text x={W - PAD.right - 4} y={y(avgDelayRate) - 6} textAnchor="end" className="weather-threshold-label">当前平均延迟率</text>
            {visibleRows.map((row) => {
              const active = selectedScenarioId === row.scenario_id;
              const radius = 6 + (row.order_count / maxOrders) * 18;
              const label = `${trafficLabel(row.traffic_density)} · ${timeLabel(row.time_period)} · ${vehicleLabel(row.vehicle_type)}`;
              return (
                <g
                  key={row.scenario_id}
                  className={`weather-risk-point${active ? ' is-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedScenarioId(row.scenario_id);
                    setSelectedItem({ type: 'risk_heat_halo', item: scenarioToRiskSelection(row) });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedScenarioId(row.scenario_id);
                      setSelectedItem({ type: 'risk_heat_halo', item: scenarioToRiskSelection(row) });
                    }
                  }}
                >
                  <circle cx={x(row.avg_delivery_duration_min)} cy={y(row.delay_rate)} r={active ? radius + 4 : radius} fill={getRiskColor(row.risk_score)} opacity={active ? 0.95 : 0.74}>
                    <title>{`${label}：${row.order_count} 单，均时 ${fmt(row.avg_delivery_duration_min, 1)} 分钟，延迟率 ${pct(row.delay_rate)}，风险 ${fmt(row.risk_score, 2)}`}</title>
                  </circle>
                  {topLabels.has(row.scenario_id) ? (
                    <text x={x(row.avg_delivery_duration_min) + radius + 5} y={y(row.delay_rate) + 4} className="weather-risk-label">
                      {label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="weather-axis-line" />
            <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} className="weather-axis-line" />
            <text x={(PAD.left + W - PAD.right) / 2} y={H - 6} textAnchor="middle" className="weather-axis-label">平均配送时长（分钟）</text>
            <text x={16} y={H / 2} textAnchor="middle" className="weather-axis-label" transform={`rotate(-90 16 ${H / 2})`}>延迟率</text>
          </svg>
        ) : <p className="detail-empty">暂无 10 单以上的风险组合</p>}
      </div>
    </section>
  );
}
