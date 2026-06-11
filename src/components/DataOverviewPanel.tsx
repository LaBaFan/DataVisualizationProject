import { mapModules } from '../data/mapModules';
import { miniMetricTags, orderDots, scenarioAnchors, trafficSegments } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { ActiveSection, MapSelection } from '../types/data';

const sectionText: Record<ActiveSection, { title: string; question: string }> = {
  overview: { title: '配送运行总览', question: '从城市运行图识别天气、交通和高风险配送场景。' },
  weather: { title: '天气影响分析', question: '不同天气下，配送是否变慢，哪些天气更容易延迟？' },
  traffic: { title: '交通压力分析', question: '拥堵路段是否正在推高 ETA 和延迟率？' },
  time: { title: '配送时间节奏', question: '早、中、晚、夜间的订单压力和延迟风险如何变化？' },
  risk: { title: '高风险场景解释', question: '哪些条件组合最容易导致外卖配送延迟？' },
  outlier: { title: '异常订单详情', question: '哪些订单出现短距离长时长或高风险异常？' }
};

function fmt(value: number | undefined, digits = 0) {
  return typeof value === 'number' ? value.toFixed(digits) : '-';
}

function pct(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
}

function selectionTitle(selection: MapSelection | null) {
  if (!selection) return null;
  if ('label' in selection.item) return selection.item.label;
  return selection.item.order_id ?? selection.item.id;
}

function metricsForSelection(selection: MapSelection | null) {
  if (!selection) return null;
  const item = selection.item;
  return [
    ['订单数', 'order_count' in item ? fmt(item.order_count) : undefined],
    ['平均时长', 'avg_delivery_duration_min' in item ? `${fmt(item.avg_delivery_duration_min, 1)} min` : undefined],
    ['配送时长', 'delivery_duration_min' in item ? `${fmt(item.delivery_duration_min, 1)} min` : undefined],
    ['延迟率', 'delay_rate' in item ? pct(item.delay_rate) : undefined],
    ['风险评分', 'risk_score' in item ? fmt(item.risk_score, 2) : undefined]
  ].filter(([, value]) => value && value !== '-');
}

function aggregateForWeather(weather: string) {
  const source = weather === 'All' ? [...mapModules, ...scenarioAnchors, ...miniMetricTags] : [...mapModules, ...scenarioAnchors, ...miniMetricTags].filter((item) => item.weather === weather);
  const orderCount = source.reduce((sum, item) => sum + (item.order_count ?? 0), 0);
  const avgDuration = source.length ? source.reduce((sum, item) => sum + (item.avg_delivery_duration_min ?? 0), 0) / source.length : 36.7;
  const delayRate = source.length ? source.reduce((sum, item) => sum + (item.delay_rate ?? 0), 0) / source.length : 0.24;
  const top = source.slice().sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))[0];
  return { orderCount, avgDuration, delayRate, top };
}

function aggregateForTime(timePeriod: string) {
  const source =
    timePeriod === 'All' ? orderDots : orderDots.filter((item) => item.time_period === timePeriod || (!item.time_period && timePeriod === 'night'));
  const orderCount = source.reduce((sum, item) => sum + (item.order_count ?? 1), 0);
  const avgDuration = source.length ? source.reduce((sum, item) => sum + item.delivery_duration_min, 0) / source.length : 34.8;
  const delayRate = source.length ? source.reduce((sum, item) => sum + (item.delay_rate ?? 0), 0) / source.length : 0.32;
  return { orderCount, avgDuration, delayRate };
}

export default function DataOverviewPanel() {
  const { activeSection, selectedWeather, selectedTimePeriod, selectedItem } = useInteraction();
  const copy = sectionText[activeSection];
  const selectedMetrics = metricsForSelection(selectedItem);
  const weather = aggregateForWeather(selectedWeather);
  const time = aggregateForTime(selectedTimePeriod);
  const topTraffic = trafficSegments.slice().sort((a, b) => b.risk_score - a.risk_score)[0];

  const metrics = selectedMetrics ?? [
    ['订单数', fmt(selectedWeather !== 'All' ? weather.orderCount : time.orderCount)],
    ['平均时长', `${fmt(selectedWeather !== 'All' ? weather.avgDuration : time.avgDuration, 1)} min`],
    ['延迟率', pct(selectedWeather !== 'All' ? weather.delayRate : time.delayRate)],
    ['平均距离', '7.2 km'],
    ['风险评分', fmt((weather.top?.risk_score ?? topTraffic?.risk_score ?? 0.72), 2)]
  ];

  return (
    <aside className="data-overview-panel" aria-label="Data overview">
      <div
        key={`${activeSection}-${selectedWeather}-${selectedTimePeriod}-${selectionTitle(selectedItem) ?? 'none'}`}
        className="overview-content"
      >
        <span className="overview-eyebrow">Data Overview</span>
        <h2>{selectedItem ? 'ETA Risk Ticket' : copy.title}</h2>
        <p>{selectedItem ? selectionTitle(selectedItem) : copy.question}</p>

        <div className="overview-filter-summary">
          <span>Weather: {selectedWeather}</span>
          <span>Time: {selectedTimePeriod === 'All' ? 'All' : selectedTimePeriod}</span>
        </div>

        <div className="overview-metric-list">
          {metrics.slice(0, 5).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="overview-explain">
          {selectedItem
            ? '当前详情来自地图或滚动 section 中的点击对象，可继续在地图中查看完整分析抽屉。'
            : selectedWeather !== 'All'
              ? `当前天气筛选会高亮 ${selectedWeather} 相关区域，并降低其他天气场景的不透明度。`
              : selectedTimePeriod !== 'All'
                ? `当前时段会改变交通线段亮度和订单点缩放，用于观察 ${selectedTimePeriod} 下的配送压力。`
                : '滚动中间区域会切换分析主题；左侧天气和顶部时间会联动地图、排行、道路和散点。'}
        </div>
      </div>
    </aside>
  );
}
