import { CSSProperties, MouseEvent } from 'react';
import { MapModule } from '../types/data';

interface MapInteractionLayerProps {
  modules: MapModule[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (module: MapModule, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (module: MapModule | null) => void;
}

const typeColors: Record<MapModule['type'], string> = {
  restaurant: '#f97316',
  building: '#64748b',
  road: '#f05a28',
  weather: '#2563eb',
  risk_zone: '#ef4444',
  customer_area: '#7c3aed',
  order_point: '#0f766e',
  rider: '#0891b2'
};

function points(coords: number[] | string) {
  return Array.isArray(coords) ? coords.join(' ') : '';
}

function renderShape(
  module: MapModule,
  active: boolean,
  hovered: boolean,
  filtered: boolean,
  timeFiltered: boolean,
  handlers: {
    onMouseMove: (event: MouseEvent<SVGElement>) => void;
    onMouseLeave: () => void;
    onClick: (event: MouseEvent<SVGElement>) => void;
  }
) {
  const color = typeColors[module.type];
  const className = `map-hotspot map-hotspot-${module.type}${active ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}${filtered ? ' is-filter-muted' : ''}${timeFiltered ? ' is-time-muted' : ''}`;
  const common = {
    className,
    style: { '--module-color': color } as CSSProperties,
    onMouseMove: handlers.onMouseMove,
    onMouseLeave: handlers.onMouseLeave,
    onClick: handlers.onClick,
    tabIndex: 0,
    role: 'button',
    'aria-label': module.label
  };

  if (module.shape === 'rect' && Array.isArray(module.coords)) {
    const [x, y, width, height] = module.coords;
    return <rect key={module.id} x={x} y={y} width={width} height={height} {...common} />;
  }

  if (module.shape === 'circle' && Array.isArray(module.coords)) {
    const [cx, cy, r] = module.coords;
    return <circle key={module.id} cx={cx} cy={cy} r={r} {...common} />;
  }

  if (module.shape === 'path' && typeof module.coords === 'string') {
    return <path key={module.id} d={module.coords} {...common} />;
  }

  return <polygon key={module.id} points={points(module.coords)} {...common} />;
}

export default function MapInteractionLayer({
  modules,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: MapInteractionLayerProps) {
  return (
    <svg
      className="map-interaction-layer"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="none"
      aria-label="Delivery Operation Map interaction layer"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {modules.map((module) =>
        renderShape(
          module,
          selectedId === module.id,
          hoveredId === module.id,
          selectedWeather !== 'All' && Boolean(module.weather) && module.weather !== selectedWeather,
          selectedTimePeriod !== 'All' && Boolean(module.time_period) && module.time_period !== selectedTimePeriod,
          {
            onMouseMove: (event) => onHover(module, event),
            onMouseLeave: onLeave,
            onClick: (event) => {
              event.stopPropagation();
              onSelect(module);
            }
          }
        )
      )}
    </svg>
  );
}
