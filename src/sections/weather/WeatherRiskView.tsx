import { useInteraction } from '../../store/interactionContext';
import {
  aggregateRiskScenarios,
  DELAY_THRESHOLD_MIN,
  filterOrdersByTimePeriod,
  filterOrdersByWeather,
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
const RISK_LABEL_LIMIT = 5;
const RISK_LABEL_HEIGHT = 14;
const RISK_LABEL_GAP = 6;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function WeatherRiskView({ selectedWeather, selectedTimePeriod, data }: WeatherRiskViewProps) {
  const { selectedScenarioId, setSelectedItem, setSelectedScenarioId } = useInteraction();
  const weatherOrders = filterOrdersByWeather(data.orders, selectedWeather);
  const scopedOrders = filterOrdersByTimePeriod(weatherOrders, selectedTimePeriod);
  const rows = aggregateRiskScenarios(scopedOrders);
  const visibleRows = rows.slice(0, 18);
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
  const points = visibleRows.map((row) => {
    const radius = 6 + (row.order_count / maxOrders) * 18;
    const cx = x(row.avg_delivery_duration_min);
    const cy = y(row.delay_rate);
    const label = `${trafficLabel(row.traffic_density)} · ${timeLabel(row.time_period)} · ${vehicleLabel(row.vehicle_type)}`;
    return { row, radius, cx, cy, label };
  });
  const placedLabels: Array<{
    scenarioId: string;
    x: number;
    y: number;
    w: number;
    anchor: 'start' | 'end';
    bubbleX: number;
    bubbleY: number;
    bubbleR: number;
    text: string;
  }> = [];

  points.slice(0, RISK_LABEL_LIMIT).forEach((point) => {
    const labelW = Math.min(Math.max(point.label.length * 6.4, 96), 190);
    const preferredAnchor = point.cx < PAD.left + plotW * 0.58 ? 'start' : 'end';
    const minY = PAD.top + 12;
    const maxY = H - PAD.bottom - 8;
    const baseY = clamp(point.cy + 4, minY, maxY);
    const offsets = [0, -18, 18, -36, 36, -54, 54, -72, 72, -90, 90, -108, 108];
    const anchors: Array<'start' | 'end'> = preferredAnchor === 'start' ? ['start', 'end'] : ['end', 'start'];
    let bestLabel: { x: number; y: number; anchor: 'start' | 'end'; score: number } = {
      x: point.cx + point.radius + 8,
      y: baseY,
      anchor: preferredAnchor,
      score: Number.POSITIVE_INFINITY
    };

    anchors.forEach((anchor) => {
      const rawX = anchor === 'start' ? point.cx + point.radius + 8 : point.cx - point.radius - labelW - 8;
      const labelX = clamp(rawX, PAD.left + 4, W - PAD.right - labelW - 4);

      offsets.forEach((offset) => {
        const candidateY = clamp(point.cy + 4 + offset, minY, maxY);
        const overlaps = placedLabels.some((prev) => {
          const xClose = labelX < prev.x + prev.w + RISK_LABEL_GAP && labelX + labelW > prev.x - RISK_LABEL_GAP;
          const yClose = Math.abs(candidateY - prev.y) < RISK_LABEL_HEIGHT + RISK_LABEL_GAP;
          return xClose && yClose;
        });
        if (overlaps) return;

        const sidePenalty = anchor === preferredAnchor ? 0 : 20;
        const edgePenalty = Math.abs(labelX - rawX) * 0.2;
        const score = Math.abs(candidateY - baseY) + sidePenalty + edgePenalty;
        if (score < bestLabel.score) {
          bestLabel = { x: labelX, y: candidateY, anchor, score };
        }
      });
    });

    placedLabels.push({
      scenarioId: point.row.scenario_id,
      x: bestLabel.x,
      y: bestLabel.y,
      w: labelW,
      anchor: bestLabel.anchor,
      bubbleX: point.cx,
      bubbleY: point.cy,
      bubbleR: point.radius,
      text: point.label
    });
  });
  const labelByScenario = new Map(placedLabels.map((label) => [label.scenarioId, label]));

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
            {placedLabels.map((label) => {
              const lineEndX = label.anchor === 'start' ? label.x : label.x + label.w;
              const lineEndY = label.y - 4;
              if (Math.abs(lineEndY - label.bubbleY) < label.bubbleR + 8) return null;
              return (
                <line
                  key={`leader-${label.scenarioId}`}
                  x1={label.bubbleX + (label.anchor === 'start' ? label.bubbleR : -label.bubbleR)}
                  y1={label.bubbleY}
                  x2={lineEndX}
                  y2={lineEndY}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  strokeLinecap="round"
                  opacity={0.72}
                  pointerEvents="none"
                />
              );
            })}
            {points.map(({ row, radius, cx, cy, label }) => {
              const active = selectedScenarioId === row.scenario_id;
              const placedLabel = labelByScenario.get(row.scenario_id);
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
                  <circle cx={cx} cy={cy} r={active ? radius + 4 : radius} fill={row.delay_rate >= 0.5 ? '#dc2626' : row.delay_rate >= 0.3 ? '#f97316' : '#2563eb'} opacity={active ? 0.95 : 0.74}>
                    <title>{`${label}：${row.order_count} 单，均时 ${fmt(row.avg_delivery_duration_min, 1)} 分钟，延迟率 ${pct(row.delay_rate)}`}</title>
                  </circle>
                  {placedLabel ? (
                    <text
                      x={placedLabel.anchor === 'start' ? placedLabel.x : placedLabel.x + placedLabel.w}
                      y={placedLabel.y}
                      textAnchor={placedLabel.anchor}
                      className="weather-risk-label"
                    >
                      {placedLabel.text}
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
