import { useEffect, useState, type CSSProperties } from 'react';
import InteractiveSceneMap from '../components/InteractiveSceneMap';
import SceneDetailPanel, { SceneDetailPanelTab } from '../components/SceneDetailPanel';
import { getWeatherModuleById, WeatherModuleId } from '../data/weatherModules';
import { useInteraction } from '../store/interactionContext';

interface WeatherDetailModuleProps {
  moduleId: WeatherModuleId;
}

const detailTabs: Array<{ id: SceneDetailPanelTab; label: string; hint: string }> = [
  { id: 'traffic', label: 'Traffic', hint: '交通摘要' },
  { id: 'time', label: 'Time', hint: '时段节奏' },
  { id: 'risk', label: 'Risk', hint: '高风险组合' },
  { id: 'outliers', label: 'Orders', hint: '抽样点' }
];

const moduleSubtitle: Record<WeatherModuleId, string> = {
  overall: '城市配送天气风险总入口',
  sunny: '正常天气下配送 ETA 的基准表现',
  fog: '低能见度天气对配送 ETA 的影响',
  stormy: '强降雨天气对配送 ETA 的影响',
  sandstorms: '沙尘天气对配送稳定性的影响',
  cloudy: '多云天气下配送 ETA 的基准波动',
  windy: '大风天气对骑手速度与路线稳定性的影响'
};

export default function WeatherDetailModule({ moduleId }: WeatherDetailModuleProps) {
  const { switchModule } = useInteraction();
  const module = getWeatherModuleById(moduleId);
  const [activeDetailTab, setActiveDetailTab] = useState<SceneDetailPanelTab>('traffic');
  const [isReturningOverall, setIsReturningOverall] = useState(false);

  useEffect(() => {
    setActiveDetailTab('traffic');
    setIsReturningOverall(false);
  }, [moduleId]);

  const returnToOverall = () => {
    if (isReturningOverall) return;
    setIsReturningOverall(true);
    window.setTimeout(() => {
      switchModule('overall');
    }, 260);
  };

  return (
    <section
      className={`weather-detail-module module-tab-panel${isReturningOverall ? ' is-returning-overall' : ''}`}
      aria-label={`${module.label} weather module`}
      style={{ '--module-accent': module.accentColor, '--module-anchor-image': `url(${module.imageUrl})` } as CSSProperties}
    >
      <div className="module-context-strip weather-detail-hero">
        <div className="weather-detail-anchor" aria-hidden="true" />
        <div>
          <span>{module.weather}</span>
          <h2>{module.label} ETA 模块</h2>
        </div>
        <p>{moduleSubtitle[module.id]}</p>
        <button type="button" className="return-overall-button" onClick={returnToOverall} aria-label="返回 Overall 总览地图">
          <span aria-hidden="true">←</span>
          返回 Overall
        </button>
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
                <small>{tab.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <SceneDetailPanel activeTab={activeDetailTab} embedded />
      </section>
    </section>
  );
}
