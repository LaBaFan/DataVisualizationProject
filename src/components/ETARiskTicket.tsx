import { MapSelection, OrderDot, TrafficSegment } from '../types/data';

interface ETARiskTicketProps {
  selection: MapSelection | null;
  onClose: () => void;
  onOpenAnalysis?: () => void;
}

function formatNumber(value: number | undefined, digits = 0) {
  return typeof value === 'number' ? value.toFixed(digits) : '-';
}

function formatPercent(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
}

function titleFor(selection: MapSelection) {
  if (selection.type === 'traffic_segment') return selection.item.node_kind ? '道路节点 / Road Node' : '道路状态 / Road Status';
  if (selection.type === 'order_dot') return '订单密度点 / Order Dot';
  if (selection.type === 'risk_pulse') return '高风险脉冲 / Risk Pulse';
  if (selection.type === 'metric_tag') return '微型指标 / Metric Tag';
  if (selection.type === 'risk_heat_halo') return '风险热晕 / Risk Halo';
  if (selection.type === 'delivery_flow_segment') return '配送流动 / Delivery Flow';

  const module = selection.item;
  if (module.type === 'risk_zone') return '风险场景 / Risk Zone';
  if (module.type === 'weather') return '天气影响 / Weather';
  if (module.type === 'road') return '交通路段 / Road';
  if (module.type === 'restaurant') return '餐厅节点 / Restaurant';
  if (module.type === 'building') return '建筑区域 / Building';
  if (module.type === 'customer_area') return '客户区域 / Customer Area';
  if (module.type === 'rider') return '骑手节点 / Rider';
  return '订单节点 / Order Point';
}

function explanationFor(selection: MapSelection) {
  if (selection.type === 'traffic_segment') {
    return selection.item.node_kind
      ? '该道路节点位于真实路口或出入口，常常是排队、汇流和转向引起的 ETA 风险放大点。'
      : '该道路段交通压力越高，通常意味着骑手在途时间增加，并会推高局部配送延迟风险。';
  }
  if (selection.type === 'order_dot') {
    return '该点表示订单或订单聚合位置，点大小映射订单压力或配送时长，橙红色表示高延迟风险。';
  }
  if (selection.type === 'risk_pulse') {
    return '脉冲圈表示该区域综合风险评分较高，建议进入完整分析查看距离-配送时长分布和因素拆解。';
  }
  if (selection.type === 'metric_tag') {
    return '微型指标标签用于在地图上快速标注局部延迟率和平均配送时长。';
  }
  if (selection.type === 'risk_heat_halo') {
    return '风险热晕用半径表达订单压力，用红橙透明度表达局部延迟风险，适合快速定位需要调度干预的区域。';
  }
  if (selection.type === 'delivery_flow_segment') {
    return '流动粒子表示当前筛选下的短距离配送方向和速度变化，只强调运行趋势，不绘制完整路线。';
  }

  const module = selection.item;
  if (module.type === 'risk_zone') {
    return '该区域对应一组高延迟风险条件，建议结合天气、交通、时段和车辆类型查看其对 ETA 的共同影响。';
  }
  if (module.type === 'weather') {
    return '该天气区域用于观察不同天气条件下的配送时长和延迟率变化。';
  }
  if (module.type === 'road') {
    return '该道路段表示主要交通压力，拥堵会增加骑手在途时间并推高延迟风险。';
  }
  if (module.type === 'restaurant') {
    return '该节点表示订单起点或调度区域，可用于定位高订单量起点带来的配送压力。';
  }
  if (module.type === 'customer_area') {
    return '该区域表示配送目的地聚集区，可用于判断末端配送距离和到达时间压力。';
  }
  return module.description ?? '点击模块后查看对应配送运行状态。';
}

function title(selection: MapSelection) {
  const item = selection.item;
  if ('label' in item) return item.label;
  return item.order_id ?? item.id;
}

function description(selection: MapSelection) {
  if (selection.type === 'module') return selection.item.description;
  if (selection.type === 'traffic_segment') {
    return selection.item.node_kind
      ? `${selection.item.traffic_density} node · ${formatPercent(selection.item.delay_rate)} delay`
      : `${selection.item.traffic_density} road · ${formatPercent(selection.item.delay_rate)} delay`;
  }
  if (selection.type === 'order_dot') return selection.item.is_delayed ? '高延迟订单/聚合点' : '普通订单/聚合点';
  if (selection.type === 'risk_pulse') return '高风险场景锚点';
  if (selection.type === 'risk_heat_halo') return '订单压力与延迟风险叠加区域';
  if (selection.type === 'delivery_flow_segment') return `${formatPercent(selection.item.delay_rate)} delay · speed ${formatNumber(selection.item.speed, 1)}`;
  return '区域关键指标标签';
}

function conditions(selection: MapSelection) {
  const item = selection.item;
  return [
    'weather' in item ? item.weather : undefined,
    'traffic_density' in item ? item.traffic_density : undefined,
    'time_period' in item ? item.time_period : undefined,
    'vehicle_type' in item ? item.vehicle_type : undefined
  ].filter(Boolean);
}

function rows(selection: MapSelection): Array<[string, string | undefined]> {
  const item = selection.item;
  const values: Array<[string, string | undefined]> = [];

  if ('traffic_density' in item && item.traffic_density && selection.type === 'traffic_segment') {
    const trafficItem = item as TrafficSegment;
    values.push(['交通压力', item.traffic_density]);
    values.push(['对象类型', trafficItem.node_kind ? '道路节点' : '道路段']);
  }
  if ('order_count' in item && item.order_count) values.push(['订单数', formatNumber(item.order_count)]);
  if ('avg_delivery_duration_min' in item && item.avg_delivery_duration_min) {
    values.push(['平均配送时长', `${formatNumber(item.avg_delivery_duration_min, 1)} min`]);
  }
  if ('delivery_duration_min' in item && item.delivery_duration_min) {
    values.push(['配送时长', `${formatNumber(item.delivery_duration_min, 1)} min`]);
  }
  if ('delay_rate' in item && typeof item.delay_rate === 'number') values.push(['延迟率', formatPercent(item.delay_rate)]);
  if ('avg_distance_km' in item && item.avg_distance_km) values.push(['平均距离', `${formatNumber(item.avg_distance_km, 1)} km`]);
  if ('distance_km' in item && item.distance_km) values.push(['距离', `${formatNumber(item.distance_km, 1)} km`]);
  if ('risk_score' in item && typeof item.risk_score === 'number') values.push(['风险评分', formatNumber(item.risk_score, 2)]);
  if ('speed' in item && typeof item.speed === 'number') values.push(['流速指数', formatNumber(item.speed, 1)]);
  if (selection.type === 'order_dot') values.push(['是否延迟', (item as OrderDot).is_delayed ? 'yes' : 'no']);

  return values;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value || value === '-') return null;
  return (
    <div className="eta-ticket-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ETARiskTicket({ selection, onClose, onOpenAnalysis }: ETARiskTicketProps) {
  if (!selection) return null;

  return (
    <aside className="eta-risk-ticket" aria-label="ETA Risk Ticket">
      <div className="eta-ticket-head">
        <div>
          <span>ETA Risk Ticket</span>
          <h2>{titleFor(selection)}</h2>
        </div>
        <button type="button" aria-label="关闭 ETA Risk Ticket" onClick={onClose}>
          ×
        </button>
      </div>
      <h3>{title(selection)}</h3>
      {description(selection) ? <p className="eta-ticket-description">{description(selection)}</p> : null}
      <div className="eta-ticket-conditions">
        {conditions(selection).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="eta-ticket-metrics">
        {rows(selection).map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>
      <p className="eta-ticket-explain">{explanationFor(selection)}</p>
      {onOpenAnalysis ? (
        <button className="eta-ticket-action" type="button" onClick={onOpenAnalysis}>
          查看完整分析
        </button>
      ) : null}
    </aside>
  );
}
