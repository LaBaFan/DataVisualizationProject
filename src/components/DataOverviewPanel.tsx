import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadRiskScenarioSummary,
  loadTimePeriodSummary,
  loadTrafficSegmentSummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import { useInteraction } from '../store/interactionContext';
import {
  ActiveSection,
  MapSelection,
  OverviewSummary,
  RiskScenario,
  TimePeriodSummary,
  TrafficSegmentSummary,
  WeatherImpactSummary
} from '../types/data';

const sectionText: Record<ActiveSection, { title: string; question: string; explain: string }> = {
  overview: {
    title: '配送运行总览',
    question: '当前城市配送运行状态在哪里开始出现风险？',
    explain: '入口地图把道路、订单点、风险脉冲与微型标签叠在同一张外卖城市运行图上。'
  },
  weather: {
    title: '天气影响',
    question: '哪些天气让 ETA 明显变慢？',
    explain: '天气排行使用 weather_impact_summary.json，比较订单量、平均配送时长、延迟率和风险评分。'
  },
  traffic: {
    title: '交通压力',
    question: '哪些道路负载最可能推高延迟？',
    explain: '交通压力分层带图将 Low、Medium、High 和 Jam 四类状态并列展示，对比不同交通条件下的订单量、平均配送时长和延迟率；相比地图路线，它更直接地展示交通拥堵对 ETA 的整体影响。'
  },
  time: {
    title: '时间节奏',
    question: '一天中订单压力和延迟风险怎样变化？',
    explain: 'Time Rhythm Strip 用宽度、颜色和亮度同时表达订单量、延迟率和平均时长。'
  },
  risk: {
    title: '高风险场景',
    question: '哪些天气、交通、时段和车辆组合最危险？',
    explain: 'LineUp 风格表格按风险、延迟率或平均时长排序，筛选命中的行会保留强调。'
  },
  outlier: {
    title: '异常订单',
    question: '哪些订单偏离距离-时长的正常关系？',
    explain: '散点图以 distance_km 和 delivery_duration_min 定位短距离长时长或显著延迟订单。'
  }
};

function fmt(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function pct(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

function selectionTitle(selection: MapSelection | null) {
  if (!selection) return null;
  if ('label' in selection.item) return selection.item.label;
  return selection.item.order_id ?? selection.item.id;
}

function metricsForSelection(selection: MapSelection | null): Array<[string, string]> | null {
  if (!selection) return null;
  const item = selection.item;
  const values: Array<[string, string]> = [
    ['订单数', 'order_count' in item ? fmt(item.order_count) : '-'],
    ['平均时长', 'avg_delivery_duration_min' in item ? `${fmt(item.avg_delivery_duration_min, 1)} min` : '-'],
    ['配送时长', 'delivery_duration_min' in item ? `${fmt(item.delivery_duration_min, 1)} min` : '-'],
    ['延迟率', 'delay_rate' in item ? pct(item.delay_rate) : '-'],
    ['风险评分', 'risk_score' in item ? fmt(item.risk_score, 2) : '-'],
    ['平均距离', 'avg_distance_km' in item ? `${fmt(item.avg_distance_km, 1)} km` : '-'],
    ['距离', 'distance_km' in item ? `${fmt(item.distance_km, 1)} km` : '-']
  ];
  return values.filter(([, value]) => value !== '-');
}

function aggregateWeather(weather: string, rows: WeatherImpactSummary[]) {
  const row = rows.find((item) => item.weather === weather);
  if (!row) return null;
  return {
    orderCount: row.order_count,
    avgDuration: row.avg_delivery_duration_min,
    delayRate: row.delay_rate,
    riskScore: row.risk_score
  };
}

function aggregateTime(timePeriod: string, rows: TimePeriodSummary[]) {
  const row = rows.find((item) => item.time_period === timePeriod);
  if (!row) return null;
  return {
    orderCount: row.order_count,
    avgDuration: row.avg_delivery_duration_min,
    delayRate: row.delay_rate,
    avgDistance: row.avg_distance_km
  };
}

export default function DataOverviewPanel() {
  const { activeSection, selectedWeather, selectedTimePeriod, selectedItem } = useInteraction();
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [weatherRows, setWeatherRows] = useState<WeatherImpactSummary[]>([]);
  const [timeRows, setTimeRows] = useState<TimePeriodSummary[]>([]);
  const [trafficRows, setTrafficRows] = useState<TrafficSegmentSummary[]>([]);
  const [riskRows, setRiskRows] = useState<RiskScenario[]>([]);

  useEffect(() => {
    Promise.all([
      loadOverviewSummary(),
      loadWeatherImpactSummary(),
      loadTimePeriodSummary(),
      loadTrafficSegmentSummary(),
      loadRiskScenarioSummary()
    ]).then(([overviewData, weatherData, timeData, trafficData, riskData]) => {
      setOverview(overviewData);
      setWeatherRows(weatherData);
      setTimeRows(timeData);
      setTrafficRows(trafficData);
      setRiskRows(riskData);
    });
  }, []);

  const copy = sectionText[activeSection];
  const selectedMetrics = metricsForSelection(selectedItem);

  const metrics = useMemo(() => {
    if (selectedMetrics) return selectedMetrics;

    const weatherMetric = selectedWeather !== 'All' ? aggregateWeather(selectedWeather, weatherRows) : null;
    const timeMetric = selectedTimePeriod !== 'All' ? aggregateTime(selectedTimePeriod, timeRows) : null;
    const topTraffic = trafficRows.slice().sort((a, b) => (b.delay_rate ?? 0) - (a.delay_rate ?? 0))[0];
    const topRisk = riskRows.slice().sort((a, b) => b.risk_score - a.risk_score)[0];

    if (weatherMetric) {
      return [
        ['天气订单数', fmt(weatherMetric.orderCount)],
        ['平均时长', `${fmt(weatherMetric.avgDuration, 1)} min`],
        ['延迟率', pct(weatherMetric.delayRate)],
        ['风险评分', fmt(weatherMetric.riskScore, 2)],
        ['当前天气', selectedWeather]
      ];
    }

    if (timeMetric) {
      return [
        ['时段订单数', fmt(timeMetric.orderCount)],
        ['平均时长', `${fmt(timeMetric.avgDuration, 1)} min`],
        ['延迟率', pct(timeMetric.delayRate)],
        ['平均距离', `${fmt(timeMetric.avgDistance, 1)} km`],
        ['当前时段', selectedTimePeriod]
      ];
    }

    return [
      ['有效订单', fmt(overview?.order_count ?? overview?.valid_orders ?? overview?.total_orders)],
      ['平均时长', `${fmt(overview?.avg_delivery_duration_min, 1)} min`],
      ['全局延迟率', pct(overview?.delay_rate)],
      ['高压道路', topTraffic?.label ?? '-'],
      ['最高风险场景', topRisk?.label ?? '-']
    ];
  }, [overview, riskRows, selectedItem, selectedMetrics, selectedTimePeriod, selectedWeather, timeRows, trafficRows, weatherRows]);

  const explanation = selectedItem
    ? '当前为选中对象的 ETA Risk Ticket 摘要。点击对象可以来自分层带、地图、风险表或异常订单散点。'
    : copy.explain;

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
          <span>Time: {selectedTimePeriod}</span>
        </div>

        <div className="overview-metric-list">
          {metrics.slice(0, 5).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="overview-explain">{explanation}</div>
      </div>
    </aside>
  );
}
