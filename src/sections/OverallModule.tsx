import { MouseEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import MapTooltip from '../components/MapTooltip';
import OverallHotspotLayer from '../components/OverallHotspotLayer';
import { overallHotspots } from '../data/overallHotspots';
import { getWeatherModuleById, WeatherModuleId } from '../data/weatherModules';
import { useInteraction } from '../store/interactionContext';
import type { MapSelection, SceneHotspot } from '../types/data';

function pointFromEvent(event: MouseEvent<SVGElement>) {
  const stage = (event.currentTarget as SVGElement).closest('.overall-module-map');
  const rect = stage?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

export default function OverallModule() {
  const { setSelectedItem, switchModule } = useInteraction();
  const [hoveredSelection, setHoveredSelection] = useState<MapSelection | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState({ x: 0, y: 0 });
  const [enteringHotspot, setEnteringHotspot] = useState<SceneHotspot | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const overallModule = getWeatherModuleById('overall');
  const activeHotspot = enteringHotspot ?? (hoveredSelection?.type === 'scene_hotspot' ? hoveredSelection.item : null);
  const navigableHotspots = useMemo(() => overallHotspots.filter((hotspot) => hotspot.targetModule), []);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        window.clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  const selectHotspot = (hotspot: SceneHotspot) => {
    setSelectedItem({ type: 'scene_hotspot', item: hotspot });
    if (!hotspot.targetModule || enteringHotspot) {
      setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
      return;
    }

    setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
    setEnteringHotspot(hotspot);
    if (transitionTimer.current) {
      window.clearTimeout(transitionTimer.current);
    }
    transitionTimer.current = window.setTimeout(() => {
      switchModule(hotspot.targetModule as WeatherModuleId);
      setSelectedItem({ type: 'scene_hotspot', item: hotspot });
      setEnteringHotspot(null);
      transitionTimer.current = null;
    }, 520);
  };

  const handleFocusHotspot = (hotspot: SceneHotspot) => {
    setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
    setSelectedItem({ type: 'scene_hotspot', item: hotspot });
    setTooltipPoint({ x: window.innerWidth * 0.5, y: 160 });
  };

  return (
    <section
      className={`overall-module module-tab-panel${activeHotspot ? ' has-active-hotspot' : ''}${enteringHotspot ? ' is-entering-module' : ''}`}
      aria-label="FoodETA overall module"
      style={{ '--overall-accent': activeHotspot?.targetModule ? getWeatherModuleById(activeHotspot.targetModule).accentColor : overallModule.accentColor } as CSSProperties}
    >
      <header className="scene-map-header module-stage-header">
        <div>
          <span>FoodETA Map Explorer</span>
          <h1>FoodETA 天气总览</h1>
        </div>
        <p>{overallModule.keyQuestion}</p>
      </header>
      <div
        className="module-map-card overall-module-map"
        onClick={() => {
          setSelectedItem(null);
          setHoveredSelection(null);
        }}
        aria-label="FoodETA 天气总览背景图导航地图"
      >
        <img className="scene-map-image" src={overallModule.imageUrl} alt="FoodETA overall background" draggable={false} />
        <div className="overall-map-vignette" aria-hidden="true" />
        <div className="overall-module-copy">
          <strong>Overall Navigation Map</strong>
          <span>{overallModule.summary}</span>
        </div>
        <OverallHotspotLayer
          hotspots={overallHotspots}
          hoveredId={activeHotspot?.id ?? null}
          onHover={(hotspot, event) => {
            setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
            setTooltipPoint(pointFromEvent(event));
          }}
          onLeave={() => setHoveredSelection(null)}
          onFocus={handleFocusHotspot}
          onSelect={selectHotspot}
        />
        {activeHotspot ? (
          <aside className="overall-hotspot-info" aria-live="polite">
            <span>{activeHotspot.targetModule ? 'Enter weather module' : 'Reference zone'}</span>
            <h2>{activeHotspot.label}</h2>
            <p>{activeHotspot.description}</p>
            <div className="overall-info-metrics" aria-label={`${activeHotspot.label}关键指标`}>
              <div>
                <small>Orders</small>
                <strong>{activeHotspot.order_count?.toLocaleString() ?? '-'}</strong>
              </div>
              <div>
                <small>Avg ETA</small>
                <strong>{activeHotspot.avg_delivery_duration_min?.toFixed(1) ?? '-'} min</strong>
              </div>
              <div>
                <small>Delay</small>
                <strong>{typeof activeHotspot.delay_rate === 'number' ? `${Math.round(activeHotspot.delay_rate * 100)}%` : '-'}</strong>
              </div>
              <div>
                <small>Risk</small>
                <strong>{activeHotspot.risk_score?.toFixed(2) ?? '-'}</strong>
              </div>
            </div>
          </aside>
        ) : null}
        {enteringHotspot ? (
          <div className="overall-enter-reveal" aria-hidden="true">
            <span>{enteringHotspot.label}</span>
          </div>
        ) : null}
        <MapTooltip selection={hoveredSelection} x={tooltipPoint.x} y={tooltipPoint.y} />
      </div>
      <nav className="overall-mobile-entry-list" aria-label="移动端天气模块入口">
        {navigableHotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            type="button"
            onFocus={() => handleFocusHotspot(hotspot)}
            onMouseEnter={() => setHoveredSelection({ type: 'scene_hotspot', item: hotspot })}
            onClick={() => selectHotspot(hotspot)}
          >
            <span>{hotspot.label}</span>
            <small>{hotspot.avg_delivery_duration_min?.toFixed(1) ?? '-'} min ETA</small>
          </button>
        ))}
      </nav>
    </section>
  );
}
