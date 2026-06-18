import { useMemo, useState } from 'react';
import { RiskScenario } from '../types/data';

interface RiskScenarioBubblePlotProps {
  scenarios: Array<RiskScenario & { highlighted: boolean }>;
  selectedScenarioId: string | null;
  onSelectScenario: (scenario: RiskScenario) => void;
}

interface BubblePoint {
  scenario: RiskScenario & { highlighted: boolean };
  x: number;
  y: number;
  radius: number;
  color: string;
  strokeDasharray?: string;
}

const width = 820;
const height = 460;
const margin = { top: 34, right: 34, bottom: 58, left: 70 };
const delayThresholdMin = 32;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function riskColor(score: number) {
  if (score >= 0.86) return '#b91c1c';
  if (score >= 0.72) return '#ea580c';
  if (score >= 0.55) return '#ca8a04';
  return '#0f766e';
}

function vehicleStroke(vehicle: string | null | undefined) {
  const normalized = (vehicle ?? '').toLowerCase();
  if (normalized.includes('electric')) return '7 4';
  if (normalized.includes('scooter')) return '2 3';
  return undefined;
}

function scale(value: number, domain: [number, number], range: [number, number]) {
  const [min, max] = domain;
  if (max === min) return (range[0] + range[1]) / 2;
  const ratio = (value - min) / (max - min);
  return range[0] + ratio * (range[1] - range[0]);
}

export default function RiskScenarioBubblePlot({ scenarios, selectedScenarioId, onSelectScenario }: RiskScenarioBubblePlotProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const plot = useMemo(() => {
    const durations = scenarios.map((row) => row.avg_delivery_duration_min);
    const rates = scenarios.map((row) => row.delay_rate > 1 ? row.delay_rate / 100 : row.delay_rate);
    const counts = scenarios.map((row) => row.order_count);
    const xMin = Math.min(...durations, delayThresholdMin) - 1;
    const xMax = Math.max(...durations, delayThresholdMin) + 2;
    const yMin = Math.max(0, Math.min(...rates) - 0.04);
    const yMax = Math.min(1, Math.max(...rates) + 0.04);
    const countMin = Math.min(...counts);
    const countMax = Math.max(...counts);
    const avgDelayRate = rates.reduce((sum, value) => sum + value, 0) / Math.max(rates.length, 1);

    const points: BubblePoint[] = scenarios.map((scenario) => {
      const normalizedRate = scenario.delay_rate > 1 ? scenario.delay_rate / 100 : scenario.delay_rate;
      return {
        scenario,
        x: scale(scenario.avg_delivery_duration_min, [xMin, xMax], [margin.left, width - margin.right]),
        y: scale(normalizedRate, [yMin, yMax], [height - margin.bottom, margin.top]),
        radius: scale(Math.sqrt(scenario.order_count), [Math.sqrt(countMin), Math.sqrt(countMax)], [8, 28]),
        color: riskColor(scenario.risk_score),
        strokeDasharray: vehicleStroke(scenario.vehicle_type)
      };
    });

    return {
      points,
      xMin,
      xMax,
      yMin,
      yMax,
      avgDelayRate,
      thresholdX: scale(delayThresholdMin, [xMin, xMax], [margin.left, width - margin.right]),
      avgDelayY: scale(avgDelayRate, [yMin, yMax], [height - margin.bottom, margin.top])
    };
  }, [scenarios]);

  if (!scenarios.length) {
    return <div className="risk-bubble-empty">暂无风险场景数据</div>;
  }

  const hovered = hoveredId ? plot.points.find((point) => point.scenario.scenario_id === hoveredId) : null;
  const xTicks = [plot.xMin, delayThresholdMin, plot.xMax];
  const yTicks = [plot.yMin, plot.avgDelayRate, plot.yMax];

  return (
    <div className="risk-bubble-plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="风险场景气泡图">
        <rect className="risk-quadrant-bg risk-quadrant-low" x={margin.left} y={plot.avgDelayY} width={plot.thresholdX - margin.left} height={height - margin.bottom - plot.avgDelayY} />
        <rect className="risk-quadrant-bg risk-quadrant-watch" x={plot.thresholdX} y={plot.avgDelayY} width={width - margin.right - plot.thresholdX} height={height - margin.bottom - plot.avgDelayY} />
        <rect className="risk-quadrant-bg risk-quadrant-late" x={margin.left} y={margin.top} width={plot.thresholdX - margin.left} height={plot.avgDelayY - margin.top} />
        <rect className="risk-quadrant-bg risk-quadrant-critical" x={plot.thresholdX} y={margin.top} width={width - margin.right - plot.thresholdX} height={plot.avgDelayY - margin.top} />

        <line className="risk-axis" x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} />
        <line className="risk-axis" x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} />
        <line className="risk-reference-line" x1={plot.thresholdX} x2={plot.thresholdX} y1={margin.top} y2={height - margin.bottom} />
        <line className="risk-reference-line" x1={margin.left} x2={width - margin.right} y1={plot.avgDelayY} y2={plot.avgDelayY} />

        <text className="risk-reference-label" x={plot.thresholdX + 8} y={margin.top + 14}>32 分钟阈值</text>
        <text className="risk-reference-label" x={width - margin.right - 110} y={plot.avgDelayY - 8}>平均延迟率 {formatPercent(plot.avgDelayRate)}</text>
        <text className="risk-quadrant-label" x={width - margin.right - 96} y={margin.top + 42}>高风险组合</text>

        {xTicks.map((tick) => {
          const x = scale(tick, [plot.xMin, plot.xMax], [margin.left, width - margin.right]);
          return (
            <g key={`x-${tick}`} className="risk-tick">
              <line x1={x} x2={x} y1={height - margin.bottom} y2={height - margin.bottom + 6} />
              <text x={x} y={height - margin.bottom + 23}>{formatNumber(tick, 0)}</text>
            </g>
          );
        })}
        {yTicks.map((tick) => {
          const y = scale(tick, [plot.yMin, plot.yMax], [height - margin.bottom, margin.top]);
          return (
            <g key={`y-${tick}`} className="risk-tick">
              <line x1={margin.left - 6} x2={margin.left} y1={y} y2={y} />
              <text x={margin.left - 12} y={y + 4}>{formatPercent(tick)}</text>
            </g>
          );
        })}

        <text className="risk-axis-label" x={width / 2} y={height - 15}>平均配送时长</text>
        <text className="risk-axis-label" transform={`translate(20 ${height / 2 + 58}) rotate(-90)`}>延迟率</text>

        {plot.points.map((point) => {
          const active = selectedScenarioId === point.scenario.scenario_id;
          const muted = !point.scenario.highlighted;
          const hoveredPoint = hoveredId === point.scenario.scenario_id;
          return (
            <g key={point.scenario.scenario_id}>
              {active ? <circle className="risk-bubble-halo" cx={point.x} cy={point.y} r={point.radius + 8} /> : null}
              <g
                className="risk-bubble-button"
                role="button"
                tabIndex={0}
                aria-label={`选择风险场景 ${point.scenario.label}`}
                onClick={() => onSelectScenario(point.scenario)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectScenario(point.scenario);
                  }
                }}
                onMouseEnter={() => setHoveredId(point.scenario.scenario_id)}
                onFocus={() => setHoveredId(point.scenario.scenario_id)}
                onMouseLeave={() => setHoveredId(null)}
                onBlur={() => setHoveredId(null)}
              >
                <circle
                  className={`risk-bubble${active ? ' is-active' : ''}${muted ? ' is-muted' : ''}${hoveredPoint ? ' is-hovered' : ''}`}
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  fill={point.color}
                  strokeDasharray={point.strokeDasharray}
                  opacity={muted ? 0.26 : 0.9}
                />
              </g>
            </g>
          );
        })}
      </svg>

      <div className="risk-bubble-legend" aria-hidden="true">
        <span><i className="legend-low" />低风险</span>
        <span><i className="legend-high" />高风险</span>
        <span><b />气泡面积 = 订单数</span>
        <span><em />虚线边框 = 电动车/滑板车</span>
      </div>

      {hovered ? (
        <div
          className="risk-bubble-tooltip"
          style={{
            left: `${clamp((hovered.x / width) * 100, 12, 72)}%`,
            top: `${clamp((hovered.y / height) * 100, 10, 68)}%`
          }}
        >
          <strong>{hovered.scenario.label}</strong>
          <span>{[hovered.scenario.weather, hovered.scenario.traffic_density, hovered.scenario.time_period, hovered.scenario.vehicle_type].map(labelOf).join(' · ')}</span>
          <dl>
            <div><dt>订单数</dt><dd>{hovered.scenario.order_count.toLocaleString()}</dd></div>
            <div><dt>平均时长</dt><dd>{formatNumber(hovered.scenario.avg_delivery_duration_min, 1)} 分钟</dd></div>
            <div><dt>延迟率</dt><dd>{formatPercent(hovered.scenario.delay_rate)}</dd></div>
            <div><dt>平均距离</dt><dd>{formatNumber(hovered.scenario.avg_distance_km, 1)} 公里</dd></div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
