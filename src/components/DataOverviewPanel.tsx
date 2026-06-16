import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadSceneFilterSummary,
  loadTimePeriodSummary,
  loadTrafficDensitySummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import { getMapSceneById } from '../data/mapScenes';
import { buildSceneHudMetrics } from '../data/sceneMetrics';
import { useInteraction } from '../store/interactionContext';
import {
  ActiveSection,
  MapSelection,
  OverviewSummary,
  SceneFilterSummary,
  TimePeriodSummary,
  TrafficDensitySummary,
  ViewContextMetrics,
  WeatherImpactSummary
} from '../types/data';

const sectionText: Record<ActiveSection, { step: string; label: string; title: string; question: string; explain: string }> = {
  overview: {
    step: '01',
    label: 'Overview',
    title: '配送运行总览',
    question: '当前城市配送系统中，哪些区域、道路或场景呈现较高延迟风险？',
    explain: '固定城市运行图叠加订单密度、风险热晕、配送流动和微型标签，用于快速识别配送延迟热点。'
  },
  weather: {
    step: '02',
    label: 'Weather',
    title: '天气影响',
    question: '哪些天气会让 ETA 明显变慢？',
    explain: '比较不同天气下的配送时长、延迟率和风险评分，判断天气是否显著影响 ETA。'
  },
  traffic: {
    step: '03',
    label: 'Traffic',
    title: '交通压力',
    question: '交通拥堵程度从 Low 到 Jam 变化时，配送时长和延迟风险如何变化？',
    explain: '通过交通压力分层带图比较不同交通密度下的订单量、平均配送时长和延迟率。'
  },
  time: {
    step: '04',
    label: 'Time',
    title: '配送时间节奏',
    question: '一天中订单压力和延迟风险如何变化？',
    explain: '通过时间节奏带比较早、午、下午、晚和夜间的订单压力与延迟风险。'
  },
  risk: {
    step: '05',
    label: 'Risk',
    title: '高风险组合',
    question: '哪些天气、交通、时段和车辆组合最危险？',
    explain: '通过风险场景气泡图定位同时具有高配送时长、高延迟率和较大订单量的组合。'
  },
  outlier: {
    step: '06',
    label: 'Orders',
    title: '异常订单',
    question: '哪些订单偏离距离-时长的正常关系？',
    explain: '通过距离-配送时长散点图识别短距离长耗时和高风险异常订单。'
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

function selectionTypeLabel(selection: MapSelection | null) {
  if (!selection) return '-';
  if (selection.type === 'scene_hotspot') return '总览入口热区';
  if (selection.type === 'traffic_segment') return selection.item.node_kind ? '道路节点' : '道路段';
  if (selection.type === 'order_dot') return '订单点';
  if (selection.type === 'risk_pulse') return '风险脉冲';
  if (selection.type === 'metric_tag') return '微型指标';
  if (selection.type === 'risk_heat_halo') return '风险热晕';
  if (selection.type === 'delivery_flow_segment') return '配送流动';

  const labels: Record<typeof selection.item.type, string> = {
    restaurant: '餐厅节点',
    building: '建筑区域',
    road: '交通路段',
    weather: '天气区域',
    risk_zone: '风险区域',
    customer_area: '客户区域',
    order_point: '订单点',
    rider: '骑手节点'
  };
  return labels[selection.item.type];
}

function metricsForSelection(selection: MapSelection | null): Array<[string, string]> | null {
  if (!selection) return null;
  const item = selection.item;
  const values: Array<[string, string]> = [
    ['对象类型', selectionTypeLabel(selection)],
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

function selectionExplanation(selection: MapSelection | null) {
  if (!selection) return '';
  if (selection.type === 'scene_hotspot') {
    return selection.item.description ?? '该热区用于从 overall 总入口地图进入对应子模块，点击后切换背景图并显示模块概览。';
  }
  if (selection.type === 'traffic_segment') {
    return selection.item.node_kind
      ? '该道路节点位于路口、汇入口或出入口，常是排队、汇流和转向导致 ETA 风险放大的位置。'
      : '该道路段的交通压力会推高骑手在途时间，延迟率和风险评分可用于判断是否需要调度干预。';
  }
  if (selection.type === 'order_dot') {
    return '该对象表示订单或订单聚合位置，配送时长、距离和风险评分用于识别异常或高延迟样本。';
  }
  if (selection.type === 'metric_tag') {
    return '该微型标签汇总局部订单压力和延迟表现，用于在地图上快速锁定需要解释的区域。';
  }
  if (selection.type === 'risk_heat_halo') {
    return '风险热晕用半径表达订单压力，用红橙透明度表达局部延迟风险，适合快速定位热点。';
  }
  if (selection.type === 'delivery_flow_segment') {
    return '配送流动对象表示当前筛选下的短距离配送方向和速度变化，用于判断局部运行节奏。';
  }
  if (selection.type === 'risk_pulse') {
    return '风险脉冲表示综合风险评分较高的场景锚点，可结合天气、交通、时段和车辆类型解释延迟。';
  }
  return selection.item.description ?? '当前对象用于解释局部配送运行状态和 ETA 延迟风险。';
}

function selectionPills(selection: MapSelection | null) {
  if (!selection) return [];
  const item = selection.item;
  return [
    ['Type', selectionTypeLabel(selection)],
    ['Weather', 'weather' in item ? item.weather : undefined],
    ['Traffic', 'traffic_density' in item ? item.traffic_density : undefined],
    ['Time', 'time_period' in item ? item.time_period : undefined],
    ['Vehicle', 'vehicle_type' in item ? item.vehicle_type : undefined]
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;
}

function sectionForSelection(selection: MapSelection | null, fallback: ActiveSection): ActiveSection {
  if (!selection) return fallback;
  if (selection.type === 'scene_hotspot') return 'overview';
  if (selection.type === 'order_dot') return 'outlier';
  if (selection.type === 'traffic_segment') return 'traffic';
  if (selection.type === 'delivery_flow_segment') return 'time';
  if (selection.type === 'risk_heat_halo' || selection.type === 'metric_tag' || selection.type === 'risk_pulse') {
    return 'risk';
  }
  if (selection.type === 'module' && selection.item.type === 'risk_zone') return 'risk';
  return fallback ?? 'overview';
}

export default function DataOverviewPanel() {
  const { activeSection, selectedWeather, selectedTimePeriod, selectedSceneId, selectedItem, setSelectedItem, navigateToSection } = useInteraction();
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [weatherRows, setWeatherRows] = useState<WeatherImpactSummary[]>([]);
  const [timeRows, setTimeRows] = useState<TimePeriodSummary[]>([]);
  const [trafficDensityRows, setTrafficDensityRows] = useState<TrafficDensitySummary[]>([]);
  const [sceneFilterRows, setSceneFilterRows] = useState<SceneFilterSummary[]>([]);

  useEffect(() => {
    Promise.all([
      loadOverviewSummary(),
      loadWeatherImpactSummary(),
      loadTimePeriodSummary(),
      loadTrafficDensitySummary(),
      loadSceneFilterSummary()
    ]).then(([overviewData, weatherData, timeData, trafficDensityData, sceneFilterData]) => {
      setOverview(overviewData);
      setWeatherRows(weatherData);
      setTimeRows(timeData);
      setTrafficDensityRows(trafficDensityData);
      setSceneFilterRows(sceneFilterData);
    });
  }, []);

  const copy = sectionText[activeSection];
  const selectedScene = getMapSceneById(selectedSceneId);
  const selectedMetrics = metricsForSelection(selectedItem);
  const contextMetrics: ViewContextMetrics = useMemo(
    () =>
      buildSceneHudMetrics({
        selectedScene,
        selectedWeather,
        selectedTimePeriod,
        overview,
        weatherRows,
        timeRows,
        trafficRows: trafficDensityRows,
        sceneFilterRows
      }),
    [overview, sceneFilterRows, selectedScene, selectedTimePeriod, selectedWeather, timeRows, trafficDensityRows, weatherRows]
  );

  const metrics = useMemo(() => {
    if (selectedMetrics) return selectedMetrics;

    return [
      ['样本订单', fmt(contextMetrics.order_count)],
      ['平均时长', `${fmt(contextMetrics.avg_delivery_duration_min, 1)} min`],
      ['延迟率', pct(contextMetrics.delay_rate)],
      ['平均距离', `${fmt(contextMetrics.avg_distance_km, 1)} km`],
      ['风险评分', fmt(contextMetrics.risk_score, 2)]
    ];
  }, [contextMetrics, selectedMetrics]);

  const filterPills = selectedItem
    ? selectionPills(selectedItem)
    : [
        ['Scene', selectedScene.title],
        ['Type', selectedScene.type],
        ['Weather', selectedWeather],
        ['Time', selectedTimePeriod]
      ];
  const explanation = selectedItem ? selectionExplanation(selectedItem) : selectedScene.description;
  const handleFullAnalysisClick = () => {
    const targetSection = sectionForSelection(selectedItem, activeSection ?? 'overview');
    setSelectedItem(null);

    // Map section to detail panel anchor
    const detailAnchorMap: Partial<Record<ActiveSection, string>> = {
      time: 'detail-time-rhythm',
      risk: 'detail-risk-scenarios',
      outlier: 'detail-scatter'
    };
    const anchorId = detailAnchorMap[targetSection] ?? 'scene-detail-panel';
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="data-overview-panel" aria-label="Analysis Panel">
      <div
        key={`${activeSection}-${selectedWeather}-${selectedTimePeriod}-${selectionTitle(selectedItem) ?? 'none'}`}
        className="overview-content"
      >
        <span className="overview-eyebrow">Analysis Panel</span>
        {selectedItem ? (
          <div className="overview-ticket-head">
            <span>ETA Risk Ticket</span>
            <div className="overview-ticket-actions">
              <button type="button" onClick={handleFullAnalysisClick}>
                查看完整分析
              </button>
              <button type="button" onClick={() => setSelectedItem(null)}>
                返回模块概览
              </button>
            </div>
          </div>
        ) : (
          <span className="overview-section-step">{copy.step} / {copy.label}</span>
        )}
        <h2>{selectedItem ? selectionTitle(selectedItem) : selectedScene.title}</h2>
        <p className="overview-question">{selectedItem ? selectionTypeLabel(selectedItem) : selectedScene.question}</p>

        <div className="overview-filter-summary">
          {filterPills.map(([label, value]) => (
            <span key={`${label}-${value}`}>{label}: {value}</span>
          ))}
        </div>

        <div className="overview-metric-list">
          {metrics.slice(0, selectedItem ? 7 : 5).map(([label, value]) => (
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
