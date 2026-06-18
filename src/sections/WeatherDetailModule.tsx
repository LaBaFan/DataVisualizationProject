import { useEffect, type CSSProperties } from 'react';
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
    setSelectedSubView
  } = useInteraction();
  const module = getWeatherModuleById(moduleId);

  useEffect(() => {
    setSelectedSubView('overview');
  }, [moduleId, setSelectedSubView]);

  return (
    <section
      className="weather-detail-module module-tab-panel"
      aria-label={`${moduleDisplayName[module.id]}天气模块`}
      style={{ '--module-accent': module.accentColor, '--module-anchor-image': `url(${module.imageUrl})` } as CSSProperties}
    >
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
