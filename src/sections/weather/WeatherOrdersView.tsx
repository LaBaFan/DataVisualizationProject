import { useInteraction } from '../../store/interactionContext';
import {
  filterOrdersByTimePeriod,
  filterOrdersByWeather,
  getDelayFlag,
  getOrderScatterData,
  getWeatherInsight,
  DELAY_THRESHOLD_MIN
} from './weatherAnalytics';
import { fmt, type WeatherViewData } from './weatherViewUtils';

interface WeatherOrdersViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

const SCATTER_W = 760;
const SCATTER_H = 360;
const PAD = { left: 58, right: 34, top: 34, bottom: 56 };

export default function WeatherOrdersView({ selectedWeather, selectedTimePeriod, data }: WeatherOrdersViewProps) {
  const { selectedOrderId, setSelectedItem, setSelectedOrderId } = useInteraction();
  const weatherOrders = filterOrdersByWeather(data.orders, selectedWeather);
  const scopedOrders = filterOrdersByTimePeriod(weatherOrders, selectedTimePeriod);
  const scatter = getOrderScatterData(scopedOrders, 220);
  const points = scatter.points;
  const xMax = Math.max(1, ...points.map((point) => point.distance_km)) * 1.08;
  const yMax = Math.max(DELAY_THRESHOLD_MIN + 10, ...points.map((point) => point.delivery_duration_min)) * 1.08;
  const x = (value: number) => PAD.left + (value / xMax) * (SCATTER_W - PAD.left - PAD.right);
  const y = (value: number) => SCATTER_H - PAD.bottom - (value / yMax) * (SCATTER_H - PAD.top - PAD.bottom);

  return (
    <section className="weather-subview" aria-label="天气订单散点">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">订单 / 06</span>
        <h2>距离-时长订单散点</h2>
        <p>{getWeatherInsight('orders', scatter, selectedWeather)}</p>
      </div>

      <div className="weather-chart-card">
        {points.length ? (
          <svg className="weather-svg-chart" viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`} role="img" aria-label="订单距离时长散点图">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const xv = xMax * tick;
              const yv = yMax * tick;
              return (
                <g key={tick}>
                  <line x1={x(xv)} x2={x(xv)} y1={PAD.top} y2={SCATTER_H - PAD.bottom} className="weather-grid-line" />
                  <line x1={PAD.left} x2={SCATTER_W - PAD.right} y1={y(yv)} y2={y(yv)} className="weather-grid-line" />
                  <text x={x(xv)} y={SCATTER_H - 18} textAnchor="middle" className="weather-axis-tick">{fmt(xv, 0)}</text>
                  <text x={PAD.left - 10} y={y(yv) + 4} textAnchor="end" className="weather-axis-tick">{fmt(yv, 0)}</text>
                </g>
              );
            })}
            <line x1={PAD.left} x2={SCATTER_W - PAD.right} y1={y(DELAY_THRESHOLD_MIN)} y2={y(DELAY_THRESHOLD_MIN)} className="weather-threshold-line" />
            <text x={SCATTER_W - PAD.right - 4} y={y(DELAY_THRESHOLD_MIN) - 6} textAnchor="end" className="weather-threshold-label">32 分钟延迟线</text>
            <line x1={PAD.left} x2={SCATTER_W - PAD.right} y1={SCATTER_H - PAD.bottom} y2={SCATTER_H - PAD.bottom} className="weather-axis-line" />
            <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={SCATTER_H - PAD.bottom} className="weather-axis-line" />
            <text x={SCATTER_W / 2} y={SCATTER_H - 4} textAnchor="middle" className="weather-axis-label">配送距离（公里）</text>
            <text x={16} y={SCATTER_H / 2} textAnchor="middle" className="weather-axis-label" transform={`rotate(-90 16 ${SCATTER_H / 2})`}>配送时长（分钟）</text>

            {points.map((point) => {
              const delayed = getDelayFlag(point);
              const active = selectedOrderId === point.order_id;
              return (
                <circle
                  key={point.order_id}
                  cx={x(point.distance_km)}
                  cy={y(point.delivery_duration_min)}
                  r={active ? 5.2 : delayed ? 3.6 : 2.7}
                  className={`weather-scatter-dot${delayed ? ' is-delayed' : ''}${active ? ' is-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedOrderId(point.order_id);
                    setSelectedItem({ type: 'order_dot', item: point });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedOrderId(point.order_id);
                      setSelectedItem({ type: 'order_dot', item: point });
                    }
                  }}
                >
                  <title>{`${delayed ? '延迟' : '正常'}：距离 ${fmt(point.distance_km, 1)} 公里，时长 ${fmt(point.delivery_duration_min, 1)} 分钟`}</title>
                </circle>
              );
            })}
          </svg>
        ) : <p className="detail-empty">暂无当前筛选下的订单散点</p>}

        <div className="weather-chart-legend">
          <span><i style={{ background: '#2563eb' }} />正常</span>
          <span><i style={{ background: '#dc2626' }} />延迟</span>
          <em>散点仅做展示，统计口径来自完整天气订单</em>
        </div>
      </div>
    </section>
  );
}
