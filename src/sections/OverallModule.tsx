import { MouseEvent, useState } from 'react';
import MapTooltip from '../components/MapTooltip';
import OverallHotspotLayer from '../components/OverallHotspotLayer';
import { overallHotspots } from '../data/overallHotspots';
import { getWeatherModuleById } from '../data/weatherModules';
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
  const overallModule = getWeatherModuleById('overall');

  const selectHotspot = (hotspot: SceneHotspot) => {
    setHoveredSelection(null);
    setSelectedItem({ type: 'scene_hotspot', item: hotspot });
    if (hotspot.targetModule) {
      switchModule(hotspot.targetModule);
      setSelectedItem({ type: 'scene_hotspot', item: hotspot });
    }
  };

  return (
    <section className="overall-module module-tab-panel" aria-label="FoodETA overall module">
      <header className="scene-map-header module-stage-header">
        <div>
          <span>FoodETA Map Explorer</span>
          <h1>FoodETA 天气总览</h1>
        </div>
        <p>{overallModule.keyQuestion}</p>
      </header>
      <div className="module-map-card overall-module-map" onClick={() => setSelectedItem(null)}>
        <img className="scene-map-image" src={overallModule.imageUrl} alt="FoodETA overall background" draggable={false} />
        <div className="overall-module-copy">
          <strong>Overall</strong>
          <span>{overallModule.summary}</span>
        </div>
        <OverallHotspotLayer
          hotspots={overallHotspots}
          hoveredId={hoveredSelection?.type === 'scene_hotspot' ? hoveredSelection.item.id : null}
          onHover={(hotspot, event) => {
            setHoveredSelection({ type: 'scene_hotspot', item: hotspot });
            setTooltipPoint(pointFromEvent(event));
          }}
          onLeave={() => setHoveredSelection(null)}
          onSelect={selectHotspot}
        />
        <MapTooltip selection={hoveredSelection} x={tooltipPoint.x} y={tooltipPoint.y} />
      </div>
    </section>
  );
}
