import { MouseEvent } from 'react';
import { SceneHotspot } from '../types/data';

interface OverallHotspotLayerProps {
  hotspots: SceneHotspot[];
  hoveredId?: string | null;
  onHover: (hotspot: SceneHotspot, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (hotspot: SceneHotspot) => void;
}

function renderShape(hotspot: SceneHotspot) {
  if (hotspot.type === 'rect') {
    const [x, y, width, height] = hotspot.coords;
    return <rect x={x} y={y} width={width} height={height} rx={18} />;
  }

  if (hotspot.type === 'circle') {
    const [cx, cy, r] = hotspot.coords;
    return <circle cx={cx} cy={cy} r={r} />;
  }

  return <polygon points={hotspot.coords.reduce<string[]>((points, value, index, coords) => {
    if (index % 2 === 0) points.push(`${value},${coords[index + 1]}`);
    return points;
  }, []).join(' ')} />;
}

export default function OverallHotspotLayer({ hotspots, hoveredId, onHover, onLeave, onSelect }: OverallHotspotLayerProps) {
  return (
    <svg className="map-data-layer map-hotspot-layer overall-hotspot-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {hotspots.map((hotspot) => (
        <g
          key={hotspot.id}
          className={`map-hotspot overall-hotspot${hoveredId === hotspot.id ? ' is-hovered' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={hotspot.label}
          onMouseMove={(event) => onHover(hotspot, event)}
          onMouseLeave={onLeave}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(hotspot);
          }}
        >
          {renderShape(hotspot)}
        </g>
      ))}
    </svg>
  );
}
