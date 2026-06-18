import { KeyboardEvent, MouseEvent, useMemo } from 'react';
import type { WeatherSubView } from '../../store/interactionContext';
import type {
  DeliveryFlowSegment,
  MapSelection,
  MiniMetricTag,
  RiskHeatHalo,
  RiskScenario,
  ScenarioAnchor,
  SceneFilterSummary,
  TrafficSegment,
  WeatherImpactSummary,
  WeatherOrderSample,
  WeatherTrafficSummary,
  WeatherVehicleSummary
} from '../../types/data';

interface MapInsetChartProps {
  selectedSubView: WeatherSubView;
  selectedWeather: string;
  selectedTimePeriod: string;
  summary: WeatherImpactSummary | null;
  orderPoints: WeatherOrderSample[];
  trafficRows: WeatherTrafficSummary[];
  timeRows: SceneFilterSummary[];
  vehicleRows: WeatherVehicleSummary[];
  riskRows: RiskScenario[];
  selectedId?: string | null;
  onHover: (selection: MapSelection, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (selection: MapSelection) => void;
  onTimeSelect: (timePeriod: string) => void;
}

const WIDTH = 640;
const HEIGHT = 390;
const PAD = { left: 58, right: 34, top: 34, bottom: 58 };
const RISK_PAD = { left: 86, right: 96, top: 52, bottom: 68 };
const TRAFFIC_ORDER = ['Low', 'Medium', 'High', 'Jam'];
const TIME_ORDER = ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];

function maxOf(values: Array<number | undefined>) {
  return Math.max(1, ...values.map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)));
}

function rate(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : Math.max(0, value);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function finiteValues(values: Array<number | undefined>) {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function paddedDomain(values: Array<number | undefined>, fallback: [number, number], paddingRatio = 0.12): [number, number] {
  const nums = finiteValues(values);
  if (!nums.length) return fallback;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * paddingRatio);
    return [min - pad, max + pad];
  }
  const pad = (max - min) * paddingRatio;
  return [min - pad, max + pad];
}

function scaleLinear(value: number | undefined, domain: [number, number], range: [number, number]) {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : domain[0];
  const t = domain[0] === domain[1] ? 0.5 : (safeValue - domain[0]) / (domain[1] - domain[0]);
  return range[0] + clamp(t) * (range[1] - range[0]);
}

function deterministicOffset(seed: string | undefined, index: number, amplitude: number) {
  const source = `${seed ?? 'row'}-${index}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) hash = (hash * 31 + source.charCodeAt(i)) % 9973;
  return ((hash % 200) / 199 - 0.5) * amplitude * 2;
}

function shortRiskLabel(row: RiskScenario) {
  return row.traffic_density ?? row.vehicle_type ?? row.time_period ?? row.weather ?? row.label;
}

function fmt(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function pct(value: number | undefined) {
  return `${Math.round(rate(value) * 100)}%`;
}

function colorByRate(value: number | undefined) {
  const v = rate(value);
  if (v >= 0.55) return '#dc2626';
  if (v >= 0.34) return '#f97316';
  if (v >= 0.16) return '#f59e0b';
  return '#2563eb';
}

function chartTitle(subView: WeatherSubView) {
  const labels: Record<WeatherSubView, string> = {
    overview: '天气基线对比',
    traffic: '交通密度分组',
    time: '时段节奏',
    vehicle: '载具表现',
    risk: '风险组合',
    orders: '距离-时长订单散点'
  };
  return labels[subView];
}

function keySelect(event: KeyboardEvent<SVGGElement>, selection: MapSelection, onSelect: (selection: MapSelection) => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  onSelect(selection);
}

function trafficSelection(row: WeatherTrafficSummary): MapSelection {
  const item: TrafficSegment = {
    id: `chart-traffic-${row.weather ?? 'All'}-${row.traffic_density ?? 'Unknown'}`,
    label: row.traffic_density ?? 'Unknown',
    path: '',
    points: [],
    traffic_density: (row.traffic_density ?? 'Unknown') as TrafficSegment['traffic_density'],
    weather: row.weather ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score ?? row.delay_rate
  };
  return { type: 'traffic_segment', item };
}

function timeSelection(row: SceneFilterSummary): MapSelection {
  const item: DeliveryFlowSegment = {
    id: `chart-time-${row.weather ?? 'All'}-${row.time_period ?? 'Unknown'}`,
    label: row.time_period ?? 'Unknown',
    start: [0, 0],
    end: [0, 0],
    weather: row.weather ?? undefined,
    time_period: row.time_period ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score,
    speed: Math.max(0.5, 1.4 - rate(row.delay_rate))
  };
  return { type: 'delivery_flow_segment', item };
}

function vehicleSelection(row: WeatherVehicleSummary): MapSelection {
  const item: TrafficSegment = {
    id: `chart-vehicle-${row.weather ?? 'All'}-${row.vehicle_type}`,
    label: row.vehicle_type,
    path: '',
    points: [],
    traffic_density: 'Unknown',
    vehicle_type: row.vehicle_type,
    weather: row.weather ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score ?? row.delay_rate
  };
  return { type: 'traffic_segment', item };
}

function riskSelection(row: RiskScenario): MapSelection {
  const item: ScenarioAnchor = {
    id: `chart-risk-${row.scenario_id}`,
    scenario_id: row.scenario_id,
    label: row.label,
    x: 0,
    y: 0,
    radius: 20 + rate(row.risk_score) * 34,
    weather: row.weather ?? undefined,
    traffic_density: row.traffic_density ?? undefined,
    time_period: row.time_period ?? undefined,
    vehicle_type: row.vehicle_type ?? undefined,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score
  };
  return { type: 'risk_pulse', item };
}

function orderSelection(point: WeatherOrderSample): MapSelection {
  return { type: 'order_dot', item: point };
}

function metricSelections(summary: WeatherImpactSummary | null, weather: string): MapSelection[] {
  if (!summary) return [];
  const base = {
    x: 0,
    y: 0,
    weather: summary.weather ?? weather,
    order_count: summary.order_count,
    avg_delivery_duration_min: summary.avg_delivery_duration_min,
    delay_rate: summary.delay_rate,
    risk_score: summary.risk_score
  };
  const avg: MiniMetricTag = { ...base, id: `chart-metric-avg-${weather}`, label: '平均时长' };
  const delay: MiniMetricTag = { ...base, id: `chart-metric-delay-${weather}`, label: '延迟率' };
  const risk: RiskHeatHalo = {
    id: `chart-metric-risk-${weather}`,
    label: '风险评分',
    x: 0,
    y: 0,
    radius: 0,
    weather: base.weather,
    order_count: base.order_count ?? 0,
    avg_delivery_duration_min: base.avg_delivery_duration_min,
    delay_rate: base.delay_rate ?? 0,
    risk_score: base.risk_score ?? base.delay_rate ?? 0
  };
  return [
    { type: 'metric_tag', item: avg },
    { type: 'metric_tag', item: delay },
    { type: 'risk_heat_halo', item: risk }
  ];
}

export default function MapInsetChart({
  selectedSubView,
  selectedWeather,
  selectedTimePeriod,
  summary,
  orderPoints,
  trafficRows,
  timeRows,
  vehicleRows,
  riskRows,
  selectedId,
  onHover,
  onLeave,
  onSelect,
  onTimeSelect
}: MapInsetChartProps) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const riskPlotW = WIDTH - RISK_PAD.left - RISK_PAD.right;
  const riskPlotH = HEIGHT - RISK_PAD.top - RISK_PAD.bottom;
  const dataFilter = selectedWeather === 'All' ? '全部订单' : `weather == ${selectedWeather}`;
  const isTimeFiltered = selectedTimePeriod !== 'All' && selectedTimePeriod !== '';

  // Current time period overview (aggregated from riskRows)
  const currentOverview = useMemo(() => {
    if (!isTimeFiltered || !riskRows.length) return null;
    const filtered = riskRows.filter((r) => r.time_period === selectedTimePeriod);
    if (!filtered.length) return null;
    const totalOrders = filtered.reduce((s, r) => s + (r.order_count ?? 0), 0);
    if (!totalOrders) return null;
    const wDur = filtered.reduce((s, r) => s + (r.avg_delivery_duration_min ?? 0) * (r.order_count ?? 0), 0);
    const wDelay = filtered.reduce((s, r) => s + rate(r.delay_rate) * (r.order_count ?? 0), 0);
    const wRisk = filtered.reduce((s, r) => s + rate(r.risk_score) * (r.order_count ?? 0), 0);
    return {
      weather: selectedWeather,
      order_count: totalOrders,
      avg_delivery_duration_min: wDur / totalOrders,
      delay_rate: wDelay / totalOrders,
      risk_score: wRisk / totalOrders
    };
  }, [riskRows, selectedWeather, selectedTimePeriod, isTimeFiltered]);

  // Current time period traffic (aggregated from riskRows)
  const currentTrafficRows = useMemo(() => {
    if (!isTimeFiltered || !riskRows.length) return [];
    const filtered = riskRows.filter((r) => r.time_period === selectedTimePeriod);
    const grouped = new Map<string, { oc: number; dur: number; del: number; cnt: number }>();
    filtered.forEach((row) => {
      const td = row.traffic_density ?? 'Unknown';
      const cur = grouped.get(td) ?? { oc: 0, dur: 0, del: 0, cnt: 0 };
      const w = row.order_count ?? 0;
      cur.oc += w;
      cur.dur += (row.avg_delivery_duration_min ?? 0) * w;
      cur.del += rate(row.delay_rate) * w;
      cur.cnt += w;
      grouped.set(td, cur);
    });
    return TRAFFIC_ORDER.filter((td) => grouped.has(td)).map((td) => {
      const d = grouped.get(td)!;
      return {
        weather: selectedWeather,
        traffic_density: td,
        order_count: d.oc,
        avg_delivery_duration_min: d.cnt ? d.dur / d.cnt : 0,
        delay_rate: d.cnt ? d.del / d.cnt : 0,
        risk_score: 0
      } as WeatherTrafficSummary;
    });
  }, [riskRows, selectedWeather, selectedTimePeriod, isTimeFiltered]);

  // Current time period vehicle (aggregated from riskRows)
  const currentVehicleRows = useMemo(() => {
    if (!isTimeFiltered || !riskRows.length) return [];
    const filtered = riskRows.filter((r) => r.time_period === selectedTimePeriod && r.vehicle_type);
    const grouped = new Map<string, { oc: number; dur: number; del: number; cnt: number }>();
    filtered.forEach((row) => {
      const vt = row.vehicle_type ?? 'Unknown';
      const cur = grouped.get(vt) ?? { oc: 0, dur: 0, del: 0, cnt: 0 };
      const w = row.order_count ?? 0;
      cur.oc += w;
      cur.dur += (row.avg_delivery_duration_min ?? 0) * w;
      cur.del += rate(row.delay_rate) * w;
      cur.cnt += w;
      grouped.set(vt, cur);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[1].oc - a[1].oc)
      .slice(0, 8)
      .map(([vt, d]) => ({
        vehicle_type: vt,
        weather: selectedWeather,
        order_count: d.oc,
        avg_delivery_duration_min: d.cnt ? d.dur / d.cnt : 0,
        delay_rate: d.cnt ? d.del / d.cnt : 0,
        risk_score: d.cnt ? d.del / d.cnt : 0
      }));
  }, [riskRows, selectedWeather, selectedTimePeriod, isTimeFiltered]);

  // Current time period risk rows
  const currentRiskRows = useMemo(() => {
    if (!isTimeFiltered) return [];
    return riskRows
      .filter((r) => r.time_period === selectedTimePeriod)
      .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
      .slice(0, 16);
  }, [riskRows, selectedTimePeriod, isTimeFiltered]);
  const maxOrders = maxOf([
    ...trafficRows.map((row) => row.order_count),
    ...timeRows.map((row) => row.order_count),
    ...vehicleRows.map((row) => row.order_count),
    ...riskRows.map((row) => row.order_count)
  ]);
  const ordersSample = orderPoints.slice(0, 180);
  const orderXDomain = paddedDomain(ordersSample.map((point) => point.distance_km), [0, maxOf(orderPoints.map((point) => point.distance_km))], 0.1);
  const orderYDomain = paddedDomain(ordersSample.map((point) => point.delivery_duration_min), [0, Math.max(42, maxOf(orderPoints.map((point) => point.delivery_duration_min)))], 0.1);
  const riskRowsForChart = useMemo(() => {
    const source = isTimeFiltered ? currentRiskRows : riskRows;
    return source
      .slice()
      .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
      .slice(0, 16);
  }, [riskRows, currentRiskRows, isTimeFiltered]);
  const riskXDomain = paddedDomain(riskRowsForChart.map((row) => row.avg_delivery_duration_min), [0, 45], 0.18);
  const riskYDomain = paddedDomain(riskRowsForChart.map((row) => rate(row.delay_rate)), [0, 0.7], 0.18);
  const vehicleXDomain = paddedDomain(vehicleRows.map((row) => row.avg_delivery_duration_min), [0, 45], 0.14);
  const metricRows = metricSelections(summary, selectedWeather);

  return (
    <aside className={`map-inset-chart inset-${selectedSubView}`} aria-label="天气模块主交互图表">
      <div className="map-inset-chart-head">
        <div>
          <strong>{selectedWeather} / {chartTitle(selectedSubView)}</strong>
          <span>Data Filter: {dataFilter}</span>
        </div>
        <em>{selectedSubView}</em>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${selectedWeather} ${selectedSubView} chart`}>
        <rect className="map-inset-plot-bg" x={PAD.left} y={PAD.top} width={plotW} height={plotH} rx={10} />

        {selectedSubView === 'overview' ? (
          <g>
            {metricRows.map((selection, index) => {
              const item = selection.item;
              const label = 'label' in item ? item.label : '指标';
              const baseValue = index === 0
                ? summary?.avg_delivery_duration_min
                : index === 1
                  ? rate(summary?.delay_rate) * 100
                  : summary?.risk_score;
              const curValue = currentOverview
                ? (index === 0
                    ? currentOverview.avg_delivery_duration_min
                    : index === 1
                      ? rate(currentOverview.delay_rate) * 100
                      : currentOverview.risk_score)
                : null;
              const max = index === 0 ? 45 : index === 1 ? 70 : 1;
              const y = 56 + index * 100;
              const baseW = clamp((baseValue ?? 0) / max) * 420;
              const curW = curValue != null ? clamp(curValue / max) * 420 : null;
              // Green = current shorter (better), Red = current longer (worse)
              const compareColor = curValue != null && baseValue != null
                ? (curValue < baseValue * 0.97 ? '#10b981' : curValue > baseValue * 1.03 ? '#ef4444' : '#64748b')
                : '#64748b';
              const active = selectedId === item.id;
              return (
                <g
                  key={item.id}
                  className={`map-inset-overview-row${active ? ' is-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onMouseMove={(event) => onHover(selection, event)}
                  onMouseLeave={onLeave}
                  onBlur={onLeave}
                  onKeyDown={(event) => keySelect(event, selection, onSelect)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(selection);
                  }}
                >
                  <text x={PAD.left} y={y - 14}>{label}</text>
                  {/* ── Baseline bar (always full color, unchanged) ── */}
                  <rect x={PAD.left} y={y} width={plotW} height={20} rx={10} className="map-inset-track" />
                  <rect x={PAD.left} y={y} width={Math.max(8, baseW)} height={20} rx={10} className="map-inset-fill" style={{ animationDelay: `${index * 0.1}s` }} />
                  <text className="map-inset-value" x={PAD.left + Math.max(52, baseW + 14)} y={y + 14}>
                    {index === 0 ? `${fmt(summary?.avg_delivery_duration_min, 1)} min` : index === 1 ? pct(summary?.delay_rate) : fmt(summary?.risk_score, 2)}
                  </text>
                  {/* ── Current time period bar (new bar below) ── */}
                  {curW != null && isTimeFiltered && (
                    <>
                      <rect x={PAD.left} y={y + 26} width={plotW} height={20} rx={10} className="map-inset-track" />
                      <rect x={PAD.left} y={y + 26} width={Math.max(8, curW)} height={20} rx={10} fill={compareColor} opacity={0.85} className="map-inset-fill" style={{ animationDelay: `${index * 0.1 + 0.3}s` }} />
                      <text className="map-inset-value" x={PAD.left + Math.max(52, curW + 14)} y={y + 40} fill={compareColor} fontWeight={800}>
                        {index === 0 ? `${fmt(curValue ?? undefined, 1)} min` : index === 1 ? `${Math.round(curValue ?? 0)}%` : fmt(curValue ?? undefined, 2)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        ) : null}

        {selectedSubView === 'traffic' ? (
          <g>
            {trafficRows
              .slice()
              .sort((a, b) => TRAFFIC_ORDER.indexOf(a.traffic_density ?? '') - TRAFFIC_ORDER.indexOf(b.traffic_density ?? ''))
              .map((row, index) => {
                const selection = trafficSelection(row);
                const bandH = plotH / TRAFFIC_ORDER.length;
                const y = PAD.top + index * bandH + 10;
                const barX = PAD.left + 104;
                const barW = plotW - 178;
                const width = Math.max(18, clamp(row.order_count / maxOrders) * barW);
                const active = selectedId === selection.item.id;
                const curRow = currentTrafficRows.find((r) => r.traffic_density === row.traffic_density);
                const curWidth = curRow ? Math.max(18, clamp(curRow.order_count / maxOrders) * barW) : null;
                const compareColor = curRow
                  ? (curRow.order_count < row.order_count * 0.97 ? '#10b981' : curRow.order_count > row.order_count * 1.03 ? '#ef4444' : colorByRate(curRow.delay_rate))
                  : colorByRate(row.delay_rate);
                return (
                  <g
                    key={selection.item.id}
                    className={`map-inset-bar-row${active ? ' is-active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onMouseMove={(event) => onHover(selection, event)}
                    onMouseLeave={onLeave}
                    onBlur={onLeave}
                    onKeyDown={(event) => keySelect(event, selection, onSelect)}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(selection);
                    }}
                  >
                    <rect className="map-inset-hit-area" x={PAD.left} y={y - 6} width={plotW} height={bandH - 6} rx={8} />
                    <text className="map-inset-category" x={PAD.left} y={y + 20}>{row.traffic_density}</text>
                    <rect className="map-inset-track" x={barX} y={y} width={barW} height={22} rx={6} />
                    {/* Baseline bar (unchanged) */}
                    <rect className="map-inset-bar" x={barX} y={y} width={width} height={22} rx={6} fill={colorByRate(row.delay_rate)} style={{ animationDelay: `${index * 0.08}s` }} />
                    <text className="map-inset-value" x={barX + barW + 12} y={y + 15}>{row.order_count}</text>
                    <text className="map-inset-note" x={barX + Math.min(width + 10, barW - 42)} y={y - 4}>{pct(row.delay_rate)}</text>
                    {/* Current time period bar (new bar below) */}
                    {curRow && curWidth != null && isTimeFiltered && (
                      <>
                        <rect className="map-inset-track" x={barX} y={y + 28} width={barW} height={22} rx={6} />
                        <rect x={barX} y={y + 28} width={curWidth} height={22} rx={6} fill={compareColor} opacity={0.85} style={{ animationDelay: `${index * 0.08 + 0.3}s` }} className="map-inset-bar" />
                        <text className="map-inset-value" x={barX + barW + 12} y={y + 43} fill={compareColor} fontWeight={800}>{curRow.order_count}</text>
                        <text className="map-inset-note" x={barX + Math.min(curWidth + 10, barW - 42)} y={y + 24}>{pct(curRow.delay_rate)}</text>
                      </>
                    )}
                  </g>
                );
              })}
            <text className="map-inset-label" x={PAD.left + plotW - 56} y={PAD.top + plotH + 34}>order_count</text>
          </g>
        ) : null}

        {selectedSubView === 'time' ? (
          <g>
            <line className="map-inset-axis" x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} />
            {TIME_ORDER
              .map((period) => timeRows.find((row) => row.time_period === period))
              .filter((row): row is SceneFilterSummary => Boolean(row))
              .map((row, index) => {
                const selection = timeSelection(row);
                const slotW = plotW / TIME_ORDER.length;
                const barW = Math.min(72, slotW - 22);
                const x = PAD.left + index * slotW + (slotW - barW) / 2;
                const h = 38 + clamp(row.avg_delivery_duration_min / 45) * (plotH - 76);
                const y = PAD.top + plotH - h;
                const active = selectedId === selection.item.id;
                const dimmed = Boolean(selectedId && !active);
                return (
                  <g
                    key={selection.item.id}
                    className={`map-inset-time-segment${active ? ' is-active' : ''}${dimmed ? ' is-dimmed' : ''}`}
                    role="button"
                    tabIndex={0}
                    onMouseMove={(event) => onHover(selection, event)}
                    onMouseLeave={onLeave}
                    onBlur={onLeave}
                    onKeyDown={(event) => keySelect(event, selection, (item) => {
                      onTimeSelect(row.time_period ?? 'All');
                      onSelect(item);
                    })}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTimeSelect(row.time_period ?? 'All');
                      onSelect(selection);
                    }}
                  >
                    <rect className="map-inset-hit-area" x={PAD.left + index * slotW + 4} y={PAD.top} width={slotW - 8} height={plotH} rx={8} />
                    <rect x={x} y={y} width={barW} height={h} rx={8} fill={colorByRate(row.delay_rate)} className="map-inset-time-bar" style={{ animationDelay: `${index * 0.08}s` }} />
                    <text className="map-inset-value" x={x + barW / 2} y={Math.max(PAD.top + 16, y - 10)}>{fmt(row.avg_delivery_duration_min, 1)} min</text>
                    <text className="map-inset-category" x={x + barW / 2} y={PAD.top + plotH + 25}>{row.time_period}</text>
                  </g>
                );
              })}
          </g>
        ) : null}

        {selectedSubView === 'vehicle' ? (
          <g>
            <line className="map-inset-axis" x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} />
            <line className="map-inset-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} />
            {vehicleRows.slice(0, 8).map((row, index) => {
              const selection = vehicleSelection(row);
              const rowH = plotH / Math.max(4, Math.min(vehicleRows.length, 8));
              const x = scaleLinear(row.avg_delivery_duration_min, vehicleXDomain, [PAD.left + 12, PAD.left + plotW - 28]);
              const y = PAD.top + rowH * index + rowH / 2;
              const r = 7 + clamp(row.order_count / maxOrders) * 15;
              const active = selectedId === selection.item.id;
              const curRow = currentVehicleRows.find((v) => v.vehicle_type === row.vehicle_type);

              return (
                <g
                  key={selection.item.id}
                  className={`map-inset-bubble-node${active ? ' is-active' : ''}`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  role="button"
                  tabIndex={0}
                  onMouseMove={(event) => onHover(selection, event)}
                  onMouseLeave={onLeave}
                  onBlur={onLeave}
                  onKeyDown={(event) => keySelect(event, selection, onSelect)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(selection);
                  }}
                >
                  <line className="map-inset-grid-line" x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} />
                  <rect className="map-inset-hit-area" x={PAD.left} y={y - rowH / 2 + 4} width={plotW} height={rowH - 8} rx={8} />
                  <text className="map-inset-category" x={x} y={y - r - 8} textAnchor="middle">{row.vehicle_type}</text>
                  {/* Baseline bubble (always visible, full color) */}
                  <circle cx={x} cy={y} r={r} fill={colorByRate(row.delay_rate)} opacity={0.76} />
                  <text className="map-inset-value" x={Math.min(PAD.left + plotW - 34, x + r + 10)} y={y + 4}>{fmt(row.avg_delivery_duration_min, 1)}m</text>
                  {/* Current time period bubble (beside baseline, not overlapping) */}
                  {curRow && isTimeFiltered && (() => {
                    const curX = scaleLinear(curRow.avg_delivery_duration_min, vehicleXDomain, [PAD.left + 12, PAD.left + plotW - 28]);
                    const maxCurOrders = Math.max(1, ...currentVehicleRows.map(v => v.order_count));
                    const curR = 5 + clamp(curRow.order_count / maxCurOrders) * 10;
                    const curColor = curRow.avg_delivery_duration_min < row.avg_delivery_duration_min * 0.97 ? '#10b981'
                      : curRow.avg_delivery_duration_min > row.avg_delivery_duration_min * 1.03 ? '#ef4444'
                      : '#64748b';
                    return (
                      <>
                        <circle cx={curX} cy={y - r - 18} r={curR} fill={curColor} opacity={0.85} />
                        <text className="map-inset-value" x={curX} y={y - r - 18 - curR - 4} textAnchor="middle" fill={curColor} fontWeight={800} fontSize="10">
                          {fmt(curRow.avg_delivery_duration_min, 1)}m
                        </text>
                      </>
                    );
                  })()}
                </g>
              );
            })}
            <text className="map-inset-label" x={PAD.left + plotW - 60} y={PAD.top + plotH + 34}>avg_delivery_duration_min</text>
          </g>
        ) : null}

        {selectedSubView === 'risk' ? (() => {
          // Pre-compute bubble positions for label collision avoidance
          const bubblePositions = riskRowsForChart.map((row, index) => {
            const xBase = scaleLinear(row.avg_delivery_duration_min, riskXDomain, [RISK_PAD.left + 12, RISK_PAD.left + riskPlotW - 12]);
            const yBase = scaleLinear(rate(row.delay_rate), riskYDomain, [RISK_PAD.top + riskPlotH - 12, RISK_PAD.top + 12]);
            const bx = clamp(xBase + deterministicOffset(row.scenario_id, index, 8), RISK_PAD.left + 12, RISK_PAD.left + riskPlotW - 12);
            const by = clamp(yBase + deterministicOffset(row.label, index, 7), RISK_PAD.top + 12, RISK_PAD.top + riskPlotH - 12);
            const br = 7 + clamp(row.order_count / maxOrders) * 15;
            return { x: bx, y: by, r: br };
          });

          // Compute label positions with collision avoidance
          const LABEL_H = 14;
          const placedLabels: Array<{ x: number; y: number; w: number }> = [];
          const labelPositions = riskRowsForChart.map((row, index) => {
            if (index >= 5) return null;
            const { x, y, r } = bubblePositions[index];
            const label = shortRiskLabel(row);
            const labelW = Math.min(label.length * 7, 90);
            const preferRight = x < RISK_PAD.left + riskPlotW * 0.55;
            const desiredX = preferRight ? x + r + 8 : x - r - labelW - 4;
            let desiredY = y + 4;

            // Push down to avoid overlapping with previously placed labels
            for (const prev of placedLabels) {
              const xClose = desiredX < prev.x + prev.w + 4 && desiredX + labelW > prev.x - 4;
              const yClose = Math.abs(desiredY - prev.y) < LABEL_H;
              if (xClose && yClose) {
                desiredY = prev.y + LABEL_H + 2;
              }
            }

            // Clamp within plot area
            desiredY = clamp(desiredY, RISK_PAD.top + 10, RISK_PAD.top + riskPlotH - 6);

            placedLabels.push({ x: desiredX, y: desiredY, w: labelW });
            return { x: desiredX, y: desiredY, w: labelW, text: label, anchor: preferRight ? 'start' : 'end', bubbleX: x, bubbleY: y, bubbleR: r };
          });

          return (
            <g>
              <rect className="map-inset-plot-bg" x={RISK_PAD.left} y={RISK_PAD.top} width={riskPlotW} height={riskPlotH} rx={10} />
              <line className="map-inset-axis" x1={RISK_PAD.left} y1={RISK_PAD.top + riskPlotH} x2={RISK_PAD.left + riskPlotW} y2={RISK_PAD.top + riskPlotH} />
              <line className="map-inset-axis" x1={RISK_PAD.left} y1={RISK_PAD.top} x2={RISK_PAD.left} y2={RISK_PAD.top + riskPlotH} />

              {/* Leader lines for labeled bubbles */}
              {labelPositions.map((lp, i) => {
                if (!lp) return null;
                const { x: bx, y: by, r: br } = bubblePositions[i];
                const lx = lp.anchor === 'start' ? lp.x : lp.x + lp.w;
                const ly = lp.y - 3;
                // Only draw leader line if label moved significantly from bubble
                if (Math.abs(ly - by) < br + 6) return null;
                return (
                  <line
                    key={`leader-${i}`}
                    x1={bx + (lp.anchor === 'start' ? br : -br)}
                    y1={by}
                    x2={lx}
                    y2={ly}
                    stroke="#94a3b8"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                );
              })}

              {riskRowsForChart.map((row, index) => {
                const selection = riskSelection(row);
                const { x, y, r } = bubblePositions[index];
                const active = selectedId === selection.item.id;
                const lp = labelPositions[index];
                return (
                  <g
                    key={selection.item.id}
                    className={`map-inset-risk-node${active ? ' is-active' : ''}`}
                    style={{ animationDelay: `${index * 0.06}s` }}
                    role="button"
                    tabIndex={0}
                    onMouseMove={(event) => onHover(selection, event)}
                    onMouseLeave={onLeave}
                    onBlur={onLeave}
                    onKeyDown={(event) => keySelect(event, selection, onSelect)}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(selection);
                    }}
                  >
                    <circle className="map-inset-hit-dot" cx={x} cy={y} r={Math.max(18, r + 8)} />
                    <circle cx={x} cy={y} r={r} fill={colorByRate(row.risk_score)} opacity={0.68} />
                    {lp ? (
                      <text
                        className="map-inset-label-text"
                        x={lp.anchor === 'start' ? lp.x : lp.x + lp.w}
                        y={lp.y}
                        textAnchor={lp.anchor as 'start' | 'end'}
                      >
                        {lp.text}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              <text className="map-inset-label" x={RISK_PAD.left + riskPlotW - 70} y={RISK_PAD.top + riskPlotH + 38}>avg_delivery_duration_min</text>
              <text className="map-inset-label" x={28} y={RISK_PAD.top + 18}>delay_rate</text>
            </g>
          );
        })() : null}

        {selectedSubView === 'orders' ? (
          <g>
            <line className="map-inset-axis" x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} />
            <line className="map-inset-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} />
            <line
              className="map-inset-reference"
              x1={PAD.left}
              y1={scaleLinear(32, orderYDomain, [PAD.top + plotH, PAD.top])}
              x2={PAD.left + plotW}
              y2={scaleLinear(32, orderYDomain, [PAD.top + plotH, PAD.top])}
            />
            <text className="map-inset-note" x={PAD.left + plotW - 34} y={scaleLinear(32, orderYDomain, [PAD.top + plotH, PAD.top]) - 8}>32 min</text>
            {ordersSample.map((point, index) => {
              const selection = orderSelection(point);
              const x = scaleLinear(point.distance_km, orderXDomain, [PAD.left + 8, PAD.left + plotW - 8]);
              const y = scaleLinear(point.delivery_duration_min, orderYDomain, [PAD.top + plotH - 8, PAD.top + 8]);
              const active = selectedId === point.id;
              return (
                <g
                  key={point.id}
                  className={`map-inset-order-point${active ? ' is-active' : ''}${point.is_delayed ? ' is-delayed' : ''}`}
                  style={{ animationDelay: `${Math.min(index * 0.012, 2.0)}s` }}
                  role="button"
                  tabIndex={0}
                  onMouseMove={(event) => onHover(selection, event)}
                  onMouseLeave={onLeave}
                  onBlur={onLeave}
                  onKeyDown={(event) => keySelect(event, selection, onSelect)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(selection);
                  }}
                >
                  <circle className="map-inset-hit-dot" cx={x} cy={y} r={9} />
                  <circle cx={x} cy={y} r={2.8 + clamp(point.risk_visual_score ?? 0) * 2.8} />
                </g>
              );
            })}
            <text className="map-inset-label" x={PAD.left + plotW - 52} y={PAD.top + plotH + 34}>distance_km</text>
            <text className="map-inset-label" x={24} y={PAD.top + 18}>min</text>
          </g>
        ) : null}
      </svg>
    </aside>
  );
}
