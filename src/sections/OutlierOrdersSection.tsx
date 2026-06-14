import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { loadDistanceTimeSample } from '../api/staticDataClient';
import MapTooltip from '../components/MapTooltip';
import SectionTitle from '../components/SectionTitle';
import { useInteraction } from '../store/interactionContext';
import { DistanceTimePoint, MapSelection } from '../types/data';

function scale(value: number, min: number, max: number, start: number, end: number) {
  if (max === min) return (start + end) / 2;
  return start + ((value - min) / (max - min)) * (end - start);
}

function pointSize(point: DistanceTimePoint) {
  return Math.max(5, Math.min(13, point.delivery_duration_min / 3.8));
}

function pointColor(point: DistanceTimePoint) {
  return point.is_delayed ? '#ef4444' : '#0f766e';
}

export default function OutlierOrdersSection() {
  const { selectedWeather, selectedTimePeriod, selectedItem, setSelectedItem } = useInteraction();
  const [rows, setRows] = useState<DistanceTimePoint[]>([]);
  const [hovered, setHovered] = useState<MapSelection | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadDistanceTimeSample().then(setRows);
  }, []);

  const points = useMemo(
    () =>
      rows.map((point) => ({
        ...point,
        risk_score: point.is_delayed ? 0.84 : 0.28
      })),
    [rows]
  );

  const filteredPoints = useMemo(
    () =>
      points.filter((point) => {
        const weatherMatch = selectedWeather === 'All' || !point.weather || point.weather === selectedWeather;
        const timeMatch = selectedTimePeriod === 'All' || !point.time_period || point.time_period === selectedTimePeriod;
        return weatherMatch && timeMatch;
      }),
    [points, selectedTimePeriod, selectedWeather]
  );

  const distanceMax = Math.max(...points.map((point) => point.distance_km), 12);
  const durationMax = Math.max(...points.map((point) => point.delivery_duration_min), 60);
  const avgDuration = points.reduce((sum, point) => sum + point.delivery_duration_min, 0) / Math.max(points.length, 1);
  const avgDistance = points.reduce((sum, point) => sum + point.distance_km, 0) / Math.max(points.length, 1);
  const x = (point: DistanceTimePoint) => scale(point.distance_km, 0, distanceMax, 64, 590);
  const y = (point: DistanceTimePoint) => scale(point.delivery_duration_min, 8, durationMax, 302, 48);

  const handleMove = (point: DistanceTimePoint, event: MouseEvent<SVGGElement>) => {
    const rect = event.currentTarget.closest('.scatter-story-panel')?.getBoundingClientRect();
    setHovered({
      type: 'order_dot',
      item: {
        id: point.order_id,
        order_id: point.order_id,
        x: x(point),
        y: y(point),
        delivery_duration_min: point.delivery_duration_min,
        distance_km: point.distance_km,
        is_delayed: point.is_delayed,
        weather: point.weather ?? undefined,
        traffic_density: point.traffic_density ?? undefined,
        time_period: point.time_period ?? undefined,
        vehicle_type: point.vehicle_type ?? undefined,
        delay_rate: point.is_delayed ? 0.82 : 0.22
      }
    });
    setPos({ x: rect ? event.clientX - rect.left : event.clientX, y: rect ? event.clientY - rect.top : event.clientY });
  };

  return (
    <section id="section-outlier" data-section-id="outlier" className="story-section outlier-orders-section">
      <SectionTitle eyebrow="Section 06" title="Outlier Orders / 异常订单">
        哪些订单偏离正常轨迹？用散点找出距离短但时长长、或显著延迟的异常样本，并查看对应详情。
      </SectionTitle>
      <div className="story-panel scatter-story-panel">
        <svg viewBox="0 0 640 360" aria-label="Distance time scatter">
          <line className="scatter-grid" x1="64" x2="590" y1="302" y2="302" />
          <line className="scatter-grid" x1="64" x2="64" y1="46" y2="302" />
          <line className="scatter-threshold" x1="64" x2="590" y1={scale(32, 8, durationMax, 302, 48)} y2={scale(32, 8, durationMax, 302, 48)} />
          <line className="scatter-mean" x1={scale(avgDistance, 0, distanceMax, 64, 590)} x2={scale(avgDistance, 0, distanceMax, 64, 590)} y1="46" y2="302" />
          <text className="scatter-axis-label" x="232" y="342">
            distance_km
          </text>
          <text className="scatter-axis-label" x="15" y="170" transform="rotate(-90 15 170)">
            delivery_duration_min
          </text>
          {filteredPoints.map((point) => {
            const active = selectedItem?.type === 'order_dot' && selectedItem.item.order_id === point.order_id;
            const dimmed = filteredPoints.length !== points.length && !active;
            return (
              <g
                key={point.order_id}
                className={`outlier-point${point.is_delayed ? ' is-delayed' : ''}${active ? ' is-active' : ''}${dimmed ? ' is-muted' : ''}`}
                transform={`translate(${x(point)} ${y(point)})`}
                onMouseMove={(event) => handleMove(point, event)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  setSelectedItem({
                    type: 'order_dot',
                    item: {
                      id: point.order_id,
                      order_id: point.order_id,
                      x: x(point),
                      y: y(point),
                      delivery_duration_min: point.delivery_duration_min,
                      distance_km: point.distance_km,
                      is_delayed: point.is_delayed,
                      weather: point.weather ?? undefined,
                      traffic_density: point.traffic_density ?? undefined,
                      time_period: point.time_period ?? undefined,
                      vehicle_type: point.vehicle_type ?? undefined,
                      delay_rate: point.is_delayed ? 0.82 : 0.22
                    }
                  })
                }
              >
                <circle r={pointSize(point)} style={{ fill: pointColor(point) }} />
              </g>
            );
          })}
        </svg>
        <div className="scatter-legend-note">
          <span>Mean line</span>
          <span>32 min threshold</span>
          <span>Delayed in red</span>
        </div>
        <MapTooltip selection={hovered} x={pos.x} y={pos.y} />
      </div>
    </section>
  );
}
