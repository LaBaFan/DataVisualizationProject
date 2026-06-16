import { useState } from 'react';
import { mapScenes } from '../data/mapScenes';
import { OverallFilter, useInteraction } from '../store/interactionContext';

const weatherSceneMap: Record<string, { weather: string; note?: string }> = {
  sunny: { weather: 'Sunny' },
  fog_business: { weather: 'Fog' },
  storm_area: { weather: 'Stormy' },
  sandstorm: { weather: 'Sandstorms' },
  cloudy: { weather: 'Cloudy' },
  windy: { weather: 'Windy' }
};

interface SceneGroup {
  title: string;
  filter: OverallFilter;
  sceneIds: string[];
}

const sceneGroups: SceneGroup[] = [
  {
    title: '天气模块',
    filter: 'weather',
    sceneIds: ['sunny', 'fog_business', 'storm_area', 'sandstorm', 'cloudy', 'windy']
  },
  {
    title: '区域模块',
    filter: 'area',
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
  const {
    selectedSceneId,
    overallFilter,
    setSelectedSceneId,
    setOverallFilter,
    setSelectedWeather,
    setSelectedTimePeriod,
    setActiveSection
  } = useInteraction();

  const [expandedGroup, setExpandedGroup] = useState<OverallFilter | null>(null);

  const selectOverall = () => {
    setSelectedSceneId('overall');
    setOverallFilter('all');
    setSelectedWeather('All');
    setSelectedTimePeriod('All');
    setActiveSection('overview');
    setExpandedGroup(null);
  };

  const selectGroupHeader = (group: SceneGroup) => {
    // Toggle expand/collapse
    const isAlreadyExpanded = expandedGroup === group.filter && overallFilter === group.filter;
    if (isAlreadyExpanded) {
      // Collapse and go back to overall
      selectOverall();
      return;
    }

    // Expand this group and show filtered overall map
    setExpandedGroup(group.filter);
    setSelectedSceneId('overall');
    setOverallFilter(group.filter);
    setSelectedWeather('All');
    setSelectedTimePeriod('All');
    setActiveSection('overview');
  };

  const selectSubScene = (sceneId: string) => {
    const scene = mapScenes.find((item) => item.id === sceneId);
    if (!scene) return;

    setSelectedSceneId(sceneId);
    if (scene.type !== 'overall') setActiveSection(scene.type === 'area' ? 'overview' : scene.type);

    const weatherConfig = weatherSceneMap[sceneId];
    if (weatherConfig) {
      setSelectedWeather(weatherConfig.weather);
    } else {
      setSelectedWeather('All');
    }

    if (scene.relatedTimePeriod) {
      setSelectedTimePeriod(scene.relatedTimePeriod);
    } else {
      setSelectedTimePeriod('All');
    }
  };

  const isGroupActive = (group: SceneGroup) => {
    // Active if overall filter matches and we're on overall scene
    if (selectedSceneId === 'overall' && overallFilter === group.filter) return true;
    // Active if a sub-scene in this group is selected
    return group.sceneIds.includes(selectedSceneId);
  };

  const isGroupExpanded = (group: SceneGroup) => {
    // Expanded if explicitly expanded or if a sub-scene is selected
    return expandedGroup === group.filter || group.sceneIds.includes(selectedSceneId);
  };

  return (
    <aside className="scene-sidebar" aria-label="Scene Navigation">
      <div className="rail-title">
        <span>Scene</span>
        <strong>地图入口</strong>
      </div>
      <nav className="scene-nav">
        {/* Overall button */}
        <button
          type="button"
          className={selectedSceneId === 'overall' && overallFilter === 'all' ? 'is-active' : ''}
          onClick={selectOverall}
        >
          <span>总览地图</span>
          <small>Overall</small>
        </button>

        {/* Group headers with expandable sub-items */}
        {sceneGroups.map((group) => {
          const active = isGroupActive(group);
          const expanded = isGroupExpanded(group);

          return (
            <section key={group.title} className={`scene-nav-group${expanded ? ' is-expanded' : ''}`}>
              <button
                type="button"
                className={`scene-group-header${active ? ' is-active' : ''}`}
                onClick={() => selectGroupHeader(group)}
              >
                <span>{group.title}</span>
                <small>{expanded ? '▾' : '▸'}</small>
              </button>

              {expanded && (
                <div className="scene-group-items">
                  {group.sceneIds.map((sceneId) => {
                    const scene = mapScenes.find((item) => item.id === sceneId);
                    if (!scene) return null;
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        className={selectedSceneId === scene.id ? 'is-active' : ''}
                        onClick={() => selectSubScene(scene.id)}
                      >
                        <span>{scene.title}</span>
                        <small>{scene.metrics[0]?.value ?? scene.type}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
