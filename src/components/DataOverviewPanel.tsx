import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadSceneFilterSummary,
  loadTimePeriodSummary,
  loadTrafficDensitySummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import { getMapSceneById } from '../data/mapScenes';
import { getWeatherModuleById } from '../data/weatherModules';
import { buildSceneHudMetrics } from '../data/sceneMetrics';
import { useInteraction, type WeatherSubView } from '../store/interactionContext';
import { getWeatherSummary } from '../utils/moduleData';
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

const baselineRiskScore = 0.52;

const moduleDisplayName: Record<string, string> = {
  overall: '总览',
  sunny: '晴天',
  fog: '雾天',
  cloudy: '多云',
  stormy: '雷暴',
  sandstorms: '沙尘',
  windy: '大风'
};

const subViewCopy: Record<WeatherSubView, { label: string; groupBy: string; question: string; finding: string }> = {
  overview: {
    label: '概览',
    groupBy: '天气基线',
    question: '当前天气的 ETA 表现相对全局基线有何差异？',
    finding: '当前视图以 weather 字段过滤订单，并用全局均值作为对照解释 ETA 风险。'
  },
  traffic: {
    label: '交通',
    groupBy: 'traffic_density',
    question: '在当前天气下，不同 traffic_density 如何改变 ETA？',
    finding: '当前视图按 traffic_density 分组，重点比较 Jam、High、Medium、Low 的配送时长和延迟率。'
  },
  time: {
    label: '时段',
    groupBy: 'time_period',
    question: '在当前天气下，不同时段的 ETA 节奏如何变化？',
    finding: '当前视图按 time_period 分组，观察 breakfast、lunch_peak、afternoon、dinner_peak、night 的延迟差异。'
  },
  vehicle: {
    label: '载具',
    groupBy: 'vehicle_type',
    question: '在当前天气下，不同 vehicle_type 的配送表现有何差异？',
    finding: '当前视图按 vehicle_type 对比订单量、平均配送时长和延迟率，辅助判断车辆类型的稳定性。'
  },
  risk: {
    label: '风险',
    groupBy: 'top risk_scenario',
    question: '当前天气下哪些风险组合最容易放大 ETA？',
    finding: '当前视图筛选当前 weather 下的高 risk_score 组合，并比较其配送时长、延迟率和订单量。'
  },
  orders: {
    label: '订单',
    groupBy: '订单级距离-时长样本',
    question: '当前天气下哪些订单呈现距离-时长异常？',
    finding: '当前视图使用订单级 distance_km 与 delivery_duration_min 样本，识别短距离长耗时和高风险订单。'
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

function deltaPercent(current: number | undefined, baseline: number | undefined) {
  if (
    typeof current !== 'number' ||
    typeof baseline !== 'number' ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline) ||
    baseline === 0
  ) {
    return '-';
  }

  const delta = ((current - baseline) / baseline) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function deltaRatePoints(current: number | undefined, baseline: number | undefined) {
  if (
    typeof current !== 'number' ||
    typeof baseline !== 'number' ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline)
  ) {
    return '-';
  }

  const currentNormalized = current > 1 ? current / 100 : current;
  const baselineNormalized = baseline > 1 ? baseline / 100 : baseline;
  const delta = (currentNormalized - baselineNormalized) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(0)} pts`;
}

function conciseInsight(moduleLabel: string, moduleWeather: string, moduleDelayRate: number | undefined, globalDelayRate: number | undefined) {
  const current = typeof moduleDelayRate === 'number' ? (moduleDelayRate > 1 ? moduleDelayRate / 100 : moduleDelayRate) : undefined;
  const global = typeof globalDelayRate === 'number' ? (globalDelayRate > 1 ? globalDelayRate / 100 : globalDelayRate) : undefined;
  const direction = current !== undefined && global !== undefined && current < global ? '低于' : '高于';

  if (moduleWeather === 'All') {
    return '总览用于定位天气分区与配送风险的空间关系；先从地图热区进入具体天气，再用右侧对比解释 ETA 变化。';
  }

  return `${moduleLabel} 的延迟风险${direction}全局基线，说明天气条件正在改变配送稳定性。优先结合地图热区、时段切换和异常抽样点判断风险来源。`;
}

function hotspotInsight(description: string | undefined, fallback: string) {
  if (!description) return fallback;
  return `${fallback} 总览入口热区补充说明：${description}`;
}

function selectionTitle(selection: MapSelection | null) {
  if (!selection) return null;
  if ('label' in selection.item) return selection.item.label;
  return selection.item.order_id ?? selection.item.id;
}

function selectionTypeLabel(selection: MapSelection | null) {
  if (!selection) return '-';
  if (selection.type === 'scene_hotspot') return '天气模块入口';
  if (selection.type === 'traffic_segment') return '天气 × 交通';
  if (selection.type === 'order_dot') return '订单样本';
  if (selection.type === 'risk_pulse') return '风险组合';
  if (selection.type === 'metric_tag') return '指标摘要';
  if (selection.type === 'risk_heat_halo') return '风险评分摘要';
  if (selection.type === 'delivery_flow_segment') return '时段节奏摘要';

  const labels: Record<typeof selection.item.type, string> = {
    restaurant: '订单来源代理',
    building: '指标锚点',
    road: '交通密度摘要',
    weather: '天气筛选',
    risk_zone: '风险组合',
    customer_area: '订单需求代理',
    order_point: '订单样本',
    rider: '载具信号'
  };
  return labels[selection.item.type];
}

function dataFilterForSubView(weather: string, subView: WeatherSubView) {
  const base = `weather == ${weather}`;
  if (weather === 'All') return '全部清洗订单';
  if (subView === 'traffic') return `${base}；按 traffic_density 分组`;
  if (subView === 'time') return `${base}；按 time_period 分组`;
  if (subView === 'vehicle') return `${base}；按 vehicle_type 分组`;
  if (subView === 'risk') return `${base}；按 risk_score 提取高风险组合`;
  if (subView === 'orders') return `${base}；使用订单级距离-时长样本`;
  return base;
}

function dataFilterForSelection(selection: MapSelection | null, weather: string, subView: WeatherSubView) {
  if (!selection) return dataFilterForSubView(weather, subView);
  const item = selection.item;
  const filters = [
    'weather' in item && item.weather ? `weather == ${item.weather}` : weather !== 'All' ? `weather == ${weather}` : null,
    'traffic_density' in item && item.traffic_density ? `traffic_density == ${item.traffic_density}` : null,
    'time_period' in item && item.time_period ? `time_period == ${item.time_period}` : null,
    'vehicle_type' in item && item.vehicle_type ? `vehicle_type == ${item.vehicle_type}` : null,
    'order_id' in item && item.order_id ? `order_id == ${item.order_id}` : null,
    'scenario_id' in item && item.scenario_id ? `scenario_id == ${item.scenario_id}` : null
  ].filter(Boolean);

  return filters.length ? filters.join(' AND ') : dataFilterForSubView(weather, subView);
}

function keyDifferenceText(
  moduleLabel: string,
  subView: WeatherSubView,
  moduleMetrics: {
    avg_delivery_duration_min?: number;
    delay_rate?: number;
    risk_score?: number;
  },
  globalMetrics: {
    avg_delivery_duration_min?: number;
    delay_rate?: number;
    risk_score?: number;
  }
) {
  const avgDelta = deltaPercent(moduleMetrics.avg_delivery_duration_min, globalMetrics.avg_delivery_duration_min);
  const delayDelta = deltaRatePoints(moduleMetrics.delay_rate, globalMetrics.delay_rate);
  if (subView === 'traffic') return `${moduleLabel} 内优先比较 Jam 与 Low。相对基线：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
  if (subView === 'time') return `${moduleLabel} 内优先比较高峰与非高峰。相对基线：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
  if (subView === 'vehicle') return `${moduleLabel} 内按载具类型比较。相对基线：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
  if (subView === 'risk') return `高风险组合按 risk_score 优先排序。当前模块风险评分：${fmt(moduleMetrics.risk_score, 2)}。`;
  if (subView === 'orders') return `订单点用于比较 distance_km 与 delivery_duration_min。当前模块平均时长相对基线：${avgDelta}。`;
  return `${moduleLabel} 相对全局：平均时长 ${avgDelta}，延迟率 ${delayDelta}。`;
}

function metricsForSelection(
  selection: MapSelection | null,
  filteredRow?: SceneFilterSummary | null
): Array<[string, string]> | null {
  if (!selection) return null;
  const item = selection.item;

  // For scene_hotspot, prefer filtered data from scene_filter_summary
  if (selection.type === 'scene_hotspot' && filteredRow) {
    const rows: Array<[string, string]> = [
      ['对象类型', selectionTypeLabel(selection)],
      ['订单数', fmt(filteredRow.order_count)],
      ['平均时长', `${fmt(filteredRow.avg_delivery_duration_min, 1)} 分钟`],
      ['延迟率', pct(filteredRow.delay_rate)],
      ['风险评分', fmt(filteredRow.risk_score, 2)],
      ['平均距离', filteredRow.avg_distance_km ? `${fmt(filteredRow.avg_distance_km, 1)} 公里` : '-']
    ];
    return rows.filter(([, value]) => value !== '-');
  }

  const values: Array<[string, string]> = [
    ['对象类型', selectionTypeLabel(selection)],
    ['订单数', 'order_count' in item ? fmt(item.order_count) : '-'],
    ['平均时长', 'avg_delivery_duration_min' in item ? `${fmt(item.avg_delivery_duration_min, 1)} 分钟` : '-'],
    ['配送时长', 'delivery_duration_min' in item ? `${fmt(item.delivery_duration_min, 1)} 分钟` : '-'],
    ['延迟率', 'delay_rate' in item ? pct(item.delay_rate) : '-'],
    ['风险评分', 'risk_score' in item ? fmt(item.risk_score, 2) : '-'],
    ['平均距离', 'avg_distance_km' in item ? `${fmt(item.avg_distance_km, 1)} 公里` : '-'],
    ['距离', 'distance_km' in item ? `${fmt(item.distance_km, 1)} 公里` : '-']
  ];
  return values.filter(([, value]) => value !== '-');
}

function selectionExplanation(selection: MapSelection | null) {
  if (!selection) return '';
  if (selection.type === 'scene_hotspot') {
    return selection.item.description ?? '该入口用于从总览进入对应 weather 过滤模块。';
  }
  if (selection.type === 'traffic_segment') {
    return '该对象按 traffic_density 汇总当前天气下的订单表现，延迟率和风险评分用于判断 ETA 风险是否被交通条件放大。';
  }
  if (selection.type === 'order_dot') {
    return '该对象表示订单样本或订单聚合点，distance_km、delivery_duration_min 和 risk_score 用于识别异常 ETA。';
  }
  if (selection.type === 'metric_tag') {
    return '该标签仅汇总当前筛选下的真实指标，用于快速读取延迟率、平均时长和风险评分。';
  }
  if (selection.type === 'risk_heat_halo') {
    return '该对象用 order_count、delay_rate 和 risk_score 表达当前筛选下的 ETA 风险强度。';
  }
  if (selection.type === 'delivery_flow_segment') {
    return '该对象用于表达当前筛选下的配送节奏摘要，重点读取 order_count、avg_delivery_duration_min 和 delay_rate。';
  }
  if (selection.type === 'risk_pulse') {
    return '该对象表示 risk_score 较高的组合，可结合 weather、traffic_density、time_period 和 vehicle_type 解释延迟。';
  }
  return selection.item.description ?? '当前对象用于解释真实字段组合下的 ETA 延迟风险。';
}

function selectionPills(selection: MapSelection | null) {
  if (!selection) return [];
  const item = selection.item;
  return [
    ['类型', selectionTypeLabel(selection)],
    ['天气', 'weather' in item ? item.weather : undefined],
    ['交通', 'traffic_density' in item ? item.traffic_density : undefined],
    ['时段', 'time_period' in item ? item.time_period : undefined],
    ['车辆', 'vehicle_type' in item ? item.vehicle_type : undefined]
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
  const { activeModule, activeSection, selectedWeather, selectedTimePeriod, selectedSubView, selectedSceneId, selectedItem, setSelectedItem } = useInteraction();
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [weatherRows, setWeatherRows] = useState<WeatherImpactSummary[]>([]);
  const [timeRows, setTimeRows] = useState<TimePeriodSummary[]>([]);
  const [trafficDensityRows, setTrafficDensityRows] = useState<TrafficDensitySummary[]>([]);
  const [sceneFilterRows, setSceneFilterRows] = useState<SceneFilterSummary[]>([]);
  const [moduleSummary, setModuleSummary] = useState<WeatherImpactSummary | SceneFilterSummary | null>(null);

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

  useEffect(() => {
    let mounted = true;
    getWeatherSummary(activeModule, selectedTimePeriod)
      .then((summary) => {
        if (mounted) setModuleSummary(summary);
      })
      .catch((error) => {
        console.warn('[DataOverviewPanel] Failed to load module summary.', error);
        if (mounted) setModuleSummary(null);
      });

    return () => {
      mounted = false;
    };
  }, [activeModule, selectedTimePeriod]);

  const selectedScene = getMapSceneById(selectedSceneId);
  const currentModule = getWeatherModuleById(activeModule);

  // For scene_hotspot: find matching scene_filter_summary row
  const hotspotFilteredRow = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'scene_hotspot') return null;
    const hotspot = selectedItem.item;
    const targetSceneId = hotspot.targetSceneId;
    if (!targetSceneId || !sceneFilterRows.length) return null;

    const timePeriod = !selectedTimePeriod || selectedTimePeriod === 'All' ? 'All' : selectedTimePeriod;
    const weather = !selectedWeather || selectedWeather === 'All' ? 'All' : selectedWeather;

    // Try exact match (scene + weather + time)
    const exact = sceneFilterRows.find(
      (r) => r.scene_id === targetSceneId && r.weather === weather && r.time_period === timePeriod
    );
    if (exact) return exact;

    // Fallback: scene + time only
    const timeOnly = sceneFilterRows.find(
      (r) => r.scene_id === targetSceneId && r.weather === 'All' && r.time_period === timePeriod
    );
    if (timeOnly) return timeOnly;

    // Fallback: scene base (All/All)
    return sceneFilterRows.find(
      (r) => r.scene_id === targetSceneId && r.weather === 'All' && r.time_period === 'All'
    ) ?? null;
  }, [selectedItem, sceneFilterRows, selectedTimePeriod, selectedWeather]);

  const selectedMetrics = metricsForSelection(selectedItem, hotspotFilteredRow);
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
      ['平均时长', `${fmt(contextMetrics.avg_delivery_duration_min, 1)} 分钟`],
      ['延迟率', pct(contextMetrics.delay_rate)],
      ['平均距离', `${fmt(contextMetrics.avg_distance_km, 1)} 公里`],
      ['风险评分', fmt(contextMetrics.risk_score, 2)]
    ];
  }, [contextMetrics, moduleSummary, selectedMetrics]);

  const globalMetrics = {
    avg_delivery_duration_min: overview?.avg_delivery_duration_min,
    delay_rate: overview?.delay_rate,
    risk_score: baselineRiskScore
  };
  const moduleMetrics = {
    order_count: moduleSummary?.order_count ?? contextMetrics.order_count,
    avg_delivery_duration_min: moduleSummary?.avg_delivery_duration_min ?? contextMetrics.avg_delivery_duration_min,
    delay_rate: moduleSummary?.delay_rate ?? contextMetrics.delay_rate,
    risk_score: moduleSummary?.risk_score ?? contextMetrics.risk_score,
    avg_distance_km: moduleSummary?.avg_distance_km ?? contextMetrics.avg_distance_km
  };
  const currentSubView = subViewCopy[selectedSubView];
  const currentModuleName = moduleDisplayName[currentModule.id] ?? currentModule.label;
  const comparisonRows = [
    {
      label: '平均配送时长',
      currentLabel: currentModuleName,
      currentValue: `${fmt(moduleMetrics.avg_delivery_duration_min, 1)} 分钟`,
      baselineLabel: '全局',
      baselineValue: `${fmt(globalMetrics.avg_delivery_duration_min, 1)} 分钟`,
      delta: deltaPercent(moduleMetrics.avg_delivery_duration_min, globalMetrics.avg_delivery_duration_min)
    },
    {
      label: '延迟率',
      currentLabel: currentModuleName,
      currentValue: pct(moduleMetrics.delay_rate),
      baselineLabel: '全局',
      baselineValue: pct(globalMetrics.delay_rate),
      delta: deltaRatePoints(moduleMetrics.delay_rate, globalMetrics.delay_rate)
    },
    {
      label: '风险影响评分',
      currentLabel: currentModuleName,
      currentValue: fmt(moduleMetrics.risk_score, 2),
      baselineLabel: '基线',
      baselineValue: fmt(globalMetrics.risk_score, 2),
      delta: deltaPercent(moduleMetrics.risk_score, globalMetrics.risk_score)
    }
  ];

  const filterPills = selectedItem
    ? selectionPills(selectedItem)
    : [
        ['天气', currentModule.weather],
        ['时段', selectedTimePeriod],
        ['子视图', currentSubView.label]
      ];
  const explanation = selectedItem
    ? selectionExplanation(selectedItem)
    : `${currentSubView.finding} ${conciseInsight(currentModuleName, currentModule.weather, moduleMetrics.delay_rate, globalMetrics.delay_rate)}`;
  const panelStatus = selectedItem ? 'ETA 风险票据' : '分析面板';
  const panelIndex = activeModule === 'overall' ? '00 总览' : `${String(['sunny', 'fog', 'cloudy', 'stormy', 'sandstorms', 'windy'].indexOf(activeModule) + 1).padStart(2, '0')} ${currentModuleName}`;
  const dataFilter = dataFilterForSelection(selectedItem, currentModule.weather, selectedSubView);
  const keyDifference = keyDifferenceText(currentModuleName, selectedSubView, moduleMetrics, globalMetrics);
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
    <aside className="data-overview-panel" aria-label="分析面板">
      <div
        key={`${activeModule}-${activeSection}-${selectedWeather}-${selectedTimePeriod}-${selectedSubView}-${selectionTitle(selectedItem) ?? 'none'}`}
        className="overview-content"
      >
        <section className="overview-block overview-current-view" aria-labelledby="overview-current-heading">
          <span className="overview-status-line">{panelStatus}</span>
          <small className="overview-panel-index">{selectedItem ? selectionTypeLabel(selectedItem) : panelIndex}</small>
          <h2 id="overview-current-heading">{selectedItem ? selectionTitle(selectedItem) : `${currentModuleName} ${currentSubView.label}`}</h2>
          <p className="overview-question">
            {selectedItem ? '当前对象已锁定，右侧内容切换为 ETA 风险票据。' : currentSubView.question}
          </p>

          <div className="overview-filter-summary" aria-label="当前筛选">
            {filterPills.map(([label, value]) => (
              <span key={`${label}-${value}`}>{label}: {value}</span>
            ))}
          </div>
          <div className="overview-filter-summary" aria-label="数据过滤条件">
            <span>数据过滤：{dataFilter}</span>
          </div>
        </section>

        {selectedItem ? (
          <section className="overview-block" aria-labelledby="overview-metrics-heading">
            <h3 id="overview-metrics-heading">票据指标</h3>
            <div className="overview-metric-list">
              {metrics.slice(0, 7).map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="overview-block" aria-labelledby="overview-compare-heading">
            <h3 id="overview-compare-heading">关键差异</h3>
            <p className="overview-explain">{keyDifference}</p>
            <div className="analysis-compare-stack">
              {comparisonRows.slice(0, 2).map((row) => (
                <article key={row.label} className="analysis-compare-card">
                  <span>{row.label}</span>
                  <div>
                    <strong>{row.currentLabel}: {row.currentValue}</strong>
                    <em>{row.baselineLabel}: {row.baselineValue}</em>
                  </div>
                  <b>Δ {row.delta}</b>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="overview-block" aria-labelledby="overview-explain-heading">
          <h3 id="overview-explain-heading">{selectedItem ? '解释' : '当前发现'}</h3>
          <p className="overview-explain">{explanation}</p>
        </section>

        <section className="overview-block overview-actions-block" aria-labelledby="overview-actions-heading">
          <h3 id="overview-actions-heading">{selectedItem ? '票据操作' : '交互提示'}</h3>
          {selectedItem ? (
            <div className="overview-ticket-actions">
              <button type="button" onClick={handleFullAnalysisClick}>
                查看完整分析
              </button>
              <button type="button" onClick={() => setSelectedItem(null)}>
                返回 {currentModuleName} {currentSubView.label} 分析
              </button>
            </div>
          ) : (
            <div className="analysis-hint-box">
              <span>点击地图区域可查看：</span>
              <ul>
                <li>延迟订单分布</li>
                <li>异常路径样本</li>
                <li>风险热区详情</li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
