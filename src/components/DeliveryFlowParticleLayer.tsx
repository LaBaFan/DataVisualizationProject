import { CSSProperties, MouseEvent } from 'react';
import { DeliveryFlowSegment } from '../types/data';

interface DeliveryFlowParticleLayerProps {
  segments: DeliveryFlowSegment[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (segment: DeliveryFlowSegment, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (segment: DeliveryFlowSegment) => void;
}

function segmentPath(segment: DeliveryFlowSegment) {
  return `M${segment.start[0]} ${segment.start[1]} L${segment.end[0]} ${segment.end[1]}`;
}

function flowColor(segment: DeliveryFlowSegment) {
  if (segment.delay_rate >= 0.62) return '#ef4444';
  if (segment.delay_rate >= 0.42) return '#f97316';
  return '#14b8a6';
}

export default function DeliveryFlowParticleLayer({
  segments,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: DeliveryFlowParticleLayerProps) {
  const rushBoost = selectedTimePeriod === 'lunch_peak' || selectedTimePeriod === 'dinner_peak';

  return (
    <svg className="map-data-layer delivery-flow-particle-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      <defs>
        {segments.map((segment) => (
          <path key={segment.id} id={`flow-path-${segment.id}`} d={segmentPath(segment)} />
        ))}
      </defs>
      {segments.map((segment, index) => {
        const active = hoveredId === segment.id || selectedId === segment.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(segment.weather) && segment.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(segment.time_period) && segment.time_period !== selectedTimePeriod;
        const focused = !weatherMuted && !timeMuted && (selectedWeather !== 'All' || selectedTimePeriod !== 'All');
        const duration = Math.max(3.8, Math.min(8.5, 8.8 - segment.speed * 0.8));

        return (
          <g
            key={segment.id}
            className={`delivery-flow-segment${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}${focused ? ' is-filter-focused' : ''}${rushBoost ? ' is-rush-boosted' : ''}`}
            style={
              {
                '--flow-color': flowColor(segment),
                '--flow-duration': `${duration}s`,
                '--flow-delay': `${(index % 5) * -0.72}s`
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
          >
            <line className="delivery-flow-hit-area" x1={segment.start[0]} y1={segment.start[1]} x2={segment.end[0]} y2={segment.end[1]} />
            <circle className="delivery-flow-particle" r={active ? 5.2 : 3.8}>
              <animateMotion dur={`var(--flow-duration)`} begin={`var(--flow-delay)`} repeatCount="indefinite">
                <mpath href={`#flow-path-${segment.id}`} />
              </animateMotion>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
