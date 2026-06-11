import { CSSProperties, MouseEvent } from 'react';
import { OrderDot } from '../types/data';

interface OrderDotLayerProps {
  dots: OrderDot[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (dot: OrderDot, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (dot: OrderDot) => void;
}

function dotRadius(dot: OrderDot) {
  const basis = dot.order_count ?? dot.delivery_duration_min;
  return Math.max(4, Math.min(13, 3.8 + basis / 13));
}

function dotColor(dot: OrderDot) {
  if (dot.is_delayed || (dot.delay_rate ?? 0) >= 0.55) return '#f15a24';
  if ((dot.delay_rate ?? 0) >= 0.4) return '#f59e0b';
  return '#0f766e';
}

function dotOpacity(dot: OrderDot) {
  return Math.max(0.58, Math.min(0.9, 0.54 + (dot.delay_rate ?? 0.35) * 0.42));
}

export default function OrderDotLayer({
  dots,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: OrderDotLayerProps) {
  return (
    <svg className="map-data-layer order-dot-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {dots.map((dot) => {
        const active = hoveredId === dot.id || selectedId === dot.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(dot.weather) && dot.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(dot.time_period) && dot.time_period !== selectedTimePeriod;
        return (
          <circle
            key={dot.id}
            className={`order-density-dot${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}${!weatherMuted && !timeMuted && selectedTimePeriod !== 'All' ? ' is-time-focused' : ''}`}
            cx={dot.x}
            cy={dot.y}
            r={dotRadius(dot)}
            style={
              {
                '--dot-color': dotColor(dot),
                '--dot-opacity': dotOpacity(dot)
              } as CSSProperties
            }
            role="button"
            tabIndex={0}
            aria-label={dot.order_id ?? dot.id}
            onMouseMove={(event) => onHover(dot, event)}
            onMouseLeave={onLeave}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(dot);
            }}
          />
        );
      })}
    </svg>
  );
}
