import { useMemo } from 'react';
import ScenarioScatterPlot from './ScenarioScatterPlot';
import { MapModule, ScenarioOrderPoint } from '../types/data';

interface ScenarioAnalysisDrawerProps {
  module: MapModule | null;
  open: boolean;
  selectedOrderId: string | null;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
}

const GLOBAL_AVG_DURATION = 42.1;
const GLOBAL_DELAY_RATE = 0.72;
const GLOBAL_AVG_DISTANCE = 7.2;

function formatNumber(value: number | undefined, digits = 1) {
  return typeof value === 'number' ? value.toFixed(digits) : '-';
}

function formatPercent(value: number | undefined) {
  return typeof value === 'number' ? `${(value * 100).toFixed(value > 0.95 ? 1 : 0)}%` : '-';
}

function riskLevel(module: MapModule) {
  const score = module.risk_score ?? module.delay_rate ?? 0;
  if (score >= 0.8) return 'High Risk';
  if (score >= 0.55) return 'Medium Risk';
  return 'Low Risk';
}

function conditionChips(module: MapModule) {
  return [
    ['Weather', module.weather],
    ['Traffic', module.traffic_density],
    ['Time', module.time_period],
    ['Vehicle', module.vehicle_type]
  ].filter((item): item is [string, string] => Boolean(item[1]));
}

function buildExplanation(module: MapModule) {
  const delay = module.delay_rate ?? 0;
  const parts = [module.weather, module.traffic_density, module.time_period, module.vehicle_type].filter(Boolean).join('、');
  if (delay > GLOBAL_DELAY_RATE) {
    return `该场景延迟率明显高于全局平均水平，可能由${parts || '当前配送条件'}共同构成，需要重点查看距离分布和订单样本。`;
  }
  return `该模块当前风险低于或接近全局水平，可作为对比基准观察${parts || '配送区域'}对 ETA 的影响。`;
}

function generateOrderPoints(module: MapModule): ScenarioOrderPoint[] {
  const baseDistance = module.avg_distance_km ?? GLOBAL_AVG_DISTANCE;
  const baseDuration = module.avg_delivery_duration_min ?? GLOBAL_AVG_DURATION;
  const delayRate = module.delay_rate ?? GLOBAL_DELAY_RATE;
  const offsets = [
    [-1.8, -7, false],
    [-1.1, -3, delayRate > 0.75],
    [-0.4, 2, delayRate > 0.5],
    [0.2, -1, delayRate > 0.8],
    [0.7, 5, true],
    [1.1, 8, true],
    [1.7, 12, true],
    [2.4, 16, true]
  ] as const;

  return offsets.map(([distanceOffset, durationOffset, delayed], index) => ({
    order_id: `${module.id.slice(0, 4).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    distance_km: Math.max(1.2, Number((baseDistance + distanceOffset).toFixed(1))),
    delivery_duration_min: Math.max(12, Number((baseDuration + durationOffset).toFixed(1))),
    is_delayed: delayed || index / offsets.length < delayRate,
    weather: module.weather,
    traffic_density: module.traffic_density,
    vehicle_type: module.vehicle_type,
    time_period: module.time_period,
    delivery_person_ratings: Number((4.6 - index * 0.08).toFixed(1))
  }));
}

function factorSummary(module: MapModule) {
  const factors = [
    {
      factor: 'traffic_density',
      value: module.traffic_density,
      description:
        module.traffic_density === 'Jam'
          ? '堵塞交通会直接增加在途时间，是该场景最强的 ETA 风险来源。'
          : '交通压力会影响路线稳定性和配送时长。'
    },
    {
      factor: 'time_period',
      value: module.time_period,
      description:
        module.time_period === 'night'
          ? '夜间配送订单量较少，但天气和路况叠加时延迟率容易偏高。'
          : '该时段影响骑手供给、订单密度和道路通行状态。'
    },
    {
      factor: 'weather',
      value: module.weather,
      description: module.weather ? '天气会改变骑手速度、可见度和路线风险。' : '该模块未绑定明确天气，可作为区域或节点风险观察。'
    },
    {
      factor: 'vehicle_type',
      value: module.vehicle_type,
      description: module.vehicle_type ? '车辆类型影响短途响应和复杂路况下的稳定性。' : '该模块未绑定特定车辆类型。'
    }
  ];

  const base = module.risk_score ?? module.delay_rate ?? 0.45;
  return factors
    .filter((item) => item.value)
    .map((item, index) => ({
      ...item,
      weight: Math.max(0.18, Math.min(0.96, base - index * 0.12 + (item.factor === 'traffic_density' ? 0.12 : 0)))
    }));
}

function CompareBar({ label, current, global, unit, percent }: { label: string; current: number; global: number; unit?: string; percent?: boolean }) {
  const max = Math.max(current, global, 1);
  const currentWidth = Math.min(100, (current / max) * 100);
  const globalWidth = Math.min(100, (global / max) * 100);

  return (
    <div className="analysis-compare-row">
      <div className="analysis-compare-label">
        <strong>{label}</strong>
        <span>
          当前 {percent ? `${(current * 100).toFixed(1)}%` : `${current.toFixed(1)} ${unit ?? ''}`} / 全局{' '}
          {percent ? `${(global * 100).toFixed(1)}%` : `${global.toFixed(1)} ${unit ?? ''}`}
        </span>
      </div>
      <div className="analysis-bars">
        <span className="analysis-bar analysis-bar-current" style={{ width: `${currentWidth}%` }} />
        <span className="analysis-bar analysis-bar-global" style={{ width: `${globalWidth}%` }} />
      </div>
    </div>
  );
}

export default function ScenarioAnalysisDrawer({ module, open, selectedOrderId, onClose, onSelectOrder }: ScenarioAnalysisDrawerProps) {
  const orderPoints = useMemo(() => (module ? generateOrderPoints(module) : []), [module]);
  const selectedOrder = orderPoints.find((point) => point.order_id === selectedOrderId) ?? orderPoints[0];
  const factors = useMemo(() => (module ? factorSummary(module) : []), [module]);

  if (!open || !module) return null;

  const avgDuration = module.avg_delivery_duration_min ?? GLOBAL_AVG_DURATION;
  const delayRate = module.delay_rate ?? GLOBAL_DELAY_RATE;
  const avgDistance = module.avg_distance_km ?? GLOBAL_AVG_DISTANCE;

  return (
    <aside className="scenario-analysis-drawer" aria-label="Scenario Analysis Drawer">
      <div className="drawer-header">
        <div>
          <span>Scenario Analysis</span>
          <h2>场景详情分析</h2>
        </div>
        <button type="button" aria-label="关闭场景分析" onClick={onClose}>
          ×
        </button>
      </div>

      <section className="analysis-section analysis-overview">
        <div className="analysis-title-row">
          <div>
            <h3>{module.label}</h3>
            <p>{module.description ?? '选中模块的配送运行状态分析。'}</p>
          </div>
          <strong className={`risk-pill risk-${riskLevel(module).toLowerCase().replace(' ', '-')}`}>{riskLevel(module)}</strong>
        </div>
        <div className="analysis-chips">
          {conditionChips(module).map(([label, value]) => (
            <span key={label}>
              {label}: {value}
            </span>
          ))}
        </div>
        <div className="analysis-kpi-grid">
          <div>
            <span>订单数</span>
            <strong>{module.order_count ?? '-'}</strong>
          </div>
          <div>
            <span>平均配送时长</span>
            <strong>{formatNumber(avgDuration)} min</strong>
          </div>
          <div>
            <span>延迟率</span>
            <strong>{formatPercent(delayRate)}</strong>
          </div>
          <div>
            <span>平均距离</span>
            <strong>{formatNumber(avgDistance)} km</strong>
          </div>
          <div>
            <span>风险评分</span>
            <strong>{formatNumber(module.risk_score, 2)}</strong>
          </div>
        </div>
        <p className="analysis-explanation">{buildExplanation(module)}</p>
      </section>

      <section className="analysis-section">
        <h3>与全局平均对比</h3>
        <CompareBar label="平均配送时长" current={avgDuration} global={GLOBAL_AVG_DURATION} unit="min" />
        <CompareBar label="延迟率" current={delayRate} global={GLOBAL_DELAY_RATE} percent />
        <CompareBar label="平均距离" current={avgDistance} global={GLOBAL_AVG_DISTANCE} unit="km" />
      </section>

      <section className="analysis-section">
        <div className="analysis-title-row compact">
          <h3>距离-配送时间散点图</h3>
          <span className="scatter-legend">橙色表示 delayed</span>
        </div>
        <ScenarioScatterPlot
          points={orderPoints}
          selectedOrderId={selectedOrderId}
          scenarioAvgDuration={avgDuration}
          globalAvgDuration={GLOBAL_AVG_DURATION}
          onSelectOrder={onSelectOrder}
        />
      </section>

      <section className="analysis-section">
        <h3>风险因素拆解</h3>
        <div className="factor-list">
          {factors.map((factor) => (
            <div className="factor-item" key={factor.factor}>
              <div>
                <strong>
                  {factor.factor}: {factor.value}
                </strong>
                <p>{factor.description}</p>
              </div>
              <span className="factor-bar">
                <span style={{ width: `${factor.weight * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="analysis-section">
        <h3>样例订单</h3>
        <div className="order-table" role="table" aria-label="样例订单表">
          <div className="order-row order-head" role="row">
            <span>order_id</span>
            <span>distance</span>
            <span>duration</span>
            <span>weather</span>
            <span>traffic</span>
            <span>vehicle</span>
            <span>delayed</span>
          </div>
          {orderPoints.map((point) => (
            <button
              key={point.order_id}
              className={`order-row${selectedOrderId === point.order_id ? ' is-selected' : ''}`}
              type="button"
              role="row"
              onClick={() => onSelectOrder(point.order_id)}
            >
              <span>{point.order_id}</span>
              <span>{point.distance_km.toFixed(1)} km</span>
              <span>{point.delivery_duration_min.toFixed(1)} min</span>
              <span>{point.weather ?? '-'}</span>
              <span>{point.traffic_density ?? '-'}</span>
              <span>{point.vehicle_type ?? '-'}</span>
              <span>{point.is_delayed ? 'yes' : 'no'}</span>
            </button>
          ))}
        </div>

        {selectedOrder ? (
          <div className="order-detail">
            <strong>Order Detail · {selectedOrder.order_id}</strong>
            <p>
              {selectedOrder.distance_km.toFixed(1)} km · {selectedOrder.delivery_duration_min.toFixed(1)} min ·{' '}
              {selectedOrder.vehicle_type ?? 'vehicle unknown'} · {selectedOrder.is_delayed ? 'delayed' : 'on time'}
            </p>
            <span>rider rating {selectedOrder.delivery_person_ratings?.toFixed(1) ?? '-'}</span>
          </div>
        ) : null}
      </section>
    </aside>
  );
}
