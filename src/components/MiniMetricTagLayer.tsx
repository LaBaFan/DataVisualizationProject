import { MouseEvent } from 'react';
import { MiniMetricTag } from '../types/data';

interface MiniMetricTagLayerProps {
  tags: MiniMetricTag[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (tag: MiniMetricTag, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (tag: MiniMetricTag) => void;
}

function percent(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
}

function minutes(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value)}m` : '-';
}

export default function MiniMetricTagLayer({
  tags,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: MiniMetricTagLayerProps) {
  return (
    <svg className="map-data-layer mini-metric-tag-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {tags.map((tag) => {
        const active = hoveredId === tag.id || selectedId === tag.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(tag.weather) && tag.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(tag.time_period) && tag.time_period !== selectedTimePeriod;
        return (
          <g
            key={tag.id}
            className={`mini-metric-tag${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}`}
            transform={`translate(${tag.x} ${tag.y})`}
            role="button"
            tabIndex={0}
            aria-label={tag.label}
            onMouseMove={(event) => onHover(tag, event)}
            onMouseLeave={onLeave}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(tag);
            }}
          >
            <rect x={0} y={0} width={106} height={42} rx={10} />
            <text x={12} y={17}>Delay {percent(tag.delay_rate)}</text>
            <text x={12} y={32}>Avg {minutes(tag.avg_delivery_duration_min)}</text>
          </g>
        );
      })}
    </svg>
  );
}
