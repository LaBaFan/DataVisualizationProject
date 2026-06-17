import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadSceneFilterSummary,
  loadTimePeriodSummary,
  loadTrafficDensitySummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import { getMapSceneById } from '../data/mapScenes';
import { overallHotspots } from '../data/overallHotspots';
import { getWeatherModuleById } from '../data/weatherModules';
import { buildSceneHudMetrics } from '../data/sceneMetrics';
import { useInteraction } from '../store/interactionContext';
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
      ['平均时长', `${fmt(filteredRow.avg_delivery_duration_min, 1)} min`],
      ['延迟率', pct(filteredRow.delay_rate)],
      ['风险评分', fmt(filteredRow.risk_score, 2)],
      ['平均距离', filteredRow.avg_distance_km ? `${fmt(filteredRow.avg_distance_km, 1)} km` : '-']
    ];
    return rows.filter(([, value]) => value !== '-');
  }

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
  const { activeModule, activeSection, selectedWeather, selectedTimePeriod, selectedSceneId, selectedItem, setSelectedItem, navigateToSection } = useInteraction();
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
  const moduleEntryHotspot = useMemo(
    () => overallHotspots.find((hotspot) => hotspot.targetModule === activeModule) ?? null,
    [activeModule]
  );

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
      ['平均时长', `${fmt(contextMetrics.avg_delivery_duration_min, 1)} min`],
      ['延迟率', pct(contextMetrics.delay_rate)],
      ['平均距离', `${fmt(contextMetrics.avg_distance_km, 1)} km`],
      ['风险评分', fmt(contextMetrics.risk_score, 2)]
    ];
  }, [contextMetrics, moduleSummary, selectedMetrics]);

  const globalMetrics = {
    avg_delivery_duration_min: overview?.avg_delivery_duration_min,
    delay_rate: overview?.delay_rate,
    risk_score: baselineRiskScore
  };
  const moduleMetrics = {
    order_count: moduleSummary?.order_count ?? moduleEntryHotspot?.order_count ?? contextMetrics.order_count,
    avg_delivery_duration_min: moduleSummary?.avg_delivery_duration_min ?? moduleEntryHotspot?.avg_delivery_duration_min ?? contextMetrics.avg_delivery_duration_min,
    delay_rate: moduleSummary?.delay_rate ?? moduleEntryHotspot?.delay_rate ?? contextMetrics.delay_rate,
    risk_score: moduleSummary?.risk_score ?? moduleEntryHotspot?.risk_score ?? contextMetrics.risk_score,
    avg_distance_km: moduleSummary?.avg_distance_km ?? contextMetrics.avg_distance_km
  };
  const comparisonRows = [
    {
      label: 'Avg Delivery Time',
      currentLabel: currentModule.label,
      currentValue: `${fmt(moduleMetrics.avg_delivery_duration_min, 1)} min`,
      baselineLabel: 'Global',
      baselineValue: `${fmt(globalMetrics.avg_delivery_duration_min, 1)} min`,
      delta: deltaPercent(moduleMetrics.avg_delivery_duration_min, globalMetrics.avg_delivery_duration_min)
    },
    {
      label: 'Delay Rate',
      currentLabel: currentModule.label,
      currentValue: pct(moduleMetrics.delay_rate),
      baselineLabel: 'Global',
      baselineValue: pct(globalMetrics.delay_rate),
      delta: deltaRatePoints(moduleMetrics.delay_rate, globalMetrics.delay_rate)
    },
    {
      label: 'Risk Impact Score',
      currentLabel: currentModule.label,
      currentValue: fmt(moduleMetrics.risk_score, 2),
      baselineLabel: 'Baseline',
      baselineValue: fmt(globalMetrics.risk_score, 2),
      delta: deltaPercent(moduleMetrics.risk_score, globalMetrics.risk_score)
    }
  ];

  const filterPills = selectedItem
    ? selectionPills(selectedItem)
    : [
        ['模块', currentModule.label],
        ['天气', currentModule.weather],
        ['时段', selectedTimePeriod]
      ];
  const explanation = selectedItem
    ? selectionExplanation(selectedItem)
    : hotspotInsight(
        moduleEntryHotspot?.description,
        conciseInsight(currentModule.label, currentModule.weather, moduleMetrics.delay_rate, globalMetrics.delay_rate)
      );
  const panelStatus = selectedItem ? 'ETA RISK DETAIL MODE' : 'ANALYSIS ENGINE';
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
        key={`${activeModule}-${activeSection}-${selectedWeather}-${selectedTimePeriod}-${selectionTitle(selectedItem) ?? 'none'}`}
        className="overview-content"
      >
        <section className="overview-block overview-current-view" aria-labelledby="overview-current-heading">
          <span className="overview-status-line">{panelStatus}</span>
          <h2 id="overview-current-heading">{selectedItem ? selectionTitle(selectedItem) : `${currentModule.label} 模块分析`}</h2>
          <p className="overview-question">
            {selectedItem ? selectionTypeLabel(selectedItem) : currentModule.keyQuestion}
          </p>

          <div className="overview-filter-summary" aria-label="当前筛选">
            {filterPills.map(([label, value]) => (
              <span key={`${label}-${value}`}>{label}: {value}</span>
            ))}
          </div>
        </section>

        {selectedItem ? (
          <section className="overview-block" aria-labelledby="overview-metrics-heading">
            <h3 id="overview-metrics-heading">对象指标</h3>
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
            <h3 id="overview-compare-heading">{currentModule.label} vs 全局对比</h3>
            {moduleEntryHotspot ? (
              <div className="overview-metric-list module-entry-metrics" aria-label={`${currentModule.label} 总览入口热区合并指标`}>
                <div>
                  <span>入口区域</span>
                  <strong>{moduleEntryHotspot.label}</strong>
                </div>
                <div>
                  <span>入口订单</span>
                  <strong>{fmt(moduleEntryHotspot.order_count)}</strong>
                </div>
                <div>
                  <span>入口平均时长</span>
                  <strong>{`${fmt(moduleEntryHotspot.avg_delivery_duration_min, 1)} min`}</strong>
                </div>
                <div>
                  <span>入口延迟率</span>
                  <strong>{pct(moduleEntryHotspot.delay_rate)}</strong>
                </div>
                <div>
                  <span>入口风险评分</span>
                  <strong>{fmt(moduleEntryHotspot.risk_score, 2)}</strong>
                </div>
              </div>
            ) : null}
            <div className="analysis-compare-stack">
              {comparisonRows.map((row) => (
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
          <h3 id="overview-explain-heading">{selectedItem ? '对象解释' : '洞察结论'}</h3>
          <p className="overview-explain">{explanation}</p>
        </section>

        <section className="overview-block overview-actions-block" aria-labelledby="overview-actions-heading">
          <h3 id="overview-actions-heading">{selectedItem ? 'Detail Action' : '交互提示'}</h3>
          {selectedItem ? (
            <div className="overview-ticket-actions">
              <button type="button" onClick={handleFullAnalysisClick}>
                查看完整分析
              </button>
              <button type="button" onClick={() => setSelectedItem(null)}>
                Back to {currentModule.label} Analysis
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
