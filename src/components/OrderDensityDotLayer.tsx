import { CSSProperties, MouseEvent } from 'react';
import { OrderDot } from '../types/data';

interface OrderDensityDotLayerProps {
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
  return Math.max(3.2, Math.min(11.5, 3.2 + basis / 15));
}

function dotColor(dot: OrderDot) {
  if (dot.is_delayed || (dot.delay_rate ?? 0) >= 0.55) return '#ef6c2f';
  if ((dot.delay_rate ?? 0) >= 0.38) return '#f59e0b';
  return '#0f8b78';
}

function dotOpacity(dot: OrderDot) {
  return Math.max(0.48, Math.min(0.82, 0.42 + (dot.delay_rate ?? 0.28) * 0.5));
}

export default function OrderDensityDotLayer({
  dots,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: OrderDensityDotLayerProps) {
  const rushBoost = selectedTimePeriod === 'lunch_peak' || selectedTimePeriod === 'dinner_peak';

  return (
    <svg className="map-data-layer order-density-dot-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {dots.map((dot) => {
        const active = hoveredId === dot.id || selectedId === dot.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(dot.weather) && dot.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(dot.time_period) && dot.time_period !== selectedTimePeriod;
        const focused = !weatherMuted && !timeMuted && (selectedWeather !== 'All' || selectedTimePeriod !== 'All');
        return (
          <circle
            key={dot.id}
            className={`order-density-dot${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}${focused ? ' is-filter-focused' : ''}${rushBoost ? ' is-rush-boosted' : ''}`}
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
