import { MapSelection } from '../types/data';

interface ETARiskTicketProps {
  selection: MapSelection | null;
  onClose: () => void;
  onOpenAnalysis?: () => void;
}

const DELAY_THRESHOLD_MIN = 32;

const WEATHER_LABELS: Record<string, string> = {
  All: '全部天气',
  Sunny: '晴天',
  Cloudy: '多云',
  Fog: '雾天',
  Foggy: '雾天',
  Windy: '大风',
  Stormy: '暴雨',
  Rainy: '暴雨',
  Sandstorms: '沙尘',
  Sandstorm: '沙尘',
  Unknown: '未知天气'
};

const TRAFFIC_LABELS: Record<string, string> = {
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵',
  Unknown: '未知交通'
};

const TIME_LABELS: Record<string, string> = {
  All: '全部时段',
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间',
  Unknown: '未知时段'
};

const VEHICLE_LABELS: Record<string, string> = {
  scooter: '踏板车',
  electric_scooter: '电动车',
  motorcycle: '摩托车',
  bicycle: '自行车',
  Unknown: '未知载具'
};

type TicketKind = 'order' | 'scenario' | 'weather';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ImpactLevel = '低' | '中' | '中高' | '高';

interface TicketModel {
  kind: TicketKind;
  title: string;
  identifier?: string;
  status: 'DELAYED' | 'AT RISK' | 'ON TIME';
  statusLabel: string;
  riskLevel: RiskLevel;
  riskLabel: string;
  riskScore: number;
  duration?: number;
  overTime?: number;
  orderCount?: number;
  delayRate?: number;
  distance?: number;
  weather?: string;
  traffic?: string;
  timePeriod?: string;
  vehicle?: string;
  details: Array<[string, string | undefined]>;
  sources: Array<{ label: string; level: ImpactLevel }>;
  note: string;
}

function normalizeRate(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

function formatNumber(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function formatPercent(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(normalizeRate(value) * 100)}%` : '-';
}

function weatherLabel(value: string | null | undefined) {
  return WEATHER_LABELS[value ?? ''] ?? value ?? undefined;
}

function trafficLabel(value: string | null | undefined) {
  return TRAFFIC_LABELS[value ?? ''] ?? value ?? undefined;
}

function timeLabel(value: string | null | undefined) {
  return TIME_LABELS[value ?? ''] ?? value ?? undefined;
}

function vehicleLabel(value: string | null | undefined) {
  return VEHICLE_LABELS[value ?? ''] ?? value ?? undefined;
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.35) return 'medium';
  return 'low';
}

function riskLabel(level: RiskLevel) {
  const labels: Record<RiskLevel, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险'
  };
  return labels[level];
}

function statusFor(duration: number | undefined) {
  if (typeof duration !== 'number') return { status: 'AT RISK' as const, statusLabel: '需关注' };
  if (duration > DELAY_THRESHOLD_MIN) return { status: 'DELAYED' as const, statusLabel: '已延迟' };
  if (duration >= 28) return { status: 'AT RISK' as const, statusLabel: '临近延迟' };
  return { status: 'ON TIME' as const, statusLabel: '正常' };
}

function safeRiskScore(item: object) {
  if ('risk_score' in item && typeof item.risk_score === 'number') return normalizeRate(item.risk_score);
  if ('delay_rate' in item && typeof item.delay_rate === 'number') return normalizeRate(item.delay_rate);
  if ('delivery_duration_min' in item && typeof item.delivery_duration_min === 'number') {
    return Math.max(0, Math.min(1, (item.delivery_duration_min - 18) / 42));
  }
  if ('avg_delivery_duration_min' in item && typeof item.avg_delivery_duration_min === 'number') {
    return Math.max(0, Math.min(1, (item.avg_delivery_duration_min - 18) / 42));
  }
  return 0.18;
}

function durationFor(item: object) {
  if ('delivery_duration_min' in item && typeof item.delivery_duration_min === 'number') return item.delivery_duration_min;
  if ('avg_delivery_duration_min' in item && typeof item.avg_delivery_duration_min === 'number') return item.avg_delivery_duration_min;
  return undefined;
}

function orderIdFor(item: object) {
  if ('order_id' in item && typeof item.order_id === 'string') return item.order_id;
  if ('id' in item && typeof item.id === 'string') return item.id;
  return undefined;
}

function scenarioTitle(item: object) {
  const parts = [
    'weather' in item ? weatherLabel(item.weather as string | undefined) : undefined,
    'traffic_density' in item ? trafficLabel(item.traffic_density as string | undefined) : undefined,
    'time_period' in item ? timeLabel(item.time_period as string | undefined) : undefined,
    'vehicle_type' in item ? vehicleLabel(item.vehicle_type as string | undefined) : undefined
  ].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if ('label' in item && typeof item.label === 'string') return item.label;
  return '风险组合';
}

function impactClass(level: ImpactLevel) {
  if (level === '高') return 'high';
  if (level === '中高') return 'midhigh';
  if (level === '中') return 'medium';
  return 'low';
}

function riskSources(model: {
  weather?: string;
  traffic?: string;
  timePeriod?: string;
  vehicle?: string;
  distance?: number;
  duration?: number;
}): Array<{ label: string; level: ImpactLevel }> {
  const sources: Array<{ label: string; level: ImpactLevel }> = [];
  const weather = model.weather;
  const traffic = model.traffic;
  const time = model.timePeriod;
  const vehicle = model.vehicle;

  if (weather) {
    const high = ['暴雨', '沙尘'].includes(weather);
    const midHigh = ['雾天', '大风'].includes(weather);
    sources.push({ label: `${weather}天气`, level: high ? '高' : midHigh ? '中高' : '低' });
  }

  if (traffic) {
    sources.push({
      label: `${traffic}交通`,
      level: traffic === '拥堵' ? '高' : traffic === '高密度' ? '中高' : traffic === '中密度' ? '中' : '低'
    });
  }

  if (typeof model.distance === 'number') {
    sources.push({
      label: `配送距离 ${formatNumber(model.distance, 1)} 公里`,
      level: model.distance > 10 ? '高' : model.distance > 6 ? '中高' : model.distance > 3 ? '中' : '低'
    });
  }

  if (time) {
    sources.push({
      label: `${time}时段`,
      level: time === '午高峰' || time === '晚高峰' ? '中高' : time === '夜间' ? '中' : '低'
    });
  }

  if (vehicle) {
    const harshWeather = weather && ['暴雨', '沙尘', '雾天', '大风'].includes(weather);
    sources.push({
      label: vehicle,
      level: vehicle === '自行车' && harshWeather ? '中高' : vehicle === '踏板车' && harshWeather ? '中' : '低'
    });
  }

  if (typeof model.duration === 'number' && model.duration > DELAY_THRESHOLD_MIN) {
    sources.unshift({ label: `配送超时 ${formatNumber(model.duration - DELAY_THRESHOLD_MIN, 1)} 分钟`, level: '高' });
  }

  return sources.slice(0, 5);
}

function riskNote(model: Pick<TicketModel, 'kind' | 'duration' | 'overTime' | 'weather' | 'traffic' | 'distance' | 'timePeriod' | 'vehicle' | 'orderCount' | 'delayRate'>) {
  const delayed = typeof model.overTime === 'number' && model.overTime > 0;
  const prefix = delayed && typeof model.duration === 'number'
    ? `${model.kind === 'scenario' ? '该场景平均配送时长' : model.kind === 'weather' ? '该天气下平均配送时长' : '该订单配送时长'}为 ${formatNumber(model.duration, 1)} 分钟，已超过 ${DELAY_THRESHOLD_MIN} 分钟延迟阈值 ${formatNumber(model.overTime, 1)} 分钟。`
    : `${model.kind === 'scenario' ? '该场景' : model.kind === 'weather' ? '该天气模块' : '该订单'}当前低于 ${DELAY_THRESHOLD_MIN} 分钟延迟阈值，但仍需关注 ETA 波动。`;

  const causes: string[] = [];
  if (model.weather === '暴雨') causes.push('暴雨可能导致道路通行不稳定和骑手速度下降');
  else if (model.weather === '大风') causes.push('大风会降低骑行速度和路线稳定性');
  else if (model.weather === '雾天') causes.push('雾天能见度下降，骑手通常更保守');
  else if (model.weather === '沙尘') causes.push('沙尘会恶化道路环境并拖慢骑行');

  if (model.traffic === '拥堵') causes.push('拥堵会增加等待与绕行时间');
  else if (model.traffic === '高密度') causes.push('高密度交通会放大局部延迟');

  if (typeof model.distance === 'number' && model.distance > 6) causes.push('配送距离偏长增加在途不确定性');
  if (model.timePeriod === '午高峰' || model.timePeriod === '晚高峰') causes.push('高峰时段订单压力更集中');
  if (model.kind === 'scenario' && model.orderCount) causes.push(`${model.orderCount} 单样本共同指向该组合风险`);
  if (model.kind === 'weather' && typeof model.delayRate === 'number') causes.push(`该天气延迟率为 ${formatPercent(model.delayRate)}`);

  return causes.length ? `${prefix}${causes.slice(0, 2).join('，')}。` : prefix;
}

function buildTicketModel(selection: MapSelection): TicketModel {
  const item = selection.item;
  const riskScore = safeRiskScore(item);
  const riskLevel = getRiskLevel(riskScore);
  const duration = durationFor(item);
  const overTime = typeof duration === 'number' ? duration - DELAY_THRESHOLD_MIN : undefined;
  const { status, statusLabel } = statusFor(duration);
  const weather = 'weather' in item ? weatherLabel(item.weather) : undefined;
  const traffic = 'traffic_density' in item ? trafficLabel(item.traffic_density) : undefined;
  const timePeriod = 'time_period' in item ? timeLabel(item.time_period) : undefined;
  const vehicle = 'vehicle_type' in item ? vehicleLabel(item.vehicle_type) : undefined;
  const distance = 'distance_km' in item && typeof item.distance_km === 'number' ? item.distance_km : undefined;
  const orderCount = 'order_count' in item && typeof item.order_count === 'number' ? item.order_count : undefined;
  const delayRate = 'delay_rate' in item && typeof item.delay_rate === 'number' ? normalizeRate(item.delay_rate) : undefined;
  const kind: TicketKind = selection.type === 'order_dot'
    ? 'order'
    : selection.type === 'module' && selection.item.type === 'weather'
      ? 'weather'
      : selection.type === 'scene_hotspot' && selection.item.weather && !selection.item.traffic_density
        ? 'weather'
        : 'scenario';

  const base = { weather, traffic, timePeriod, vehicle, distance, duration };
  const title = kind === 'order'
    ? '外卖订单风险小票'
    : kind === 'weather'
      ? '天气风险小票'
      : '风险场景小票';
  const identifier = kind === 'order'
    ? orderIdFor(item)
    : kind === 'weather'
      ? weather
      : scenarioTitle(item);

  const details: Array<[string, string | undefined]> = kind === 'order'
    ? [
      ['配送距离', typeof distance === 'number' ? `${formatNumber(distance, 1)} 公里` : undefined],
      ['配送时长', typeof duration === 'number' ? `${formatNumber(duration, 1)} 分钟` : undefined],
      ['延迟阈值', `${DELAY_THRESHOLD_MIN.toFixed(1)} 分钟`],
      ['延迟状态', statusLabel],
      ['延迟率', delayRate !== undefined ? formatPercent(delayRate) : status === 'DELAYED' ? '100%' : '0%']
    ]
    : [
      ['订单量', orderCount ? `${formatNumber(orderCount)} 单` : undefined],
      [kind === 'weather' ? '平均配送时长' : '平均配送时长', typeof duration === 'number' ? `${formatNumber(duration, 1)} 分钟` : undefined],
      ['延迟阈值', `${DELAY_THRESHOLD_MIN.toFixed(1)} 分钟`],
      ['延迟率', delayRate !== undefined ? formatPercent(delayRate) : undefined]
    ];

  const sources = riskSources(base);
  const note = riskNote({ kind, duration, overTime, weather, traffic, distance, timePeriod, vehicle, orderCount, delayRate });

  return {
    kind,
    title,
    identifier,
    status,
    statusLabel,
    riskLevel,
    riskLabel: riskLabel(riskLevel),
    riskScore,
    duration,
    overTime,
    orderCount,
    delayRate,
    distance,
    weather,
    traffic,
    timePeriod,
    vehicle,
    details,
    sources,
    note
  };
}

function ReceiptRow({ label, value }: { label: string; value?: string }) {
  if (!value || value === '-') return null;
  return (
    <div className="eta-receipt-row">
      <span>{label}</span>
      <i aria-hidden="true" />
      <strong>{value}</strong>
    </div>
  );
}

export default function ETARiskTicket({ selection, onClose, onOpenAnalysis }: ETARiskTicketProps) {
  if (!selection) return null;

  const ticket = buildTicketModel(selection);
  const chips = [ticket.weather, ticket.traffic ? `${ticket.traffic}交通` : undefined, ticket.timePeriod, ticket.vehicle].filter(Boolean);
  const returnLabel = ticket.weather ? `返回${ticket.weather}订单` : '返回当前天气订单';

  return (
    <aside className={`eta-risk-ticket receipt-risk-${ticket.riskLevel}`} aria-label="FoodETA ETA 风险小票">
      <div className="eta-receipt-perf" aria-hidden="true" />
      <div className="eta-ticket-head">
        <div>
          <span>FOODETA DELIVERY</span>
          <h2>{ticket.title}</h2>
        </div>
        <button type="button" aria-label="关闭 ETA 风险小票" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="eta-receipt-idline">
        <div>
          <small>{ticket.kind === 'order' ? 'ORDER' : ticket.kind === 'weather' ? 'WEATHER' : 'SCENARIO'}</small>
          <strong>{ticket.kind === 'order' ? `#${ticket.identifier ?? 'UNKNOWN'}` : ticket.identifier}</strong>
        </div>
        <em className="eta-risk-stamp">{ticket.riskLabel}</em>
      </div>

      <div className="eta-receipt-status">
        <span>{ticket.status}</span>
        <strong>{ticket.statusLabel}</strong>
      </div>

      {chips.length ? (
        <div className="eta-ticket-conditions" aria-label="配送条件">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      ) : null}

      <section className="eta-total-block" aria-label="核心 ETA">
        <span>ETA TOTAL</span>
        <strong>{formatNumber(ticket.duration, 1)} 分钟</strong>
        {typeof ticket.overTime === 'number' ? (
          <em className={ticket.overTime > 0 ? 'is-delayed' : 'is-early'}>
            {ticket.overTime > 0
              ? `超过延迟阈值 +${formatNumber(ticket.overTime, 1)} 分钟`
              : `低于延迟阈值 ${formatNumber(Math.abs(ticket.overTime), 1)} 分钟`}
          </em>
        ) : (
          <em>缺少配送时长数据</em>
        )}
      </section>

      <section className="eta-receipt-section" aria-label="订单风险明细">
        <h3>ETA 明细</h3>
        <div className="eta-ticket-metrics">
          {ticket.details.map(([label, value]) => (
            <ReceiptRow key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      {ticket.sources.length ? (
        <section className="eta-receipt-section" aria-label="风险来源">
          <h3>风险来源</h3>
          <div className="eta-risk-source-list">
            {ticket.sources.map((source) => (
              <div key={source.label} className="eta-risk-source-row">
                <span>{source.label}</span>
                <i aria-hidden="true" />
                <strong className={`impact-${impactClass(source.level)}`}>{source.level}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="eta-risk-note" aria-label="风险备注">
        <strong>风险备注</strong>
        <p>{ticket.note}</p>
      </section>

      <div className="eta-ticket-actions">
        {onOpenAnalysis ? (
          <button className="eta-ticket-action is-primary" type="button" onClick={onOpenAnalysis}>
            查看完整分析
          </button>
        ) : null}
        <button className="eta-ticket-action is-secondary" type="button" onClick={onClose}>
          {returnLabel}
        </button>
      </div>

      <p className="eta-receipt-footer">ETA Risk Checked by FoodETA</p>
      <div className="eta-receipt-perf is-bottom" aria-hidden="true" />
    </aside>
  );
}
