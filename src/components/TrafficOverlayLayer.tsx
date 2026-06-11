import { CSSProperties, MouseEvent } from 'react';
import { TrafficSegment } from '../types/data';

interface TrafficOverlayLayerProps {
  segments: TrafficSegment[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (segment: TrafficSegment, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (segment: TrafficSegment) => void;
}

const trafficColors: Record<TrafficSegment['traffic_density'], string> = {
  Low: '#0f766e',
  Medium: '#f59e0b',
  High: '#f97316',
  Jam: '#ef4444',
  Unknown: '#64748b'
};

function strokeWidth(orderCount: number) {
  return Math.max(3, Math.min(7, 3 + orderCount / 240));
}

function opacity(delayRate: number) {
  return Math.max(0.42, Math.min(0.82, 0.32 + delayRate * 0.58));
}

export default function TrafficOverlayLayer({
  segments,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: TrafficOverlayLayerProps) {
  return (
    <svg className="map-data-layer traffic-overlay-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {segments.map((segment) => {
        const active = hoveredId === segment.id || selectedId === segment.id;
        const trafficBoost =
          selectedTimePeriod === 'lunch_peak' || selectedTimePeriod === 'dinner_peak' || selectedTimePeriod === 'night';
        const weatherFocus = selectedWeather !== 'All' && (segment.traffic_density === 'Jam' || segment.traffic_density === 'High');
        return (
          <path
            key={segment.id}
            className={`traffic-segment${active ? ' is-active' : ''}${trafficBoost ? ' is-time-boosted' : ''}${weatherFocus ? ' is-weather-focused' : ''}`}
            d={segment.path}
            style={
              {
                '--traffic-color': trafficColors[segment.traffic_density],
                '--traffic-width': strokeWidth(segment.order_count),
                '--traffic-opacity': opacity(segment.delay_rate)
              } as CSSProperties
            }
            role="button"
            tabIndex={0}
            aria-label={segment.label}
            onMouseMove={(event) => onHover(segment, event)}
            onMouseLeave={onLeave}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(segment);
            }}
          />
        );
      })}
    </svg>
  );
}
