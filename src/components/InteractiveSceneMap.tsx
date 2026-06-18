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
import {
  getWeatherOrderSamples,
  getWeatherRiskScenarios,
  getWeatherTimeRows,
  getWeatherTrafficRows,
  getWeatherVehicleRows
} from '../data/weatherSelectors';
import { getModuleIdBySceneId, getWeatherModuleById } from '../data/weatherModules';
import { useInteraction, type WeatherSubView } from '../store/interactionContext';
import {
  ActiveSection,
  MapSelection,
  MiniMetricTag,
  OrderDot,
  OverviewSummary,
  RiskScenario,
  RiskHeatHalo,
  SceneFilterSummary,
  TimePeriodSummary,
  TrafficDensitySummary,
  WeatherOrderSample,
  WeatherImpactSummary
} from '../types/data';
import MapInsetChart from './map/MapInsetChart';
import SubViewEncodingLayer, { type EncodedSelection } from './map/SubViewEncodingLayer';
import MapTooltip from './MapTooltip';
import MiniMetricTagLayer from './MiniMetricTagLayer';
import OrderDensityDotLayer from './OrderDensityDotLayer';
import OverallHotspotLayer from './OverallHotspotLayer';
import RiskHeatHaloLayer from './RiskHeatHaloLayer';
import SceneTitle from './SceneTitle';
import ViewContextHUD from './ViewContextHUD';

interface SceneHudData {
  overview: OverviewSummary | null;
  weatherRows: WeatherImpactSummary[];
  timeRows: TimePeriodSummary[];
  trafficRows: TrafficDensitySummary[];
  sceneFilterRows: SceneFilterSummary[];
}

interface WeatherOverlayData {
  orderPoints: WeatherOrderSample[];
  trafficRows: Awaited<ReturnType<typeof getWeatherTrafficRows>>;
  timeRows: SceneFilterSummary[];
  vehicleRows: Awaited<ReturnType<typeof getWeatherVehicleRows>>;
  riskRows: RiskScenario[];
}

function isAll(v: string | null | undefined) {
  return !v || v === 'All';
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

function sceneIndex(sceneType: string) {
  if (sceneType === 'weather') return '02';
  if (sceneType === 'traffic') return '03';
  if (sceneType === 'time') return '04';
  if (sceneType === 'risk') return '05';
  if (sceneType === 'overall') return '01';
  return '06';
}

/**
 * Override overlay element metrics with filtered scene_filter_summary data.
 * Positions and labels stay the same; only the displayed numbers change.
 */
function applyFilterToOverlay<T extends { order_count?: number; avg_delivery_duration_min?: number; delay_rate?: number; risk_score?: number }>(
  element: T,
  filteredRow: SceneFilterSummary | undefined,
  baseRow: SceneFilterSummary | undefined
): T {
  if (!filteredRow) return element;
  if (!baseRow) return element;

  // Scale order_count proportionally
  const baseOrders = baseRow.order_count || 1;
  const filteredOrders = filteredRow.order_count || 0;
  const scale = filteredOrders / baseOrders;

  return {
    ...element,
    order_count: Math.max(1, Math.round((element.order_count ?? 1) * scale)),
    avg_delivery_duration_min: filteredRow.avg_delivery_duration_min,
    delay_rate: filteredRow.delay_rate,
    risk_score: filteredRow.risk_score ?? element.risk_score
  };
}

export default function InteractiveSceneMap() {
  const {
    selectedSceneId,
    selectedWeather,
    selectedTimePeriod,
    overallFilter,
    selectedItem,
    selectedSubView,
    setSelectedItem,
    setSelectedSceneId,
    setActiveSection,
    setSelectedTimePeriod,
    switchModule
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
  const [weatherOverlayData, setWeatherOverlayData] = useState<WeatherOverlayData>({
    orderPoints: [],
    trafficRows: [],
    timeRows: [],
    vehicleRows: [],
    riskRows: []
  });
  const selectedScene = getMapSceneById(selectedSceneId);
  const activeScene = activeSectionForScene(selectedScene.type);
  const selectedModule = getWeatherModuleById(getModuleIdBySceneId(selectedScene.id));
  const sceneImage = selectedScene.type === 'weather' || selectedScene.id === 'overall'
    ? selectedModule.imageUrl
    : selectedScene.image;
  const isWeatherModule = selectedScene.type === 'weather' && selectedScene.id !== 'overall';

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

  useEffect(() => {
    if (!isWeatherModule) return;
    let isMounted = true;
    Promise.all([
      getWeatherOrderSamples(selectedWeather, selectedTimePeriod),
      getWeatherTrafficRows(selectedWeather),
      getWeatherTimeRows(selectedWeather),
      getWeatherVehicleRows(selectedWeather),
      getWeatherRiskScenarios(selectedWeather)
    ])
      .then(([orderPoints, trafficRows, timeRows, vehicleRows, riskRows]) => {
        if (!isMounted) return;
        setWeatherOverlayData({ orderPoints, trafficRows, timeRows, vehicleRows, riskRows });
      })
      .catch((error) => {
        console.warn('[InteractiveSceneMap] Failed to load weather overlay data.', error);
      });

    return () => {
      isMounted = false;
    };
  }, [isWeatherModule, selectedWeather, selectedTimePeriod]);

  // Filter overall hotspots based on overallFilter
  const filteredHotspots = useMemo(() => {
    if (overallFilter === 'all') return overallHotspots;

    return overallHotspots.filter((hotspot) => {
      const targetScene = mapScenes.find((s) => s.id === hotspot.targetSceneId);
      if (!targetScene) return false;
      if (overallFilter === 'weather') return targetScene.type === 'weather';
      // Area group includes: area, traffic, risk, time (everything except weather and overall)
      if (overallFilter === 'area') return targetScene.type !== 'weather' && targetScene.type !== 'overall';
      return true;
    });
  }, [overallFilter]);

  // Base overlays filtered by scene, then by overallFilter on the overall scene
  const baseOverlays = useMemo(
    () => {
      const halos = sceneRiskHeatHalos.filter((item) => {
        if (item.sceneId !== selectedScene.id) return false;
        // On overall scene, filter by group
        if (selectedScene.id === 'overall' && overallFilter !== 'all' && item.group) {
          return item.group === overallFilter;
        }
        return true;
      });
      const dots = sceneOrderDots.filter((item) => {
        if (item.sceneId !== selectedScene.id) return false;
        if (selectedScene.id === 'overall' && overallFilter !== 'all' && item.group) {
          return item.group === overallFilter;
        }
        return true;
      });
      const tags = sceneMiniMetricTags.filter((item) => {
        if (item.sceneId !== selectedScene.id) return false;
        if (selectedScene.id === 'overall' && overallFilter !== 'all' && item.group) {
          return item.group === overallFilter;
        }
        return true;
      });
      return { halos, dots, tags };
    },
    [selectedScene.id, overallFilter]
  );

  // Compute filtered overlays: update metrics from scene_filter_summary
  const overlays = useMemo(() => {
    const filterRows = hudData.sceneFilterRows;
    if (!filterRows.length) return baseOverlays;

    const weather = isAll(selectedWeather) ? 'All' : selectedWeather;
    const timePeriod = isAll(selectedTimePeriod) ? 'All' : selectedTimePeriod;

    // If no filter is active, return base overlays
    if (weather === 'All' && timePeriod === 'All') return baseOverlays;

    // Find the filtered row and the base row ("All"/"All") for the current scene
    const filteredRow = filterRows.find(
      (r) => r.scene_id === selectedScene.id && r.weather === weather && r.time_period === timePeriod
    );
    const baseRow = filterRows.find(
      (r) => r.scene_id === selectedScene.id && r.weather === 'All' && r.time_period === 'All'
    );

    if (!filteredRow || !baseRow) return baseOverlays;

    return {
      halos: baseOverlays.halos.map((halo) => applyFilterToOverlay(halo, filteredRow, baseRow)),
      dots: baseOverlays.dots.map((dot) => applyFilterToOverlay(dot, filteredRow, baseRow)),
      tags: baseOverlays.tags.map((tag) => applyFilterToOverlay(tag, filteredRow, baseRow))
    };
  }, [baseOverlays, hudData.sceneFilterRows, selectedScene.id, selectedWeather, selectedTimePeriod]);

  const selectedId = selectedItem?.item.id ?? null;
  const hoveredId = hoveredSelection?.item.id ?? null;
  const weatherSummary = useMemo(
    () => hudData.weatherRows.find((row) => row.weather === selectedWeather) ?? null,
    [hudData.weatherRows, selectedWeather]
  );
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

  const handleEncodedSelect = (selection: EncodedSelection) => {
    setSelectedItem(selection);
    setHoveredSelection(null);
  };

  const handleEncodedHover = (selection: EncodedSelection, event: MouseEvent<SVGElement>) => {
    setHoveredSelection(selection);
    setTooltipPoint(pointFromEvent(event));
  };

  return (
    <main className="scene-map-stage" aria-label="Interactive FoodETA Map">
      <SceneTitle
        index={sceneIndex(selectedScene.type)}
        kicker={`FOODETA / ${selectedScene.type.toUpperCase()}`}
        title={selectedScene.title}
        question={selectedScene.question}
      />
      <div
        className={`interactive-scene-map scene-${selectedScene.type} time-tone-${selectedTimePeriod}`}
        onClick={() => setSelectedItem(null)}
      >
        <img key={sceneImage} className="scene-map-image" src={sceneImage} alt={selectedScene.title} draggable={false} />
        <ViewContextHUD metrics={hudMetrics} />

        {selectedScene.id === 'overall' ? (
          <OverallHotspotLayer
            hotspots={filteredHotspots}
            hoveredId={hoveredSelection?.type === 'scene_hotspot' ? hoveredSelection.item.id : null}
            onHover={(hotspot, event) => {
              setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
              setTooltipPoint(pointFromEvent(event));
            }}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(hotspot) => {
              if (hotspot.targetModule) {
                switchModule(hotspot.targetModule);
                setSelectedItem({ type: 'scene_hotspot', item: hotspot });
                setHoveredSelection(null);
                return;
              }

              const targetScene = mapScenes.find((scene) => scene.id === hotspot.targetSceneId);
              setSelectedItem({ type: 'scene_hotspot', item: hotspot });
              setSelectedSceneId(hotspot.targetSceneId);
              if (targetScene) setActiveSection(activeSectionForScene(targetScene.type));
              setHoveredSelection(null);
            }}
          />
        ) : null}

        {!isWeatherModule ? (
          <>
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
          </>
        ) : (
          <>
            <SubViewEncodingLayer
              selectedSubView={'overview' as WeatherSubView}
              selectedWeather={selectedWeather}
              summary={weatherSummary}
              trafficRows={weatherOverlayData.trafficRows}
              timeRows={weatherOverlayData.timeRows}
              vehicleRows={weatherOverlayData.vehicleRows}
              riskRows={weatherOverlayData.riskRows}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={handleEncodedHover}
              onLeave={() => setHoveredSelection(null)}
              onSelect={handleEncodedSelect}
              onTimeSelect={setSelectedTimePeriod}
            />
            <MapInsetChart
              selectedSubView={selectedSubView}
              selectedWeather={selectedWeather}
              selectedTimePeriod={selectedTimePeriod}
              summary={weatherSummary}
              orderPoints={weatherOverlayData.orderPoints}
              trafficRows={weatherOverlayData.trafficRows}
              timeRows={weatherOverlayData.timeRows}
              vehicleRows={weatherOverlayData.vehicleRows}
              riskRows={weatherOverlayData.riskRows}
              selectedId={selectedId}
              onHover={(selection, event) => {
                setHoveredSelection(selection);
                setTooltipPoint(pointFromEvent(event));
              }}
              onLeave={() => setHoveredSelection(null)}
              onSelect={(selection) => {
                setSelectedItem(selection);
                setHoveredSelection(null);
              }}
              onTimeSelect={setSelectedTimePeriod}
            />
          </>
        )}
        {!isWeatherModule ? (
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
        ) : null}

        <MapTooltip selection={hoveredSelection} x={tooltipPoint.x} y={tooltipPoint.y} />
      </div>
    </main>
  );
}
