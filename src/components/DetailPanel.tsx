import {
  Filters,
  OverviewSummary,
  RiskScenario,
  ScenarioOrderSample,
  TimePeriodSummary,
  WeatherTrafficSummary
} from '../types/data';
import { FILTER_ALL } from '../utils/constants';
import { formatNumber, formatPercent, labelOf } from '../utils/format';

export type DetailMode = 'guide' | 'scenario' | 'order' | 'time' | 'matrix';

interface DetailPanelProps {
  filters: Filters;
  mode: DetailMode;
  selectedScenario?: RiskScenario | null;
  selectedOrder?: ScenarioOrderSample | null;
  selectedTimePeriod?: TimePeriodSummary | null;
  selectedMatrix?: WeatherTrafficSummary | null;
  overview?: OverviewSummary | null;
  scenarioOrders: ScenarioOrderSample[];
  onSelectOrder: (order: ScenarioOrderSample) => void;
  onOpenScenarioDetail?: () => void;
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TicketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ComparisonBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const width = max > 0 ? Math.min(100, Math.max(4, (value / max) * 100)) : 0;
  return (
    <div className="comparison-row">
      <span>{label}</span>
      <div className="comparison-track">
        <i style={{ width: `${width}%` }} />
      </div>
      <strong>{max === 1 ? formatPercent(value) : formatNumber(value, 1)}</strong>
    </div>
  );
}

function BaselineComparisonBar({
  label,
  current,
  baseline,
  formatter
}: {
  label: string;
  current: number;
  baseline: number;
  formatter: (value: number) => string;
}) {
  const max = Math.max(current, baseline, 0.01);
  return (
    <div className="baseline-row">
      <div className="baseline-row-head">
        <span>{label}</span>
        <strong>
          当前 {formatter(current)} / 全局 {formatter(baseline)}
        </strong>
      </div>
      <div className="baseline-bars">
        <i className="current" style={{ width: `${Math.max(4, (current / max) * 100)}%` }} />
        <i className="baseline" style={{ width: `${Math.max(4, (baseline / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function activeFilterText(filters: Filters): string {
  const labels: Partial<Record<keyof Filters, string>> = {
    city: '城市',
    weather: '天气',
    traffic_density: '交通',
    time_period: '时段',
    vehicle_type: '载具',
    is_delayed: '延迟'
  };
  const active = (Object.entries(labels) as Array<[keyof Filters, string]>)
    .filter(([key]) => filters[key] !== FILTER_ALL)
    .map(([key, label]) => `${label}: ${filters[key]}`);
  return active.length ? active.join(' / ') : '全量订单';
}

function riskStatus(score: number | undefined): { label: string; className: string } {
  const value = score ?? 0;
  if (value >= 0.7) return { label: 'High Delay Risk', className: 'high' };
  if (value >= 0.42) return { label: 'Medium Delay Risk', className: 'medium' };
  return { label: 'Low Delay Risk', className: 'low' };
}

function deltaText(current: number, baseline: number, formatter: (value: number) => string): string {
  const delta = current - baseline;
  if (Math.abs(delta) < 0.001) return '与全局平均持平';
  return `比全局平均${delta > 0 ? '高' : '低'} ${formatter(Math.abs(delta))}`;
}

export default function DetailPanel({
  filters,
  mode,
  selectedScenario,
  selectedOrder,
  selectedTimePeriod,
  selectedMatrix,
  overview,
  scenarioOrders,
  onSelectOrder,
  onOpenScenarioDetail
}: DetailPanelProps) {
  const globalAvgDuration = overview?.avg_delivery_duration_min ?? selectedScenario?.avg_delivery_duration_min ?? 0;
  const globalDelayRate = overview?.delay_rate ?? selectedScenario?.delay_rate ?? 0;

  return (
    <aside className="side-panel detail-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Scene Summary</span>
          <h2>风险场景摘要</h2>
        </div>
      </div>

      <div className="detail-filter-chip">{activeFilterText(filters)}</div>

      {mode === 'guide' ? (
        <div className="detail-copy">
          <strong>FoodETA Risk Console</strong>
          <p>首页聚焦风险总览和重点入口。先从 Top Risk Scenarios 找到高延迟组合，再在这里查看摘要。</p>
          <p>完整分析按需打开，避免在首页堆叠过多图表和碎片化色块。</p>
        </div>
      ) : null}

      {mode === 'scenario' && selectedScenario ? (
        <div className="detail-stack">
          <div className={`status-card ${riskStatus(selectedScenario.risk_score).className}`}>
            <span>Risk Status</span>
            <strong>{riskStatus(selectedScenario.risk_score).label}</strong>
          </div>
          <div>
            <span className="detail-label">风险场景</span>
            <h3>{selectedScenario.label}</h3>
            <p className="detail-copy">
              {labelOf(selectedScenario.weather)} 天气叠加 {labelOf(selectedScenario.traffic_density)} 交通，
              {labelOf(selectedScenario.time_period)} 时段的延迟率为 {formatPercent(selectedScenario.delay_rate)}。
              {selectedScenario.delay_rate >= 0.5 ? '这是需要优先调度关注的高延迟组合。' : '当前延迟压力相对可控，可作为对照场景。'}
            </p>
          </div>
          <div className="summary-metrics">
            <TicketRow label="订单数" value={formatNumber(selectedScenario.order_count)} />
            <TicketRow label="平均配送时长" value={`${formatNumber(selectedScenario.avg_delivery_duration_min, 1)} min`} />
            <TicketRow label="延迟率" value={formatPercent(selectedScenario.delay_rate)} />
          </div>
          <div className="comparison-block">
            <span className="detail-label">摘要判断</span>
            <p className="delta-note">
              {deltaText(
                selectedScenario.avg_delivery_duration_min,
                globalAvgDuration,
                (value) => `${formatNumber(value, 1)} 分钟`
              )}
              ；{deltaText(selectedScenario.delay_rate, globalDelayRate, (value) => formatPercent(value))}。
            </p>
            <p className="detail-copy">
              当前可用样例订单 {formatNumber(scenarioOrders.length)} 条，完整散点图和订单表已移入详情分析。
            </p>
          </div>
          <button className="primary-detail-button" type="button" onClick={onOpenScenarioDetail}>
            查看完整分析
          </button>
        </div>
      ) : null}

      {mode === 'order' && selectedOrder ? (
        <div className="detail-stack">
          <div className={`status-card ${selectedOrder.is_delayed ? 'high' : 'low'}`}>
            <span>Order Status</span>
            <strong>{selectedOrder.is_delayed ? 'High Delay Risk' : 'Low Delay Risk'}</strong>
          </div>
          <div>
            <span className="detail-label">订单详情</span>
            <h3>{selectedOrder.order_id}</h3>
          </div>
          <dl className="detail-list">
            <div>
              <dt>城市 / 天气 / 交通</dt>
              <dd>
                {labelOf(selectedOrder.city)} / {labelOf(selectedOrder.weather)} / {labelOf(selectedOrder.traffic_density)}
              </dd>
            </div>
            <div>
              <dt>时段 / 载具</dt>
              <dd>
                {labelOf(selectedOrder.time_period)} / {labelOf(selectedOrder.vehicle_type)}
              </dd>
            </div>
            <div>
              <dt>距离与时长</dt>
              <dd>
                {formatNumber(selectedOrder.distance_km, 1)} km / {formatNumber(selectedOrder.delivery_duration_min, 1)} 分钟
              </dd>
            </div>
            <div>
              <dt>预测偏差</dt>
              <dd>{formatNumber(selectedOrder.delay_minutes, 1)} 分钟</dd>
            </div>
            <div>
              <dt>配送评分 / 多单数</dt>
              <dd>
                {formatNumber(selectedOrder.delivery_person_ratings, 1)} / {formatNumber(selectedOrder.multiple_deliveries)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {mode === 'time' && selectedTimePeriod ? (
        <div className="detail-stack">
          <div>
            <span className="detail-label">时段摘要</span>
            <h3>{labelOf(selectedTimePeriod.time_period)}</h3>
            <p className="detail-copy">
              该时段有 {formatNumber(selectedTimePeriod.order_count)} 单，平均配送{' '}
              {formatNumber(selectedTimePeriod.avg_delivery_duration_min, 1)} 分钟，延迟率{' '}
              {formatPercent(selectedTimePeriod.delay_rate)}。
            </p>
          </div>
          <div className="comparison-block">
            <ComparisonBar label="平均时长" value={selectedTimePeriod.avg_delivery_duration_min} max={80} />
            <ComparisonBar label="P75 时长" value={selectedTimePeriod.p75_delivery_duration_min ?? 0} max={80} />
            <ComparisonBar label="延迟率" value={selectedTimePeriod.delay_rate} />
          </div>
        </div>
      ) : null}

      {mode === 'matrix' && selectedMatrix ? (
        <div className="detail-stack">
          <div>
            <span className="detail-label">天气交通组合</span>
            <h3>
              {labelOf(selectedMatrix.weather)} × {labelOf(selectedMatrix.traffic_density)}
            </h3>
            <p className="detail-copy">
              组合延迟率为 {formatPercent(selectedMatrix.delay_rate)}，平均配送{' '}
              {formatNumber(selectedMatrix.avg_delivery_duration_min, 1)} 分钟。
            </p>
          </div>
          <div className="metric-pill-grid">
            <MetricPill label="订单量" value={formatNumber(selectedMatrix.order_count)} />
            <MetricPill label="平均距离" value={`${formatNumber(selectedMatrix.avg_distance_km, 1)}km`} />
            <MetricPill label="延迟率" value={formatPercent(selectedMatrix.delay_rate)} />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
