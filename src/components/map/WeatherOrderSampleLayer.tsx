import { KeyboardEvent, MouseEvent } from 'react';
import type { CSSProperties } from 'react';
import type { WeatherOrderSample } from '../../types/data';

interface WeatherOrderSampleLayerProps {
  points: WeatherOrderSample[];
  visible: boolean;
  hoveredId?: string | null;
  selectedId?: string | null;
  onHover: (point: WeatherOrderSample, event: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
  onSelect: (point: WeatherOrderSample) => void;
}

function colorFor(point: WeatherOrderSample) {
  if (point.is_delayed) return '#ef4444';
  if ((point.risk_visual_score ?? 0) >= 0.62) return '#f97316';
  return '#2563eb';
}

function radiusFor(point: WeatherOrderSample) {
  return 5 + Math.min(7, (point.risk_visual_score ?? 0) * 7);
}

export default function WeatherOrderSampleLayer({
  points,
  visible,
  hoveredId,
  selectedId,
  onHover,
  onLeave,
  onSelect
}: WeatherOrderSampleLayerProps) {
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, point: WeatherOrderSample) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(point);
  };

  return (
    <svg
      className={`map-data-layer weather-order-sample-layer${visible ? ' is-visible' : ' is-muted'}`}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="none"
      role="group"
      aria-label="天气订单样本点"
    >
      {points.map((point) => {
        const active = hoveredId === point.id || selectedId === point.id;
        return (
          <g
            key={point.id}
            className={`weather-order-dot${active ? ' is-active' : ''}${point.is_delayed ? ' is-delayed' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`订单 ${point.order_id}`}
            transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}
            style={{ '--order-dot-color': colorFor(point) } as CSSProperties}
            onMouseMove={(event) => onHover(point, event)}
            onMouseLeave={onLeave}
            onBlur={onLeave}
            onKeyDown={(event) => handleKeyDown(event, point)}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(point);
            }}
          >
            <circle className="weather-order-dot-hit" r={16} />
            <circle className="weather-order-dot-core" r={radiusFor(point)} />
          </g>
        );
      })}
    </svg>
  );
}
