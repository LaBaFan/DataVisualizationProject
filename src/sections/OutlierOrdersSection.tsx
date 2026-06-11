import { MouseEvent, useMemo, useState } from 'react';
import MapTooltip from '../components/MapTooltip';
import SectionTitle from '../components/SectionTitle';
import { orderDots } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { MapSelection, OrderDot } from '../types/data';

function scale(value: number, min: number, max: number, start: number, end: number) {
  if (max === min) return (start + end) / 2;
  return start + ((value - min) / (max - min)) * (end - start);
}

export default function OutlierOrdersSection() {
  const { selectedWeather, selectedTimePeriod, selectedItem, setSelectedItem } = useInteraction();
  const [hovered, setHovered] = useState<MapSelection | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const points = useMemo(
    () =>
      orderDots.map((dot, index) => ({
        ...dot,
        distance_km: dot.distance_km ?? 3.8 + ((index * 1.7) % 8.5)
      })),
    []
  );

  const distanceMax = Math.max(...points.map((point) => point.distance_km ?? 0), 12);
  const durationMax = Math.max(...points.map((point) => point.delivery_duration_min), 55);
  const x = (point: OrderDot) => scale(point.distance_km ?? 0, 0, distanceMax, 64, 560);
  const y = (point: OrderDot) => scale(point.delivery_duration_min, 15, durationMax, 300, 52);

  const handleMove = (point: OrderDot, event: MouseEvent<SVGGElement>) => {
    const rect = event.currentTarget.closest('.scatter-story-panel')?.getBoundingClientRect();
    setHovered({ type: 'order_dot', item: point });
    setPos({ x: rect ? event.clientX - rect.left : event.clientX, y: rect ? event.clientY - rect.top : event.clientY });
  };

  return (
    <section id="section-outlier" data-section-id="outlier" className="story-section outlier-orders-section">
      <SectionTitle eyebrow="Section 06" title="Outlier Orders / 异常订单详情">
        散点图定位短距离长时长和高延迟订单；颜色表示是否延迟，点大小表示配送时长。
      </SectionTitle>
      <div className="story-panel scatter-story-panel">
        <svg viewBox="0 0 640 360" aria-label="Distance time scatter">
          <line className="scatter-grid" x1="64" x2="590" y1="300" y2="300" />
          <line className="scatter-grid" x1="64" x2="64" y1="40" y2="300" />
          <text className="scatter-axis-label" x="240" y="340">distance_km</text>
          <text className="scatter-axis-label" x="14" y="172" transform="rotate(-90 14 172)">delivery_duration_min</text>
          {points.map((point) => {
            const weatherMuted = selectedWeather !== 'All' && Boolean(point.weather) && point.weather !== selectedWeather;
            const timeMuted = selectedTimePeriod !== 'All' && Boolean(point.time_period) && point.time_period !== selectedTimePeriod;
            const active = selectedItem?.type === 'order_dot' && selectedItem.item.id === point.id;
            const outlier = point.delivery_duration_min > 42 && (point.distance_km ?? 0) < 8;
            return (
              <g
                key={point.id}
                className={`outlier-point${point.is_delayed ? ' is-delayed' : ''}${active ? ' is-active' : ''}${outlier ? ' is-outlier' : ''}${weatherMuted || timeMuted ? ' is-muted' : ''}`}
                transform={`translate(${x(point)} ${y(point)})`}
                onMouseMove={(event) => handleMove(point, event)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelectedItem({ type: 'order_dot', item: point })}
              >
                <circle r={Math.max(5, Math.min(13, point.delivery_duration_min / 4.2))} />
              </g>
            );
          })}
        </svg>
        <MapTooltip selection={hovered} x={pos.x} y={pos.y} />
      </div>
    </section>
  );
}
