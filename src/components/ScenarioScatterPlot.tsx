import { ScenarioOrderPoint } from '../types/data';

interface ScenarioScatterPlotProps {
  points: ScenarioOrderPoint[];
  selectedOrderId: string | null;
  scenarioAvgDuration: number;
  globalAvgDuration: number;
  onSelectOrder: (orderId: string) => void;
}

const WIDTH = 560;
const HEIGHT = 310;
const PAD = { top: 22, right: 24, bottom: 44, left: 54 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function niceMax(value: number) {
  if (value <= 0) return 10;
  return Math.ceil(value / 5) * 5;
}

export default function ScenarioScatterPlot({
  points,
  selectedOrderId,
  scenarioAvgDuration,
  globalAvgDuration,
  onSelectOrder
}: ScenarioScatterPlotProps) {
  const maxDistance = niceMax(Math.max(...points.map((point) => point.distance_km), 10));
  const maxDuration = niceMax(Math.max(...points.map((point) => point.delivery_duration_min), scenarioAvgDuration, globalAvgDuration, 50));
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (distance: number) => PAD.left + (clamp(distance, 0, maxDistance) / maxDistance) * innerWidth;
  const y = (duration: number) => PAD.top + innerHeight - (clamp(duration, 0, maxDuration) / maxDuration) * innerHeight;

  return (
    <svg className="scenario-scatter" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="距离-配送时间散点图">
      <line className="scatter-axis" x1={PAD.left} y1={PAD.top + innerHeight} x2={PAD.left + innerWidth} y2={PAD.top + innerHeight} />
      <line className="scatter-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerHeight} />

      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const gx = PAD.left + tick * innerWidth;
        const gy = PAD.top + tick * innerHeight;
        return (
          <g key={tick}>
            <line className="scatter-grid" x1={gx} y1={PAD.top} x2={gx} y2={PAD.top + innerHeight} />
            <line className="scatter-grid" x1={PAD.left} y1={gy} x2={PAD.left + innerWidth} y2={gy} />
          </g>
        );
      })}

      <line className="scatter-reference scatter-reference-global" x1={PAD.left} y1={y(globalAvgDuration)} x2={PAD.left + innerWidth} y2={y(globalAvgDuration)} />
      <line
        className="scatter-reference scatter-reference-scenario"
        x1={PAD.left}
        y1={y(scenarioAvgDuration)}
        x2={PAD.left + innerWidth}
        y2={y(scenarioAvgDuration)}
      />

      <text className="scatter-ref-label" x={PAD.left + 8} y={y(globalAvgDuration) - 6}>
        全局平均 {globalAvgDuration.toFixed(1)} min
      </text>
      <text className="scatter-ref-label scatter-ref-label-scenario" x={PAD.left + 8} y={y(scenarioAvgDuration) + 16}>
        当前场景 {scenarioAvgDuration.toFixed(1)} min
      </text>

      {points.map((point) => {
        const selected = selectedOrderId === point.order_id;
        const radius = clamp(5 + point.delivery_duration_min / 18, 7, 13);
        return (
          <g
            key={point.order_id}
            className="scatter-point-button"
            role="button"
            tabIndex={0}
            aria-label={`查看订单 ${point.order_id}`}
            onClick={() => onSelectOrder(point.order_id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectOrder(point.order_id);
              }
            }}
          >
            <circle
              className={`scatter-point${point.is_delayed ? ' is-delayed' : ''}${selected ? ' is-selected' : ''}`}
              cx={x(point.distance_km)}
              cy={y(point.delivery_duration_min)}
              r={radius}
            />
          </g>
        );
      })}

      <text className="scatter-axis-label" x={PAD.left + innerWidth / 2} y={HEIGHT - 10}>
        distance_km
      </text>
      <text className="scatter-axis-label" transform={`translate(16 ${PAD.top + innerHeight / 2}) rotate(-90)`}>
        delivery_duration_min
      </text>
    </svg>
  );
}
