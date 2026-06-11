import { CSSProperties } from 'react';
import SectionTitle from '../components/SectionTitle';
import { orderDots } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';

const periods = [
  { value: 'breakfast', label: 'Morning', note: 'Breakfast' },
  { value: 'lunch_peak', label: 'Noon', note: 'Lunch Rush' },
  { value: 'afternoon', label: 'Afternoon', note: 'Stable Flow' },
  { value: 'dinner_peak', label: 'Evening', note: 'Dinner Rush' },
  { value: 'night', label: 'Night', note: 'Night Risk' }
];

function stats(period: string) {
  const source = orderDots.filter((dot) => dot.time_period === period || (period === 'night' && !dot.time_period));
  const fallback = period === 'night' ? orderDots : [];
  const rows = source.length ? source : fallback;
  const orders = rows.reduce((sum, dot) => sum + (dot.order_count ?? 1), 0) || 120;
  const avg = rows.length ? rows.reduce((sum, dot) => sum + dot.delivery_duration_min, 0) / rows.length : 31;
  const delay = rows.length ? rows.reduce((sum, dot) => sum + (dot.delay_rate ?? 0.25), 0) / rows.length : 0.24;
  return { orders, avg, delay };
}

export default function TimeRhythmSection() {
  const { selectedTimePeriod, setSelectedTimePeriod } = useInteraction();
  const rows = periods.map((period) => ({ ...period, ...stats(period.value) }));
  const total = rows.reduce((sum, row) => sum + row.orders, 0);

  return (
    <section id="section-time" data-section-id="time" className="story-section time-rhythm-section">
      <SectionTitle eyebrow="Section 04" title="Time Rhythm / 配送时间节奏">
        时间带宽度表示订单量，颜色表示延迟率；点击 segment 会同步顶部时间筛选。
      </SectionTitle>
      <div className="story-panel time-rhythm-panel">
        <div className="time-rhythm-strip">
          {rows.map((row) => {
            const active = selectedTimePeriod === row.value;
            const width = Math.max(14, (row.orders / total) * 100);
            return (
              <button
                key={row.value}
                type="button"
                className={`time-segment${active ? ' is-active' : ''}${selectedTimePeriod !== 'All' && !active ? ' is-muted' : ''}`}
                style={{ width: `${width}%`, '--delay-rate': row.delay } as CSSProperties}
                onClick={() => setSelectedTimePeriod(row.value)}
              >
                <span>{row.label}</span>
                <strong>{row.avg.toFixed(1)}m</strong>
                <em>{row.note}</em>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
