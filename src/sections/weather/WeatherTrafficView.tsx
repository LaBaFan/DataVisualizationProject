import { barWidth, fmt, pct, TRAFFIC_ORDER, type WeatherViewData } from './weatherViewUtils';

interface WeatherTrafficViewProps {
  selectedWeather: string;
  data: WeatherViewData;
}

export default function WeatherTrafficView({ selectedWeather, data }: WeatherTrafficViewProps) {
  const rows = data.weatherTraffic
    .filter((row) => selectedWeather === 'All' || row.weather === selectedWeather)
    .sort((a, b) => TRAFFIC_ORDER.indexOf(a.traffic_density ?? '') - TRAFFIC_ORDER.indexOf(b.traffic_density ?? ''));
  const maxOrders = Math.max(1, ...rows.map((row) => row.order_count));

  return (
    <section className="weather-subview" aria-label="天气条件下的交通压力带">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">交通 / 02</span>
        <h2>天气条件下的交通压力带</h2>
        <p>按交通密度拆开当前天气样本，观察 ETA、延迟率和风险评分是否随着 Low 到 Jam 呈阶梯式上升。</p>
      </div>

      <div className="weather-band-list">
        {rows.length ? rows.map((row) => (
          <article key={`${row.weather}-${row.traffic_density}`} className="weather-band-row">
            <div className="weather-band-index">
              <span>{row.traffic_density ?? '-'}</span>
              <strong>{fmt(row.risk_score, 2)}</strong>
            </div>
            <div className="weather-band-main">
              <div className="weather-band-title">
                <strong>{row.traffic_density ?? '未知'} 交通</strong>
                <span>{row.order_count.toLocaleString()} 单</span>
              </div>
              <div className="weather-band-track">
                <i style={{ width: barWidth(row.order_count, maxOrders) }} />
              </div>
              <div className="weather-band-metrics">
                <span>ETA <strong>{fmt(row.avg_delivery_duration_min, 1)} 分钟</strong></span>
                <span>延迟 <strong>{pct(row.delay_rate)}</strong></span>
                <span>距离 <strong>{fmt(row.avg_distance_km, 1)} 公里</strong></span>
              </div>
            </div>
          </article>
        )) : <p className="detail-empty">暂无当前天气的交通分带数据</p>}
      </div>
    </section>
  );
}
