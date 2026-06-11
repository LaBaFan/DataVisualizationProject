import { CSSProperties, MouseEvent, useState } from 'react';
import MapTooltip from '../components/MapTooltip';
import SectionTitle from '../components/SectionTitle';
import { trafficSegments } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { MapSelection, TrafficSegment } from '../types/data';

const trafficColor: Record<TrafficSegment['traffic_density'], string> = {
  Low: '#0f766e',
  Medium: '#f59e0b',
  High: '#f97316',
  Jam: '#ef4444',
  Unknown: '#64748b'
};

export default function TrafficPressureSection() {
  const { selectedWeather, selectedTimePeriod, selectedItem, setSelectedItem } = useInteraction();
  const [hovered, setHovered] = useState<MapSelection | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (segment: TrafficSegment, event: MouseEvent<SVGPathElement>) => {
    const rect = event.currentTarget.closest('.traffic-road-stage')?.getBoundingClientRect();
    setHovered({ type: 'traffic_segment', item: segment });
    setPos({ x: rect ? event.clientX - rect.left : event.clientX, y: rect ? event.clientY - rect.top : event.clientY });
  };

  return (
    <section id="section-traffic" data-section-id="traffic" className="story-section traffic-pressure-section">
      <SectionTitle eyebrow="Section 03" title="Traffic Pressure / 交通压力分析">
        道路线段颜色表示交通压力，线宽表示订单量；晚高峰和夜间选择会增强拥堵路段。
      </SectionTitle>
      <div className="story-panel traffic-road-stage">
        <img src="/assets/delivery_city_map.png" alt="" draggable={false} />
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-label="Traffic load roads">
          {trafficSegments.map((segment) => {
            const selected = selectedItem?.type === 'traffic_segment' && selectedItem.item.id === segment.id;
            const focusTime = selectedTimePeriod === 'dinner_peak' || selectedTimePeriod === 'lunch_peak' || selectedTimePeriod === 'night';
            const muted = selectedWeather !== 'All' && segment.traffic_density === 'Low';
            return (
              <path
                key={segment.id}
                d={segment.path}
                className={`traffic-story-path${selected ? ' is-selected' : ''}${muted ? ' is-muted' : ''}${focusTime ? ' is-time-focused' : ''}`}
                style={
                  {
                    '--traffic-color': trafficColor[segment.traffic_density],
                    '--traffic-width': 4 + segment.order_count / 160,
                    '--traffic-opacity': 0.32 + segment.delay_rate * 0.62
                  } as CSSProperties
                }
                onMouseMove={(event) => handleMove(segment, event)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelectedItem({ type: 'traffic_segment', item: segment })}
              />
            );
          })}
        </svg>
        <MapTooltip selection={hovered} x={pos.x} y={pos.y} />
      </div>
    </section>
  );
}
