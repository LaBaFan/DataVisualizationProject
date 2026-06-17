import { barWidth, fmt, pct, summarizeVehicle, type WeatherViewData } from './weatherViewUtils';

interface WeatherVehicleViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

export default function WeatherVehicleView({ selectedWeather, selectedTimePeriod, data }: WeatherVehicleViewProps) {
  const rows = summarizeVehicle(data.points, selectedWeather, selectedTimePeriod);
  const maxOrders = Math.max(1, ...rows.map((row) => row.order_count));

  return (
    <section className="weather-subview" aria-label="天气条件下的载具表现">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">载具 / 04</span>
        <h2>当前天气下的 vehicle_type 表现</h2>
        <p>当前数据层没有独立载具聚合表，本视图从订单散点样本按 vehicle_type 透明汇总，不引入区域或地理代理变量。</p>
      </div>

      <div className="vehicle-performance-list">
        {rows.length ? rows.map((row, index) => (
          <article key={row.vehicle_type} className="vehicle-performance-row">
            <div className="vehicle-rank">{String(index + 1).padStart(2, '0')}</div>
            <div className="vehicle-main">
              <div className="vehicle-title">
                <strong>{row.vehicle_type}</strong>
                <span>{row.order_count.toLocaleString()} 个样本订单</span>
              </div>
              <div className="weather-band-track">
                <i style={{ width: barWidth(row.order_count, maxOrders) }} />
              </div>
              <div className="weather-band-metrics">
                <span>ETA <strong>{fmt(row.avg_delivery_duration_min, 1)} 分钟</strong></span>
                <span>距离 <strong>{fmt(row.avg_distance_km, 1)} 公里</strong></span>
                <span>延迟 <strong>{pct(row.delay_rate)}</strong></span>
              </div>
            </div>
          </article>
        )) : <p className="detail-empty">暂无当前筛选下的载具样本</p>}
      </div>
    </section>
  );
}
