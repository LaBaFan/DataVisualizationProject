import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import InteractiveSceneMap from '../components/InteractiveSceneMap';
import SceneDetailPanel, { SceneDetailPanelTab } from '../components/SceneDetailPanel';
import { getWeatherModuleById, WeatherModuleId } from '../data/weatherModules';
import {
  getModuleOutlierOrders,
  getModuleRiskScenarios,
  getModuleTrafficData,
  getWeatherSummary
} from '../utils/moduleData';
import type {
  DistanceTimePoint,
  RiskScenario,
  SceneFilterSummary,
  WeatherImpactSummary
} from '../types/data';

interface WeatherDetailModuleProps {
  moduleId: WeatherModuleId;
}

const detailTabs: Array<{ id: SceneDetailPanelTab; label: string; hint: string }> = [
  { id: 'traffic', label: 'Traffic', hint: '交通摘要' },
  { id: 'time', label: 'Time', hint: '时段节奏' },
  { id: 'risk', label: 'Risk', hint: '高风险组合' },
  { id: 'outliers', label: 'Orders', hint: '抽样点' }
];

function fmt(value: number | undefined, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';
}

function pct(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

export default function WeatherDetailModule({ moduleId }: WeatherDetailModuleProps) {
  const module = getWeatherModuleById(moduleId);
  const [activeDetailTab, setActiveDetailTab] = useState<SceneDetailPanelTab>('traffic');
  const [summary, setSummary] = useState<WeatherImpactSummary | SceneFilterSummary | null>(null);
  const [trafficRows, setTrafficRows] = useState<SceneFilterSummary[]>([]);
  const [riskScenarios, setRiskScenarios] = useState<RiskScenario[]>([]);
  const [outlierOrders, setOutlierOrders] = useState<DistanceTimePoint[]>([]);

  useEffect(() => {
    setActiveDetailTab('traffic');
  }, [moduleId]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getWeatherSummary(moduleId),
      getModuleTrafficData(moduleId),
      getModuleRiskScenarios(moduleId),
      getModuleOutlierOrders(moduleId)
    ])
      .then(([summaryData, trafficData, riskData, outlierData]) => {
        if (!mounted) return;
        setSummary(summaryData);
        setTrafficRows(trafficData);
        setRiskScenarios(riskData);
        setOutlierOrders(outlierData);
      })
      .catch((error) => {
        console.warn('[WeatherDetailModule] Failed to load module data.', error);
        if (!mounted) return;
        setSummary(null);
        setTrafficRows([]);
        setRiskScenarios([]);
        setOutlierOrders([]);
      });

    return () => {
      mounted = false;
    };
  }, [moduleId]);

  const timeSliceCount = useMemo(
    () => trafficRows.filter((row) => row.weather === 'All' && row.time_period && row.time_period !== 'All').length,
    [trafficRows]
  );

  const tabHint = (tab: SceneDetailPanelTab, fallback: string) => {
    if (tab === 'traffic') return summary ? `${summary.order_count.toLocaleString()} 样本` : fallback;
    if (tab === 'time') return timeSliceCount ? `${timeSliceCount} 个时段` : fallback;
    if (tab === 'risk') return riskScenarios.length ? `${Math.min(riskScenarios.length, 8)} 组场景` : fallback;
    if (tab === 'outliers') return outlierOrders.length ? `${outlierOrders.length.toLocaleString()} 抽样点` : fallback;
    return fallback;
  };

  return (
    <section className="weather-detail-module module-tab-panel" aria-label={`${module.label} weather module`}>
      <div className="module-context-strip" style={{ '--module-accent': module.accentColor } as CSSProperties}>
        <div>
          <span>{module.weather}</span>
          <h2>{module.label} ETA 模块</h2>
        </div>
        <p>{module.summary}</p>
      </div>
      <div className="module-metric-grid" aria-label="模块说明">
        <div>
          <span>样本订单</span>
          <strong>{summary ? summary.order_count.toLocaleString() : '-'}</strong>
        </div>
        <div>
          <span>平均时长</span>
          <strong>{fmt(summary?.avg_delivery_duration_min, 1)} min</strong>
        </div>
        <div>
          <span>延迟率</span>
          <strong>{pct(summary?.delay_rate)}</strong>
        </div>
        <div>
          <span>风险评分</span>
          <strong>{fmt(summary?.risk_score, 2)}</strong>
        </div>
        <div>
          <span>关键问题</span>
          <strong>{module.keyQuestion}</strong>
        </div>
        <div>
          <span>风险提示</span>
          <strong>{module.riskHint}</strong>
        </div>
      </div>
      <InteractiveSceneMap />
      <section className="module-analysis-panel" aria-label={`${module.label} detail analysis`}>
        <div className="module-analysis-header">
          <div>
            <span>模块详情</span>
            <h3>{module.label} 分析切片</h3>
          </div>
          <div className="module-tabs module-detail-tabs" role="tablist" aria-label="天气模块分析标签">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`module-tab-button${activeDetailTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveDetailTab(tab.id)}
                role="tab"
                aria-selected={activeDetailTab === tab.id}
                style={{ '--module-accent': module.accentColor } as CSSProperties}
              >
                <span>{tab.label}</span>
                <small>{tabHint(tab.id, tab.hint)}</small>
              </button>
            ))}
          </div>
        </div>
        <SceneDetailPanel activeTab={activeDetailTab} embedded />
      </section>
    </section>
  );
}
