import { barWidth, fmt, pct, timeLabel, TIME_ORDER, type WeatherViewData } from './weatherViewUtils';

interface WeatherTimeViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

export default function WeatherTimeView({ selectedWeather, selectedTimePeriod, data }: WeatherTimeViewProps) {
  const rows = data.scenarios
    .filter((row) => selectedWeather === 'All' || row.weather === selectedWeather)
    .reduce<Array<{ time_period: string; order_count: number; duration: number; delay: number; risk: number }>>((acc, row) => {
      const timePeriod = row.time_period ?? 'Unknown';
      const existing = acc.find((item) => item.time_period === timePeriod);
      if (existing) {
        const total = existing.order_count + row.order_count;
        existing.duration = (existing.duration * existing.order_count + row.avg_delivery_duration_min * row.order_count) / total;
        existing.delay = (existing.delay * existing.order_count + row.delay_rate * row.order_count) / total;
        existing.risk = Math.max(existing.risk, row.risk_score);
        existing.order_count = total;
      } else {
        acc.push({
          time_period: timePeriod,
          order_count: row.order_count,
          duration: row.avg_delivery_duration_min,
          delay: row.delay_rate,
          risk: row.risk_score
        });
      }
      return acc;
    }, [])
    .sort((a, b) => TIME_ORDER.indexOf(a.time_period) - TIME_ORDER.indexOf(b.time_period));
  const maxOrders = Math.max(1, ...rows.map((row) => row.order_count));

  return (
    <section className="weather-subview" aria-label="天气条件下的时段节奏">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">时段 / 03</span>
        <h2>天气条件下的时段节奏</h2>
        <p>这条节奏带用订单量做长度，用延迟率和风险强度做颜色深浅，帮助判断压力是否集中在单一履约窗口。</p>
      </div>

      <div className="time-rhythm-bars weather-time-strip">
        {rows.length ? rows.map((row) => {
          const active = selectedTimePeriod === row.time_period;
          const muted = selectedTimePeriod !== 'All' && !active;
          return (
            <div
              key={row.time_period}
              className={`rhythm-row${active ? ' is-active' : ''}${muted ? ' is-muted' : ''}`}
            >
              <span className="rhythm-label">{timeLabel(row.time_period)}</span>
              <div className="rhythm-track">
                <div
                  className="rhythm-fill"
                  style={{
                    width: barWidth(row.order_count, maxOrders),
                    opacity: 0.35 + Math.min(0.65, row.delay)
                  }}
                />
              </div>
              <div className="rhythm-metrics">
                <strong>{row.order_count.toLocaleString()}</strong>
                <em>{fmt(row.duration, 1)} 分钟</em>
                <em className={row.delay > 0.35 ? 'is-high' : ''}>{pct(row.delay)}</em>
              </div>
            </div>
          );
        }) : <p className="detail-empty">暂无当前天气的时段节奏数据</p>}
      </div>
    </section>
  );
}
