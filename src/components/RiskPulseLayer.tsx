import { CSSProperties, MouseEvent } from 'react';
import { ScenarioAnchor } from '../types/data';

interface RiskPulseLayerProps {
  anchors: ScenarioAnchor[];
  hoveredId?: string | null;
  selectedId?: string | null;
  selectedWeather?: string;
  selectedTimePeriod?: string;
  onHover: (anchor: ScenarioAnchor, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (anchor: ScenarioAnchor) => void;
}

function pulseColor(anchor: ScenarioAnchor) {
  if (anchor.delay_rate >= 0.75 || anchor.risk_score >= 0.85) return '#ef4444';
  if (anchor.delay_rate >= 0.5 || anchor.risk_score >= 0.65) return '#f97316';
  return '#f59e0b';
}

function pulseRadius(anchor: ScenarioAnchor) {
  return Math.max(38, Math.min(96, anchor.radius * (0.76 + anchor.risk_score * 0.28)));
}

export default function RiskPulseLayer({
  anchors,
  hoveredId,
  selectedId,
  selectedWeather = 'All',
  selectedTimePeriod = 'All',
  onHover,
  onLeave,
  onSelect
}: RiskPulseLayerProps) {
  return (
    <svg className="map-data-layer risk-pulse-layer" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="false">
      {anchors.map((anchor) => {
        const active = hoveredId === anchor.id || selectedId === anchor.id;
        const weatherMuted = selectedWeather !== 'All' && Boolean(anchor.weather) && anchor.weather !== selectedWeather;
        const timeMuted = selectedTimePeriod !== 'All' && Boolean(anchor.time_period) && anchor.time_period !== selectedTimePeriod;
        return (
          <g
            key={anchor.id}
            className={`risk-pulse-node${active ? ' is-active' : ''}${weatherMuted || timeMuted ? ' is-filter-muted' : ''}`}
            style={{ '--pulse-color': pulseColor(anchor) } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={anchor.label}
            onMouseMove={(event) => onHover(anchor, event)}
            onMouseLeave={onLeave}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(anchor);
            }}
          >
            <circle className="risk-pulse-ring risk-pulse-ring-outer" cx={anchor.x} cy={anchor.y} r={pulseRadius(anchor)} />
            <circle className="risk-pulse-ring risk-pulse-ring-inner" cx={anchor.x} cy={anchor.y} r={Math.max(26, pulseRadius(anchor) * 0.62)} />
            <circle className="risk-pulse-core" cx={anchor.x} cy={anchor.y} r={5.5} />
          </g>
        );
      })}
    </svg>
  );
}
