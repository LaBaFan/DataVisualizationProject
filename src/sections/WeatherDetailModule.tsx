import { useEffect, useState, type CSSProperties } from 'react';
import InteractiveSceneMap from '../components/InteractiveSceneMap';
import { getWeatherModuleById, WeatherModuleId } from '../data/weatherModules';
import { useInteraction, type WeatherSubView } from '../store/interactionContext';
import WeatherSubViewPanel from './WeatherSubViewPanel';

interface WeatherDetailModuleProps {
  moduleId: WeatherModuleId;
}

const detailTabs: Array<{ id: WeatherSubView; label: string; hint: string }> = [
  { id: 'overview', label: '概览', hint: '总体对比' },
  { id: 'traffic', label: '交通', hint: '交通分带' },
  { id: 'time', label: '时段', hint: '时段节奏' },
  { id: 'vehicle', label: '载具', hint: '载具表现' },
  { id: 'risk', label: '风险', hint: '高风险组合' },
  { id: 'orders', label: '订单', hint: '订单散点' }
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

const moduleDisplayName: Record<WeatherModuleId, string> = {
  overall: '总览',
  sunny: '晴天',
  fog: '雾天',
  stormy: '雷暴',
  sandstorms: '沙尘',
  cloudy: '多云',
  windy: '大风'
};

export default function WeatherDetailModule({ moduleId }: WeatherDetailModuleProps) {
  const {
    selectedWeather,
    selectedTimePeriod,
    selectedSubView,
    setSelectedSubView,
    switchModule
  } = useInteraction();
  const module = getWeatherModuleById(moduleId);
  const [isReturningOverall, setIsReturningOverall] = useState(false);

  useEffect(() => {
    setSelectedSubView('overview');
    setIsReturningOverall(false);
  }, [moduleId, setSelectedSubView]);

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
      aria-label={`${moduleDisplayName[module.id]}天气模块`}
      style={{ '--module-accent': module.accentColor, '--module-anchor-image': `url(${module.imageUrl})` } as CSSProperties}
    >
      <div className="module-context-strip weather-detail-hero">
        <div className="weather-detail-anchor" aria-hidden="true" />
        <div>
          <span>{moduleDisplayName[module.id]}</span>
          <h2>{moduleDisplayName[module.id]} ETA 模块</h2>
        </div>
        <p>{moduleSubtitle[module.id]}</p>
        <button type="button" className="return-overall-button" onClick={returnToOverall} aria-label="返回总览地图">
          <span aria-hidden="true">←</span>
          返回总览
        </button>
      </div>
      <InteractiveSceneMap />
      <section className="module-analysis-panel" aria-label={`${moduleDisplayName[module.id]}详情分析`}>
        <div className="module-analysis-header">
          <div>
            <span>模块详情</span>
            <h3>{moduleDisplayName[module.id]}分析切片</h3>
          </div>
          <div className="module-tabs module-detail-tabs" role="tablist" aria-label="天气模块分析标签">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`module-tab-button${selectedSubView === tab.id ? ' is-active' : ''}`}
                onClick={() => setSelectedSubView(tab.id)}
                role="tab"
                aria-selected={selectedSubView === tab.id}
                style={{ '--module-accent': module.accentColor } as CSSProperties}
              >
                <span>{tab.label}</span>
                <small>{tab.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <WeatherSubViewPanel
          selectedWeather={selectedWeather}
          selectedSubView={selectedSubView}
          selectedTimePeriod={selectedTimePeriod}
        />
      </section>
    </section>
  );
}
