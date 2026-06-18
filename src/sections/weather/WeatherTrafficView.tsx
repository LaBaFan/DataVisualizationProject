import {
  aggregateByTrafficDensity,
  filterOrdersByWeather,
  getRiskColor,
  getWeatherInsight
} from './weatherAnalytics';
import { fmt, pct, trafficLabel, type WeatherViewData } from './weatherViewUtils';

interface WeatherTrafficViewProps {
  selectedWeather: string;
  data: WeatherViewData;
}

const W = 720;
const H = 330;
const PAD = { left: 92, right: 42, top: 34, bottom: 54 };

export default function WeatherTrafficView({ selectedWeather, data }: WeatherTrafficViewProps) {
  const weatherOrders = filterOrdersByWeather(data.orders, selectedWeather);
  const rows = aggregateByTrafficDensity(weatherOrders);
  const maxOrders = Math.max(1, ...rows.map((row) => row.order_count));
  const maxDelay = Math.max(0.55, ...rows.map((row) => row.delay_rate)) * 1.08;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (value: number) => PAD.left + (value / maxDelay) * plotW;

  return (
    <section className="weather-subview" aria-label="天气条件下的交通压力带">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">交通 / 02</span>
        <h2>交通密度风险分带</h2>
        <p>{getWeatherInsight('traffic', rows, selectedWeather)}</p>
      </div>

      <div className="weather-chart-card">
        {rows.length ? (
          <svg className="weather-svg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="交通密度延迟率与风险气泡图">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const value = maxDelay * tick;
              return (
                <g key={tick}>
                  <line x1={x(value)} x2={x(value)} y1={PAD.top} y2={H - PAD.bottom} className="weather-grid-line" />
                  <text x={x(value)} y={H - 24} textAnchor="middle" className="weather-axis-tick">{pct(value)}</text>
                </g>
              );
            })}
            {rows.map((row, index) => {
              const y = PAD.top + (index + 0.5) * (plotH / rows.length);
              const radius = 9 + (row.order_count / maxOrders) * 22;
              return (
                <g key={row.key} className="weather-bubble-row">
                  <text x={PAD.left - 14} y={y + 4} textAnchor="end" className="weather-axis-label">{trafficLabel(row.traffic_density)}</text>
                  <line x1={PAD.left} x2={x(row.delay_rate)} y1={y} y2={y} className="weather-risk-bar" style={{ stroke: getRiskColor(row.risk_score) }} />
                  <circle cx={x(row.delay_rate)} cy={y} r={radius} fill={getRiskColor(row.risk_score)} className="weather-risk-bubble">
                    <title>{`${trafficLabel(row.traffic_density)}：延迟率 ${pct(row.delay_rate)}，订单 ${row.order_count} 单，风险 ${fmt(row.risk_score, 2)}`}</title>
                  </circle>
                  <text x={x(row.delay_rate)} y={y + 4} textAnchor="middle" className="weather-bubble-value">{fmt(row.order_count)}</text>
                  <text x={W - PAD.right + 8} y={y + 4} className="weather-row-note">{fmt(row.avg_delivery_duration_min, 1)} 分钟</text>
                </g>
              );
            })}
            <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="weather-axis-line" />
            <text x={(PAD.left + W - PAD.right) / 2} y={H - 6} textAnchor="middle" className="weather-axis-label">延迟率</text>
          </svg>
        ) : <p className="detail-empty">暂无当前天气的交通分带数据</p>}

        <div className="weather-chart-legend">
          <span><i style={{ background: '#2563eb' }} />低风险</span>
          <span><i style={{ background: '#f59e0b' }} />中风险</span>
          <span><i style={{ background: '#f97316' }} />高风险</span>
          <span><i style={{ background: '#dc2626' }} />严重</span>
          <em>气泡大小 = 订单量</em>
        </div>
      </div>
    </section>
  );
}
