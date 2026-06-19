import { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import type { WeatherSubView } from '../../store/interactionContext';
import type {
  DeliveryFlowSegment,
  MiniMetricTag,
  RiskHeatHalo,
  RiskScenario,
  ScenarioAnchor,
  SceneFilterSummary,
  TrafficSegment,
  WeatherImpactSummary,
  WeatherTrafficSummary,
  WeatherVehicleSummary
} from '../../types/data';

interface SubViewEncodingLayerProps {
  selectedSubView: WeatherSubView;
  selectedWeather: string;
  selectedTimePeriod: string;
  summary: WeatherImpactSummary | null;
  trafficRows: WeatherTrafficSummary[];
  timeRows: SceneFilterSummary[];
  vehicleRows: WeatherVehicleSummary[];
  riskRows: RiskScenario[];
  hoveredId?: string | null;
  selectedId?: string | null;
  onHover: (selection: EncodedSelection, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (selection: EncodedSelection) => void;
  onTimeSelect: (timePeriod: string) => void;
}

export type EncodedSelection =
  | { type: 'metric_tag'; item: MiniMetricTag }
  | { type: 'risk_heat_halo'; item: RiskHeatHalo }
  | { type: 'traffic_segment'; item: TrafficSegment }
  | { type: 'delivery_flow_segment'; item: DeliveryFlowSegment }
  | { type: 'risk_pulse'; item: ScenarioAnchor };

const trafficPositions: Record<string, [number, number]> = {
  Low: [390, 390],
  Medium: [660, 310],
  High: [930, 390],
  Jam: [1200, 520]
};

const timeOrder = ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];

const TRAFFIC_LABELS: Record<string, string> = {
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵',
  Unknown: '未知交通'
};

const TIME_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间',
  Unknown: '未知时段'
};

const VEHICLE_LABELS: Record<string, string> = {
  electric_scooter: '电动车',
  scooter: '踏板车',
  motorcycle: '摩托车',
  Unknown: '未知载具'
};

const vehiclePositions: Array<[number, number]> = [
  [420, 430],
  [690, 330],
  [960, 390],
  [1180, 580],
  [580, 640],
  [900, 660]
];

const riskPositions: Array<[number, number]> = [
  [360, 320],
  [540, 520],
  [720, 360],
  [880, 560],
  [1050, 330],
  [1230, 520],
  [430, 700],
  [700, 720],
  [980, 730],
  [1170, 690],
  [800, 500],
  [1320, 360]
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function rate(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : Math.max(0, value);
}

function fmt(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function pct(value: number | undefined) {
  return `${Math.round(rate(value) * 100)}%`;
}

function trafficLabel(value: string | null | undefined) {
  return TRAFFIC_LABELS[value ?? ''] ?? value ?? '-';
}

function timeLabel(value: string | null | undefined) {
  return TIME_LABELS[value ?? ''] ?? value ?? '-';
}

function vehicleLabel(value: string | null | undefined) {
  return VEHICLE_LABELS[value ?? ''] ?? value ?? '-';
}

function trafficColor(delayRate: number | undefined) {
  const v = rate(delayRate);
  if (v >= 0.56) return '#dc2626';
  if (v >= 0.38) return '#f97316';
  if (v >= 0.18) return '#f59e0b';
  return '#2563eb';
}

function keySelect<T>(event: KeyboardEvent<SVGGElement>, item: T, onSelect: (item: T) => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  onSelect(item);
}

function summaryTags(
  summary: WeatherImpactSummary | SceneFilterSummary | null,
  weather: string,
  selectedTimePeriod: string
): MiniMetricTag[] {
  if (!summary) return [];
  const idSuffix = selectedTimePeriod === 'All' ? weather : `${weather}-${selectedTimePeriod}`;
  return [
    {
      id: `weather-summary-avg-${idSuffix}`,
      label: '平均时长',
      x: 360,
      y: 250,
      weather: summary.weather ?? weather,
      order_count: summary.order_count,
      avg_delivery_duration_min: summary.avg_delivery_duration_min,
      delay_rate: summary.delay_rate,
      risk_score: summary.risk_score
    },
    {
      id: `weather-summary-delay-${idSuffix}`,
      label: '延迟率',
      x: 720,
      y: 210,
      weather: summary.weather ?? weather,
      order_count: summary.order_count,
      avg_delivery_duration_min: summary.avg_delivery_duration_min,
      delay_rate: summary.delay_rate,
      risk_score: summary.risk_score
    },
    {
      id: `weather-summary-distance-${idSuffix}`,
      label: '平均距离',
      x: 1060,
      y: 270,
      weather: summary.weather ?? weather,
      order_count: summary.order_count,
      avg_delivery_duration_min: summary.avg_delivery_duration_min,
      avg_distance_km: summary.avg_distance_km,
      delay_rate: summary.delay_rate
    }
  ];
}

function trafficSelection(row: WeatherTrafficSummary): TrafficSegment {
  const [x, y] = trafficPositions[row.traffic_density ?? ''] ?? [760, 460];
  return {
    id: `weather-traffic-${row.weather ?? 'All'}-${row.traffic_density ?? 'Unknown'}`,
    label: row.traffic_density ?? 'Unknown',
    path: '',
    points: [],
    x,
    y,
    traffic_density: (row.traffic_density ?? 'Unknown') as TrafficSegment['traffic_density'],
    weather: row.weather ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score ?? row.delay_rate
  };
}

function timeSelection(row: SceneFilterSummary, index: number): DeliveryFlowSegment {
  const x = 270 + index * 250;
  return {
    id: `weather-time-${row.weather ?? 'All'}-${row.time_period ?? index}`,
    label: row.time_period ?? 'Unknown',
    start: [x, 800],
    end: [x + 150, 800],
    weather: row.weather ?? undefined,
    time_period: row.time_period ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score,
    speed: Math.max(0.5, 1.4 - rate(row.delay_rate))
  };
}

function vehicleSelection(row: WeatherVehicleSummary, index: number): TrafficSegment {
  const [x, y] = vehiclePositions[index % vehiclePositions.length];
  return {
    id: `weather-vehicle-${row.vehicle_type}`,
    label: row.vehicle_type,
    path: '',
    points: [],
    x,
    y,
    traffic_density: 'Unknown',
    vehicle_type: row.vehicle_type,
    weather: row.weather ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score ?? row.delay_rate
  };
}

function riskSelection(row: RiskScenario, index: number): ScenarioAnchor {
  const [x, y] = riskPositions[index % riskPositions.length];
  return {
    id: `weather-risk-${row.scenario_id}`,
    scenario_id: row.scenario_id,
    label: row.label,
    x,
    y,
    radius: 24 + rate(row.delay_rate) * 42,
    weather: row.weather ?? undefined,
    traffic_density: row.traffic_density ?? undefined,
    time_period: row.time_period ?? undefined,
    vehicle_type: row.vehicle_type ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score
  };
}

export default function SubViewEncodingLayer({
  selectedSubView,
  selectedWeather,
  selectedTimePeriod,
  summary,
  trafficRows,
  timeRows,
  vehicleRows,
  riskRows,
  hoveredId,
  selectedId,
  onHover,
  onLeave,
  onSelect,
  onTimeSelect
}: SubViewEncodingLayerProps) {
  const maxTrafficOrders = Math.max(1, ...trafficRows.map((row) => row.order_count));
  const maxVehicleOrders = Math.max(1, ...vehicleRows.map((row) => row.order_count));
  const maxTimeOrders = Math.max(1, ...timeRows.map((row) => row.order_count));
  const overviewSummary = selectedTimePeriod !== 'All'
    ? timeRows.find((row) => row.time_period === selectedTimePeriod) ?? summary
    : summary;

  return (
    <svg
      className={`map-data-layer weather-subview-layer subview-${selectedSubView}`}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="none"
      role="group"
      aria-label="天气子视图编码层"
    >
      <g className={`weather-encoding-group${selectedSubView === 'overview' ? ' is-visible' : ''}`}>
        {summaryTags(overviewSummary, selectedWeather, selectedTimePeriod).map((tag, index) => {
          const active = hoveredId === tag.id || selectedId === tag.id;
          const summarySelection: EncodedSelection = { type: 'metric_tag', item: tag };
          return (
            <g
              key={tag.id}
              className={`weather-summary-node${active ? ' is-active' : ''}`}
              transform={`translate(${tag.x} ${tag.y})`}
              role="button"
              tabIndex={0}
              aria-label={tag.label}
              onMouseMove={(event) => onHover(summarySelection, event)}
              onMouseLeave={onLeave}
              onBlur={onLeave}
              onKeyDown={(event) => keySelect(event, summarySelection, onSelect)}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(summarySelection);
              }}
            >
              <circle className="weather-summary-halo" r={48 + index * 8} />
              <rect x={-72} y={-24} width={144} height={48} rx={8} />
              <text x={0} y={-4}>{tag.label}</text>
              <text className="weather-node-value" x={0} y={15}>
                {index === 0 ? `${fmt(tag.avg_delivery_duration_min, 1)}分` : index === 1 ? pct(tag.delay_rate) : `${fmt(tag.avg_distance_km, 1)}公里`}
              </text>
            </g>
          );
        })}
      </g>

      <g className={`weather-encoding-group${selectedSubView === 'traffic' ? ' is-visible' : ''}`}>
        {trafficRows.map((row) => {
          const item = trafficSelection(row);
          const active = hoveredId === item.id || selectedId === item.id;
          const r = 28 + clamp(row.order_count / maxTrafficOrders) * 42;
          return (
            <g
              key={item.id}
              className={`weather-traffic-node${active ? ' is-active' : ''}`}
              transform={`translate(${item.x} ${item.y})`}
              role="button"
              tabIndex={0}
              aria-label={`交通密度 ${trafficLabel(item.traffic_density)}`}
              style={{ '--traffic-node-color': trafficColor(row.delay_rate), '--traffic-ring-scale': 1 + rate(row.risk_score) * 0.36 } as CSSProperties}
              onMouseMove={(event) => onHover({ type: 'traffic_segment', item }, event)}
              onMouseLeave={onLeave}
              onBlur={onLeave}
              onKeyDown={(event) => keySelect(event, { type: 'traffic_segment', item }, onSelect)}
              onClick={(event) => {
                event.stopPropagation();
                onSelect({ type: 'traffic_segment', item });
              }}
            >
              <circle className="weather-node-ring" r={r * (1 + rate(row.risk_score) * 0.3)} />
              <circle className="weather-node-core" r={r} />
              <text x={0} y={4}>{trafficLabel(item.traffic_density)}</text>
              <text className="weather-node-value" x={0} y={r + 24}>{pct(row.delay_rate)}</text>
            </g>
          );
        })}
      </g>

      <g className={`weather-encoding-group${selectedSubView === 'time' ? ' is-visible' : ''}`}>
        {timeRows
          .filter((row) => row.time_period && timeOrder.includes(row.time_period))
          .slice(0, 5)
          .map((row, index) => {
            const item = timeSelection(row, index);
            const active = hoveredId === item.id || selectedId === item.id;
            const height = 26 + clamp(row.order_count / maxTimeOrders) * 90;
            const timeSelectionItem: EncodedSelection = { type: 'delivery_flow_segment', item };
            return (
              <g
                key={item.id}
                className={`weather-time-band${active ? ' is-active' : ''}`}
                transform={`translate(${item.start[0]} ${item.start[1]})`}
                role="button"
                tabIndex={0}
                aria-label={`时段 ${timeLabel(item.time_period)}`}
                onMouseMove={(event) => onHover(timeSelectionItem, event)}
                onMouseLeave={onLeave}
                onBlur={onLeave}
                onKeyDown={(event) => keySelect(event, timeSelectionItem, (selection) => {
                  onTimeSelect(item.time_period ?? 'All');
                  onSelect(selection);
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  onTimeSelect(item.time_period ?? 'All');
                  onSelect(timeSelectionItem);
                }}
              >
                <rect className="weather-time-hit" x={-26} y={-130} width={202} height={170} rx={8} />
                <rect className="weather-time-bar" x={0} y={-height} width={150} height={height} rx={7} />
                <text x={75} y={24}>{timeLabel(item.time_period)}</text>
                <text className="weather-node-value" x={75} y={-height - 12}>{fmt(row.avg_delivery_duration_min, 1)}分</text>
              </g>
            );
          })}
      </g>

      <g className={`weather-encoding-group${selectedSubView === 'vehicle' ? ' is-visible' : ''}`}>
        {vehicleRows.slice(0, 6).map((row, index) => {
          const item = vehicleSelection(row, index);
          const active = hoveredId === item.id || selectedId === item.id;
          const r = 30 + clamp(row.order_count / maxVehicleOrders) * 44;
          return (
            <g
              key={item.id}
              className={`weather-vehicle-node${active ? ' is-active' : ''}`}
              transform={`translate(${item.x} ${item.y})`}
              role="button"
              tabIndex={0}
              aria-label={`载具 ${vehicleLabel(item.vehicle_type)}`}
              style={{ '--traffic-node-color': trafficColor(row.delay_rate) } as CSSProperties}
              onMouseMove={(event) => onHover({ type: 'traffic_segment', item }, event)}
              onMouseLeave={onLeave}
              onBlur={onLeave}
              onKeyDown={(event) => keySelect(event, { type: 'traffic_segment', item }, onSelect)}
              onClick={(event) => {
                event.stopPropagation();
                onSelect({ type: 'traffic_segment', item });
              }}
            >
              <circle className="weather-node-ring" r={r + rate(row.risk_score) * 18} />
              <circle className="weather-node-core" r={r} />
              <text x={0} y={4}>{vehicleLabel(item.vehicle_type)}</text>
              <text className="weather-node-value" x={0} y={r + 24}>{fmt(row.avg_delivery_duration_min, 1)}分</text>
            </g>
          );
        })}
      </g>

      <g className={`weather-encoding-group${selectedSubView === 'risk' ? ' is-visible' : ''}`}>
        {riskRows.slice(0, 12).map((row, index) => {
          const item = riskSelection(row, index);
          const active = hoveredId === item.id || selectedId === item.id;
          return (
            <g
              key={item.id}
              className={`weather-risk-bubble${active ? ' is-active' : ''}`}
              transform={`translate(${item.x} ${item.y})`}
              role="button"
              tabIndex={0}
              aria-label={`延迟率 ${pct(item.delay_rate)}`}
              style={{ '--risk-node-size': item.radius } as CSSProperties}
              onMouseMove={(event) => onHover({ type: 'risk_pulse', item }, event)}
              onMouseLeave={onLeave}
              onBlur={onLeave}
              onKeyDown={(event) => keySelect(event, { type: 'risk_pulse', item }, onSelect)}
              onClick={(event) => {
                event.stopPropagation();
                onSelect({ type: 'risk_pulse', item });
              }}
            >
              <circle className="weather-risk-bubble-ring" r={item.radius} />
              <circle className="weather-risk-bubble-core" r={item.radius * 0.66} />
              <text x={0} y={5}>{pct(item.delay_rate)}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
