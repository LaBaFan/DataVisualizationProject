import { MouseEvent } from 'react';
import { ActiveSection, MiniMetricTag } from '../types/data';

interface MiniMetricTagLayerProps {
  tags: MiniMetricTag[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  activeScene?: ActiveSection;
  onHover: (tag: MiniMetricTag, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (tag: MiniMetricTag) => void;
}

function percent(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
}

function minutes(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value)}分钟` : '-';
}

export default function MiniMetricTagLayer({
  tags,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  activeScene = 'overview',
  onHover,
  onLeave,
  onSelect
}: MiniMetricTagLayerProps) {
  return (
    <svg className="map-data-layer mini-metric-tag-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {tags.slice(0, 5).map((tag, index) => {
        const active = hoveredId === tag.id || selectedId === tag.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(tag.weather) && tag.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(tag.time_period) && tag.time_period !== selectedTimePeriod;
        const focused = !weatherMuted && !timeMuted && (selectedWeather !== 'All' || selectedTimePeriod !== 'All');
        const trafficFocused = activeScene === 'traffic' && (tag.traffic_density === 'High' || tag.traffic_density === 'Jam');
        const riskFocused = activeScene === 'risk' && (tag.risk_score ?? tag.delay_rate ?? 0) >= 0.68;
        const weatherSceneFocused = activeScene === 'weather' && !weatherMuted;
        return (
          <g
            key={tag.id}
            className={`mini-metric-tag scene-${activeScene}${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}${focused ? ' is-filter-focused' : ''}${weatherSceneFocused ? ' is-scene-focused' : ''}${trafficFocused ? ' is-traffic-focused' : ''}${riskFocused ? ' is-risk-focused' : ''}`}
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
            <circle className="mini-metric-index" cx={13} cy={14} r={9} />
            <text className="mini-metric-index-text" x={13} y={18}>{index + 1}</text>
            <text x={27} y={17}>延迟 {percent(tag.delay_rate)}</text>
            <text x={27} y={32}>时长 {minutes(tag.avg_delivery_duration_min)}</text>
          </g>
        );
      })}
    </svg>
  );
}
