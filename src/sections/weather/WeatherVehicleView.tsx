import {
  aggregateByVehicleType,
  DELAY_THRESHOLD_MIN,
  filterOrdersByTimePeriod,
  filterOrdersByWeather,
  getWeatherInsight
} from './weatherAnalytics';
import { fmt, pct, vehicleLabel, type WeatherViewData } from './weatherViewUtils';

interface WeatherVehicleViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

const W = 740;
const H = 330;
const PAD = { left: 96, right: 72, top: 30, bottom: 46 };

export default function WeatherVehicleView({ selectedWeather, selectedTimePeriod, data }: WeatherVehicleViewProps) {
  const weatherOrders = filterOrdersByWeather(data.orders, selectedWeather);
  const scopedOrders = filterOrdersByTimePeriod(weatherOrders, selectedTimePeriod);
  const rows = aggregateByVehicleType(scopedOrders);
  const maxDuration = Math.max(DELAY_THRESHOLD_MIN + 8, ...rows.map((row) => row.avg_delivery_duration_min)) * 1.08;
  const plotW = W - PAD.left - PAD.right;
  const rowH = rows.length ? (H - PAD.top - PAD.bottom) / rows.length : 0;
  const x = (value: number) => PAD.left + (value / maxDuration) * plotW;
  const thresholdX = x(DELAY_THRESHOLD_MIN);

  return (
    <section className="weather-subview" aria-label="天气条件下的载具表现">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">载具 / 04</span>
        <h2>载具配送时长排序</h2>
        <p>{getWeatherInsight('vehicle', rows, selectedWeather)}</p>
      </div>

      <div className="weather-chart-card">
        {rows.length ? (
          <svg className="weather-svg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="载具平均配送时长横向条图">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const value = maxDuration * tick;
              return (
                <g key={tick}>
                  <line x1={x(value)} x2={x(value)} y1={PAD.top} y2={H - PAD.bottom} className="weather-grid-line" />
                  <text x={x(value)} y={H - 18} textAnchor="middle" className="weather-axis-tick">{fmt(value)}</text>
                </g>
              );
            })}
            <line x1={thresholdX} x2={thresholdX} y1={PAD.top} y2={H - PAD.bottom} className="weather-threshold-line" />
            <text x={thresholdX + 5} y={PAD.top + 10} className="weather-threshold-label">32 分钟</text>
            {rows.map((row, index) => {
              const y = PAD.top + index * rowH + rowH * 0.23;
              const h = Math.max(16, rowH * 0.46);
              const fill = row.avg_delivery_duration_min > DELAY_THRESHOLD_MIN ? '#dc2626' : row.delay_rate >= 0.3 ? '#f97316' : '#2563eb';
              return (
                <g key={row.key}>
                  <text x={PAD.left - 12} y={y + h * 0.68} textAnchor="end" className="weather-axis-label">{vehicleLabel(row.vehicle_type)}</text>
                  <rect x={PAD.left} y={y} width={Math.max(4, x(row.avg_delivery_duration_min) - PAD.left)} height={h} rx={6} fill={fill} className="weather-duration-bar">
                    <title>{`${vehicleLabel(row.vehicle_type)}：平均 ${fmt(row.avg_delivery_duration_min, 1)} 分钟，延迟率 ${pct(row.delay_rate)}，订单 ${row.order_count} 单`}</title>
                  </rect>
                  <text x={x(row.avg_delivery_duration_min) + 8} y={y + h * 0.68} className="weather-row-note">
                    {fmt(row.avg_delivery_duration_min, 1)} 分钟 · {pct(row.delay_rate)} · {fmt(row.order_count)} 单
                  </text>
                </g>
              );
            })}
            <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="weather-axis-line" />
            <text x={(PAD.left + W - PAD.right) / 2} y={H - 4} textAnchor="middle" className="weather-axis-label">平均配送时长（分钟）</text>
          </svg>
        ) : <p className="detail-empty">暂无当前筛选下的载具样本</p>}
      </div>
    </section>
  );
}
