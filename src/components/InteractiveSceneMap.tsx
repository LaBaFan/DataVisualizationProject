import { MouseEvent, useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadSceneFilterSummary,
  loadTimePeriodSummary,
  loadTrafficDensitySummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import { mapScenes, getMapSceneById } from '../data/mapScenes';
import { overallHotspots } from '../data/overallHotspots';
import { sceneMiniMetricTags, sceneOrderDots, sceneRiskHeatHalos } from '../data/sceneOverlayData';
import { buildSceneHudMetrics } from '../data/sceneMetrics';
import { useInteraction } from '../store/interactionContext';
import {
  ActiveSection,
  MapSelection,
  OverviewSummary,
  SceneFilterSummary,
  TimePeriodSummary,
  TrafficDensitySummary,
  WeatherImpactSummary
} from '../types/data';
import MapTooltip from './MapTooltip';
import MiniMetricTagLayer from './MiniMetricTagLayer';
import OrderDensityDotLayer from './OrderDensityDotLayer';
import OverallHotspotLayer from './OverallHotspotLayer';
import RiskHeatHaloLayer from './RiskHeatHaloLayer';
import ViewContextHUD from './ViewContextHUD';

interface SceneHudData {
  overview: OverviewSummary | null;
  weatherRows: WeatherImpactSummary[];
  timeRows: TimePeriodSummary[];
  trafficRows: TrafficDensitySummary[];
  sceneFilterRows: SceneFilterSummary[];
}

function pointFromEvent(event: MouseEvent<SVGElement>) {
  const stage = (event.currentTarget as SVGElement).closest('.interactive-scene-map');
  const rect = stage?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function activeSectionForScene(sceneType: string): ActiveSection {
  if (sceneType === 'weather' || sceneType === 'traffic' || sceneType === 'time' || sceneType === 'risk') return sceneType;
  return 'overview';
}

export default function InteractiveSceneMap() {
  const {
    selectedSceneId,
    selectedWeather,
    selectedTimePeriod,
    selectedItem,
    setSelectedItem,
    setSelectedSceneId,
    setActiveSection
  } = useInteraction();
  const [hoveredSelection, setHoveredSelection] = useState<MapSelection | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState({ x: 0, y: 0 });
  const [hudData, setHudData] = useState<SceneHudData>({
    overview: null,
    weatherRows: [],
    timeRows: [],
    trafficRows: [],
    sceneFilterRows: []
  });
  const selectedScene = getMapSceneById(selectedSceneId);
  const activeScene = activeSectionForScene(selectedScene.type);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadOverviewSummary(),
      loadWeatherImpactSummary(),
      loadTimePeriodSummary(),
      loadTrafficDensitySummary(),
      loadSceneFilterSummary()
    ])
      .then(([overview, weatherRows, timeRows, trafficRows, sceneFilterRows]) => {
        if (!isMounted) return;
        setHudData({ overview, weatherRows, timeRows, trafficRows, sceneFilterRows });
      })
      .catch((error) => {
        console.warn('[InteractiveSceneMap] Failed to load scene HUD summaries.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const overlays = useMemo(
    () => ({
      halos: sceneRiskHeatHalos.filter((item) => item.sceneId === selectedScene.id),
      dots: sceneOrderDots.filter((item) => item.sceneId === selectedScene.id),
      tags: sceneMiniMetricTags.filter((item) => item.sceneId === selectedScene.id)
    }),
    [selectedScene.id]
  );

  const selectedId = selectedItem?.item.id ?? null;
  const hoveredId = hoveredSelection?.item.id ?? null;
  const hudMetrics = useMemo(
    () =>
      buildSceneHudMetrics({
        selectedScene,
        selectedWeather,
        selectedTimePeriod,
        overview: hudData.overview,
        weatherRows: hudData.weatherRows,
        timeRows: hudData.timeRows,
        trafficRows: hudData.trafficRows,
        sceneFilterRows: hudData.sceneFilterRows
      }),
    [hudData, selectedScene, selectedTimePeriod, selectedWeather]
  );

  return (
    <main className="scene-map-stage" aria-label="Interactive FoodETA Map">
      <header className="scene-map-header">
        <div>
          <span>FoodETA Map Explorer</span>
          <h1>{selectedScene.title}</h1>
        </div>
        <p>{selectedScene.question}</p>
      </header>
      <div
        className={`interactive-scene-map scene-${selectedScene.type} time-tone-${selectedTimePeriod}`}
        onClick={() => setSelectedItem(null)}
      >
        <img key={selectedScene.image} className="scene-map-image" src={selectedScene.image} alt={selectedScene.title} draggable={false} />
        <ViewContextHUD metrics={hudMetrics} />

        {selectedScene.id === 'overall' ? (
          <OverallHotspotLayer
            hotspots={overallHotspots}
            hoveredId={hoveredSelection?.type === 'scene_hotspot' ? hoveredSelection.item.id : null}
            onHover={(hotspot, event) => {
              setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
              setTooltipPoint(pointFromEvent(event));
            }}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(hotspot) => {
              const targetScene = mapScenes.find((scene) => scene.id === hotspot.targetSceneId);
              setSelectedSceneId(hotspot.targetSceneId);
              if (targetScene) setActiveSection(activeSectionForScene(targetScene.type));
              setHoveredSelection(null);
            }}
          />
        ) : null}

        <RiskHeatHaloLayer
          halos={overlays.halos}
          hoveredId={hoveredId}
          selectedId={selectedId}
          selectedWeather={selectedWeather}
          selectedTimePeriod={selectedTimePeriod}
          activeScene={activeScene}
          onHover={(halo, event) => {
            setHoveredSelection({ type: 'risk_heat_halo', item: halo });
            setTooltipPoint(pointFromEvent(event));
          }}
          onLeave={() => setHoveredSelection(null)}
          onSelect={(halo) => setSelectedItem({ type: 'risk_heat_halo', item: halo })}
        />
        <OrderDensityDotLayer
          dots={overlays.dots}
          hoveredId={hoveredId}
          selectedId={selectedId}
          selectedWeather={selectedWeather}
          selectedTimePeriod={selectedTimePeriod}
          activeScene={activeScene}
          onHover={(dot, event) => {
            setHoveredSelection({ type: 'order_dot', item: dot });
            setTooltipPoint(pointFromEvent(event));
          }}
          onLeave={() => setHoveredSelection(null)}
          onSelect={(dot) => setSelectedItem({ type: 'order_dot', item: dot })}
        />
        <MiniMetricTagLayer
          tags={overlays.tags}
          hoveredId={hoveredId}
          selectedId={selectedId}
          selectedWeather={selectedWeather}
          selectedTimePeriod={selectedTimePeriod}
          activeScene={activeScene}
          onHover={(tag, event) => {
            setHoveredSelection({ type: 'metric_tag', item: tag });
            setTooltipPoint(pointFromEvent(event));
          }}
          onLeave={() => setHoveredSelection(null)}
          onSelect={(tag) => setSelectedItem({ type: 'metric_tag', item: tag })}
        />

        <MapTooltip selection={hoveredSelection} x={tooltipPoint.x} y={tooltipPoint.y} />
      </div>
    </main>
  );
}
