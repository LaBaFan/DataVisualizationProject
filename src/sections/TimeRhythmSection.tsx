import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { loadTimePeriodSummary } from '../api/staticDataClient';
import SectionTitle from '../components/SectionTitle';
import { useInteraction } from '../store/interactionContext';
import { TimePeriodSummary } from '../types/data';

const timeLabels: Record<string, { label: string; note: string }> = {
  breakfast: { label: 'Morning', note: 'Peak Orders' },
  lunch_peak: { label: 'Noon', note: 'Lunch Rush' },
  afternoon: { label: 'Afternoon', note: 'Peak Delay' },
  dinner_peak: { label: 'Evening', note: 'Dinner Rush' },
  night: { label: 'Night', note: 'Night Risk' }
};

function safePeriodLabel(period: string | null | undefined) {
  if (!period) return null;
  return timeLabels[period]?.label ?? period;
}

export default function TimeRhythmSection() {
  const { selectedTimePeriod, setSelectedTimePeriod } = useInteraction();
  const [rows, setRows] = useState<TimePeriodSummary[]>([]);

  useEffect(() => {
    loadTimePeriodSummary().then(setRows);
  }, []);

  const sortedRows = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => (a.time_period === 'breakfast' ? -1 : 0) - (b.time_period === 'breakfast' ? -1 : 0)),
    [rows]
  );

  const totalOrders = Math.max(sortedRows.reduce((sum, row) => sum + row.order_count, 0), 1);

  return (
    <section id="section-time" data-section-id="time" className="story-section time-rhythm-section">
      <SectionTitle eyebrow="Section 04" title="Time Rhythm Strip / 时间节奏">
        订单量怎样在一天里展开？条宽看订单量，颜色看延迟率，亮度和高度共同表达平均配送时长。
      </SectionTitle>
      <div className="story-panel time-rhythm-panel">
        <div className="time-rhythm-strip" aria-label="Time rhythm strip">
          {sortedRows.map((row) => {
            const period = row.time_period ?? 'All';
            const active = selectedTimePeriod === period;
            const config = timeLabels[period] ?? { label: period, note: 'Flow' };
            const height = Math.max(0.58, Math.min(1.18, row.avg_delivery_duration_min / 34));
            const width = Math.max(10, (row.order_count / totalOrders) * 100);
            return (
              <button
                key={period}
                type="button"
                className={`time-segment${active ? ' is-active' : ''}${selectedTimePeriod !== 'All' && !active ? ' is-muted' : ''}`}
                style={
                  {
                    width: `${width}%`,
                    '--delay-rate': row.delay_rate,
                    '--segment-height': height
                  } as CSSProperties
                }
                onClick={() => setSelectedTimePeriod(period)}
              >
                <span>{config.label}</span>
                <strong>{row.avg_delivery_duration_min.toFixed(1)}m</strong>
                <em>{config.note}</em>
              </button>
            );
          })}
        </div>
        <div className="time-annotations">
          <span>Lunch Rush</span>
          <span>Dinner Rush</span>
          <span>Night Risk</span>
          <span>Peak Orders</span>
          <span>Peak Delay</span>
        </div>
        <p className="time-rhythm-copy">
          {safePeriodLabel(selectedTimePeriod)} 视角会驱动地图夜间调暗、道路强调与订单点态度变化。
        </p>
      </div>
    </section>
  );
}
