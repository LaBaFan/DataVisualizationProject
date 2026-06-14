import { useEffect, useMemo, useState } from 'react';
import { loadTrafficDensitySummary } from '../api/staticDataClient';
import SectionTitle from '../components/SectionTitle';
import TrafficPressureBands from '../components/TrafficPressureBands';
import { useInteraction } from '../store/interactionContext';
import { TrafficDensitySummary, TrafficSegment } from '../types/data';

function toBandSelection(row: TrafficDensitySummary): TrafficSegment {
  return {
    id: `traffic-density-${row.traffic_density.toLowerCase()}`,
    label: `${row.traffic_density} Traffic Pressure Band`,
    path: '',
    points: [],
    traffic_density: row.traffic_density,
    order_count: row.order_count,
    avg_delivery_duration_min: row.avg_delivery_duration_min,
    avg_distance_km: row.avg_distance_km,
    delay_rate: row.delay_rate,
    risk_score: row.risk_score
  };
}

export default function TrafficPressureSection() {
  const { selectedWeather, selectedTimePeriod, selectedItem, setSelectedItem } = useInteraction();
  const [summaries, setSummaries] = useState<TrafficDensitySummary[]>([]);

  useEffect(() => {
    loadTrafficDensitySummary().then(setSummaries);
  }, []);

  const rows = useMemo(
    () => summaries,
    [summaries]
  );

  const selectedDensity = selectedItem?.type === 'traffic_segment' && selectedItem.item.id.startsWith('traffic-density-')
    ? selectedItem.item.traffic_density
    : undefined;

  return (
    <section id="section-traffic" data-section-id="traffic" className="story-section traffic-pressure-section">
      <SectionTitle eyebrow="Section 03" title="Traffic Pressure / 交通压力">
        不同交通密度下，订单量、配送时长和延迟率如何变化？
      </SectionTitle>
      <div className={`story-panel traffic-pressure-panel time-tone-${selectedTimePeriod}`}>
        <TrafficPressureBands
          rows={rows}
          selectedDensity={selectedDensity}
          selectedWeather={selectedWeather}
          selectedTimePeriod={selectedTimePeriod}
          onSelect={(row) => setSelectedItem({ type: 'traffic_segment', item: toBandSelection(row) })}
        />
        <div className="traffic-impact-summary">
          <strong>Traffic Impact Summary</strong>
          <p>
            从 Low 到 Jam，订单量和平均配送时长同步抬升，延迟率在高密度区间加速放大，ETA 风险会从轻微波动转向系统性累积。
          </p>
        </div>
      </div>
    </section>
  );
}
