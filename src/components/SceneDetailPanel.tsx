import { useEffect, useMemo, useState } from 'react';
import {
  loadSceneFilterSummary,
  loadRiskScenarioSummary,
  loadScenarioDistanceTimePoints
} from '../api/staticDataClient';
import { getMapSceneById } from '../data/mapScenes';
import { useInteraction } from '../store/interactionContext';
import type {
  DistanceTimePoint,
  RiskScenario,
  SceneFilterSummary
} from '../types/data';

/* ───────── scene filter logic ───────── */

function matchesScene(
  sceneId: string,
  item: { weather?: string | null; traffic_density?: string | null; time_period?: string | null }
): boolean {
  switch (sceneId) {
    case 'sunny':
      return item.weather === 'Sunny';
    case 'cloudy':
      return item.weather === 'Cloudy';
    case 'fog_business':
      return item.weather === 'Fog';
    case 'storm_area':
      return item.weather === 'Stormy';
    case 'sandstorm':
      return item.weather === 'Sandstorms';
    case 'windy':
      return item.weather === 'Windy';
    case 'night_low_peak':
      return item.time_period === 'night';
    case 'traffic_hub':
      return ['High', 'Jam'].includes(item.traffic_density ?? '');
    case 'dispatch_center':
    case 'restaurant_street':
    case 'mixed_food_community':
      return ['lunch_peak', 'dinner_peak'].includes(item.time_period ?? '');
    case 'high_risk_residential':
      return ['High', 'Jam'].includes(item.traffic_density ?? '');
    default:
      return true;
  }
}

/* ───────── helpers ───────── */

function fmt(v: number | undefined | null, d = 0): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : '–';
}

function pct(v: number | undefined | null): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '–';
  const n = v > 1 ? v / 100 : v;
  return `${Math.round(n * 100)}%`;
}

function barWidth(value: number, max: number): string {
  if (!max || !Number.isFinite(max)) return '0%';
  return `${Math.min(100, Math.round((value / max) * 100))}%`;
}

const TIME_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间'
};

/* ───────── Time Rhythm sub-component ───────── */

function TimeRhythmChart({ rows }: { rows: SceneFilterSummary[] }) {
  const maxOrders = Math.max(1, ...rows.map((r) => r.order_count));

  if (!rows.length) {
    return <p className="detail-empty">暂无时段数据</p>;
  }

  return (
    <div className="time-rhythm-bars">
      {rows.map((row) => (
        <div key={row.time_period ?? 'unknown'} className="rhythm-row">
          <span className="rhythm-label">{TIME_LABELS[row.time_period ?? ''] ?? row.time_period ?? '未知'}</span>
          <div className="rhythm-track">
            <div
              className="rhythm-fill"
              style={{
                width: barWidth(row.order_count, maxOrders),
                opacity: 0.35 + (row.delay_rate > 1 ? row.delay_rate / 100 : row.delay_rate) * 0.65
              }}
            />
          </div>
          <div className="rhythm-metrics">
            <strong>{row.order_count.toLocaleString()}</strong>
            <em>{fmt(row.avg_delivery_duration_min, 1)} min</em>
            <em className={row.delay_rate > 0.35 ? 'is-high' : ''}>{pct(row.delay_rate)}</em>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Risk Table sub-component ───────── */

function RiskTable({ scenarios }: { scenarios: RiskScenario[] }) {
  if (!scenarios.length) {
    return <p className="detail-empty">暂无匹配的风险场景</p>;
  }

  return (
    <div className="risk-table-wrap">
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
      {scenarios.map((s, i) => (
        <div key={s.scenario_id} className="risk-table-row">
          <span className="risk-rank">{i + 1}</span>
          <span>{s.weather ?? '–'}</span>
          <span>{s.traffic_density ?? '–'}</span>
          <span>{TIME_LABELS[s.time_period ?? ''] ?? s.time_period ?? '–'}</span>
          <span>{s.order_count}</span>
          <span>{fmt(s.avg_delivery_duration_min, 1)}</span>
          <span className={s.delay_rate > 0.5 ? 'is-high' : ''}>{pct(s.delay_rate)}</span>
          <span className="risk-score-cell">
            <i style={{ width: barWidth(s.risk_score, 1) }} />
            <em>{fmt(s.risk_score, 2)}</em>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Scatter Plot sub-component ───────── */

const SCATTER_W = 680;
const SCATTER_H = 320;
const SCATTER_PAD = 48;

function ScatterPlot({ points }: { points: DistanceTimePoint[] }) {
  const { xMax, yMax } = useMemo(() => {
    const xM = Math.max(1, ...points.map((p) => p.distance_km));
    const yM = Math.max(1, ...points.map((p) => p.delivery_duration_min));
    return { xMax: Math.ceil(xM / 2) * 2, yMax: Math.ceil(yM / 10) * 10 };
  }, [points]);

  const scaleX = (v: number) => SCATTER_PAD + (v / xMax) * (SCATTER_W - SCATTER_PAD * 2);
  const scaleY = (v: number) => SCATTER_H - SCATTER_PAD - (v / yMax) * (SCATTER_H - SCATTER_PAD * 2);

  // mean lines
  const meanDist = points.reduce((s, p) => s + p.distance_km, 0) / Math.max(1, points.length);
  const meanDur = points.reduce((s, p) => s + p.delivery_duration_min, 0) / Math.max(1, points.length);

  if (!points.length) {
    return <p className="detail-empty">暂无散点数据</p>;
  }

  return (
    <svg className="scene-scatter-svg" viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`} preserveAspectRatio="xMidYMid meet">
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={`gx-${t}`}
          x1={SCATTER_PAD + t * (SCATTER_W - SCATTER_PAD * 2)}
          y1={SCATTER_PAD}
          x2={SCATTER_PAD + t * (SCATTER_W - SCATTER_PAD * 2)}
          y2={SCATTER_H - SCATTER_PAD}
          className="scatter-grid-line"
        />
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={`gy-${t}`}
          x1={SCATTER_PAD}
          y1={SCATTER_PAD + t * (SCATTER_H - SCATTER_PAD * 2)}
          x2={SCATTER_W - SCATTER_PAD}
          y2={SCATTER_PAD + t * (SCATTER_H - SCATTER_PAD * 2)}
          className="scatter-grid-line"
        />
      ))}

      {/* mean lines */}
      <line x1={scaleX(meanDist)} y1={SCATTER_PAD} x2={scaleX(meanDist)} y2={SCATTER_H - SCATTER_PAD} className="scatter-mean-line" />
      <line x1={SCATTER_PAD} y1={scaleY(meanDur)} x2={SCATTER_W - SCATTER_PAD} y2={scaleY(meanDur)} className="scatter-mean-line" />
      <text x={scaleX(meanDist) + 4} y={SCATTER_PAD + 12} className="scatter-ref-label">均值</text>
      <text x={SCATTER_W - SCATTER_PAD - 30} y={scaleY(meanDur) - 4} className="scatter-ref-label">均值</text>

      {/* points */}
      {points.map((p) => (
        <circle
          key={p.order_id}
          cx={scaleX(p.distance_km)}
          cy={scaleY(p.delivery_duration_min)}
          r={p.is_delayed ? 3.2 : 2.4}
          className={`scatter-dot ${p.is_delayed ? 'is-delayed' : ''}`}
        />
      ))}

      {/* axes */}
      <line x1={SCATTER_PAD} y1={SCATTER_H - SCATTER_PAD} x2={SCATTER_W - SCATTER_PAD} y2={SCATTER_H - SCATTER_PAD} className="scatter-axis" />
      <line x1={SCATTER_PAD} y1={SCATTER_PAD} x2={SCATTER_PAD} y2={SCATTER_H - SCATTER_PAD} className="scatter-axis" />
      <text x={SCATTER_W / 2} y={SCATTER_H - 8} className="scatter-axis-label" textAnchor="middle">距离 (km)</text>
      <text x={14} y={SCATTER_H / 2} className="scatter-axis-label" textAnchor="middle" transform={`rotate(-90, 14, ${SCATTER_H / 2})`}>配送时长 (min)</text>

      {/* tick labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <text key={`tx-${t}`} x={SCATTER_PAD + t * (SCATTER_W - SCATTER_PAD * 2)} y={SCATTER_H - SCATTER_PAD + 16} className="scatter-tick" textAnchor="middle">
          {fmt(xMax * t, 0)}
        </text>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <text key={`ty-${t}`} x={SCATTER_PAD - 8} y={SCATTER_H - SCATTER_PAD - t * (SCATTER_H - SCATTER_PAD * 2) + 4} className="scatter-tick" textAnchor="end">
          {fmt(yMax * t, 0)}
        </text>
      ))}

      {/* legend */}
      <circle cx={SCATTER_W - SCATTER_PAD - 60} cy={SCATTER_PAD + 10} r={3.2} className="scatter-dot is-delayed" />
      <text x={SCATTER_W - SCATTER_PAD - 52} y={SCATTER_PAD + 14} className="scatter-tick">延迟</text>
      <circle cx={SCATTER_W - SCATTER_PAD - 60} cy={SCATTER_PAD + 26} r={2.4} className="scatter-dot" />
      <text x={SCATTER_W - SCATTER_PAD - 52} y={SCATTER_PAD + 30} className="scatter-tick">正常</text>
    </svg>
  );
}

/* ───────── Main Panel ───────── */

export default function SceneDetailPanel() {
  const { selectedSceneId } = useInteraction();
  const selectedScene = getMapSceneById(selectedSceneId);

  const [filterRows, setFilterRows] = useState<SceneFilterSummary[]>([]);
  const [scenarios, setScenarios] = useState<RiskScenario[]>([]);
  const [scatterPoints, setScatterPoints] = useState<DistanceTimePoint[]>([]);

  useEffect(() => {
    if (selectedSceneId === 'overall') return;

    let mounted = true;
    Promise.all([
      loadSceneFilterSummary(),
      loadRiskScenarioSummary(),
      loadScenarioDistanceTimePoints()
    ]).then(([filters, scats, points]) => {
      if (!mounted) return;
      setFilterRows(filters);
      setScenarios(scats);
      setScatterPoints(points);
    });

    return () => {
      mounted = false;
    };
  }, [selectedSceneId]);

  const sceneTimeRows = useMemo(
    () =>
      filterRows
        .filter((r) => r.scene_id === selectedSceneId && r.time_period !== 'All' && r.weather === 'All')
        .sort((a, b) => {
          const order = ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];
          return order.indexOf(a.time_period ?? '') - order.indexOf(b.time_period ?? '');
        }),
    [filterRows, selectedSceneId]
  );

  const sceneScenarios = useMemo(
    () =>
      scenarios
        .filter((s) => matchesScene(selectedSceneId, s))
        .slice(0, 8),
    [scenarios, selectedSceneId]
  );

  const sceneScatter = useMemo(
    () => scatterPoints.filter((p) => matchesScene(selectedSceneId, p)),
    [scatterPoints, selectedSceneId]
  );

  if (selectedSceneId === 'overall') return null;

  return (
    <div className="scene-detail-panel" id="scene-detail-panel">
      <div className="detail-header">
        <span className="detail-eyebrow">Detail Analysis</span>
        <h2>{selectedScene.title} · 详细数据</h2>
        <p>{selectedScene.description}</p>
      </div>

      <div className="detail-grid">
        <section className="detail-card" id="detail-time-rhythm">
          <h3>📊 时段配送节奏</h3>
          <p className="detail-card-desc">不同时间段的订单量、平均配送时长和延迟率分布</p>
          <TimeRhythmChart rows={sceneTimeRows} />
        </section>

        <section className="detail-card" id="detail-risk-scenarios">
          <h3>⚠️ 高风险场景 Top {sceneScenarios.length}</h3>
          <p className="detail-card-desc">当前场景条件下风险评分最高的天气 × 交通 × 时段组合</p>
          <RiskTable scenarios={sceneScenarios} />
        </section>

        <section className="detail-card detail-card-wide" id="detail-scatter">
          <h3>📍 距离-时长分布 ({sceneScatter.length.toLocaleString()} 订单)</h3>
          <p className="detail-card-desc">
            橙色点为延迟订单，绿色点为正常订单；虚线为均值参考线
          </p>
          <ScatterPlot points={sceneScatter} />
        </section>
      </div>
    </div>
  );
}
