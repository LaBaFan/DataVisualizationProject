import { CSSProperties, MouseEvent } from 'react';
import { RiskHeatHalo } from '../types/data';

interface RiskHeatHaloLayerProps {
  halos: RiskHeatHalo[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (halo: RiskHeatHalo, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (halo: RiskHeatHalo) => void;
}

function haloColor(halo: RiskHeatHalo) {
  if (halo.risk_score >= 0.85 || halo.delay_rate >= 0.72) return '#ef4444';
  if (halo.risk_score >= 0.7 || halo.delay_rate >= 0.55) return '#f97316';
  return '#f59e0b';
}

function haloOpacity(halo: RiskHeatHalo) {
  return Math.max(0.14, Math.min(0.34, 0.08 + halo.risk_score * 0.27));
}

export default function RiskHeatHaloLayer({
  halos,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: RiskHeatHaloLayerProps) {
  return (
    <svg className="map-data-layer risk-heat-halo-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      <defs>
        {halos.map((halo) => (
          <radialGradient key={halo.id} id={`halo-gradient-${halo.id}`}>
            <stop offset="0%" stopColor={haloColor(halo)} stopOpacity="0.5" />
            <stop offset="48%" stopColor={haloColor(halo)} stopOpacity="0.22" />
            <stop offset="100%" stopColor={haloColor(halo)} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {halos.map((halo) => {
        const active = hoveredId === halo.id || selectedId === halo.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(halo.weather) && halo.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(halo.time_period) && halo.time_period !== selectedTimePeriod;
        const focused = !weatherMuted && !timeMuted && (selectedWeather !== 'All' || selectedTimePeriod !== 'All');
        return (
          <g
            key={halo.id}
            className={`risk-heat-halo${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}${focused ? ' is-filter-focused' : ''}`}
            style={
              {
                '--halo-color': haloColor(halo),
                '--halo-opacity': haloOpacity(halo)
              } as CSSProperties
            }
            role="button"
            tabIndex={0}
            aria-label={halo.label}
            onMouseMove={(event) => onHover(halo, event)}
            onMouseLeave={onLeave}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(halo);
            }}
          >
            <circle className="risk-heat-halo-fill" cx={halo.x} cy={halo.y} r={halo.radius} fill={`url(#halo-gradient-${halo.id})`} />
            <circle className="risk-heat-halo-edge" cx={halo.x} cy={halo.y} r={halo.radius * 0.72} />
          </g>
        );
      })}
    </svg>
  );
}
