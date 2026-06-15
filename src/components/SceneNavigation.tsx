import { mapScenes } from '../data/mapScenes';
import { useInteraction } from '../store/interactionContext';

const weatherSceneMap: Record<string, { weather: string; note?: string }> = {
  sunny: { weather: 'Sunny' },
  fog_business: { weather: 'Fog' },
  storm_area: { weather: 'Stormy' },
  sandstorm: { weather: 'Sandstorms' },
  cloudy: { weather: 'Cloudy' },
  windy: { weather: 'Windy' }
};

const sceneGroups = [
  {
    title: '总览',
    sceneIds: ['overall']
  },
  {
    title: '天气模块',
    sceneIds: ['sunny', 'fog_business', 'storm_area', 'sandstorm', 'cloudy', 'windy']
  },
  {
    title: '区域模块',
    sceneIds: [
      'dispatch_center',
      'restaurant_street',
      'traffic_hub',
      'high_risk_residential',
      'night_low_peak',
      'mixed_food_community'
    ]
  }
];

export default function SceneNavigation() {
  const { selectedSceneId, setSelectedSceneId, setSelectedWeather, setSelectedTimePeriod, setActiveSection } = useInteraction();

  const selectScene = (sceneId: string) => {
    const scene = mapScenes.find((item) => item.id === sceneId);
    if (!scene) return;

    setSelectedSceneId(sceneId);
    if (scene.type !== 'overall') setActiveSection(scene.type === 'area' ? 'overview' : scene.type);

    const weatherConfig = weatherSceneMap[sceneId];
    if (weatherConfig) {
      setSelectedWeather(weatherConfig.weather);
    } else if (sceneId === 'overall') {
      setSelectedWeather('All');
      setSelectedTimePeriod('All');
    }

    if (scene.relatedTimePeriod) {
      setSelectedTimePeriod(scene.relatedTimePeriod);
    } else if (sceneId !== 'overall') {
      setSelectedTimePeriod('All');
    }
  };

  return (
    <aside className="scene-sidebar" aria-label="Scene Navigation">
      <div className="rail-title">
        <span>Scene</span>
        <strong>地图入口</strong>
      </div>
      <nav className="scene-nav">
        {sceneGroups.map((group) => (
          <section key={group.title} className="scene-nav-group">
            <h3>{group.title}</h3>
            {group.sceneIds.map((sceneId) => {
              const scene = mapScenes.find((item) => item.id === sceneId);
              if (!scene) return null;
              return (
                <button
                  key={scene.id}
                  type="button"
                  className={selectedSceneId === scene.id ? 'is-active' : ''}
                  onClick={() => selectScene(scene.id)}
                >
                  <span>{scene.title}</span>
                  <small>{scene.metrics[0]?.value ?? scene.type}</small>
                </button>
              );
            })}
          </section>
        ))}
      </nav>
    </aside>
  );
}
