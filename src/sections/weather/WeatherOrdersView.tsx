import { useMemo } from 'react';
import { useInteraction } from '../../store/interactionContext';
import type { DistanceTimePoint, OrderDot } from '../../types/data';
import { fmt, type WeatherViewData } from './weatherViewUtils';

interface WeatherOrdersViewProps {
  selectedWeather: string;
  selectedTimePeriod: string;
  data: WeatherViewData;
}

const SCATTER_W = 680;
const SCATTER_H = 320;
const SCATTER_PAD = 48;

function toOrderSelection(point: DistanceTimePoint): OrderDot {
  return {
    id: point.order_id,
    order_id: point.order_id,
    x: 820,
    y: 520,
    distance_km: point.distance_km,
    delivery_duration_min: point.delivery_duration_min,
    is_delayed: point.is_delayed,
    delay_rate: point.is_delayed ? 1 : 0,
    risk_score: point.is_delayed ? 0.72 : 0.28,
    weather: point.weather ?? undefined,
    traffic_density: point.traffic_density ?? undefined,
    time_period: point.time_period ?? undefined,
    vehicle_type: point.vehicle_type ?? undefined
  };
}

export default function WeatherOrdersView({ selectedWeather, selectedTimePeriod, data }: WeatherOrdersViewProps) {
  const { selectedOrderId, setSelectedItem, setSelectedOrderId } = useInteraction();
  const points = data.points
    .filter((point) => selectedWeather === 'All' || point.weather === selectedWeather)
    .filter((point) => selectedTimePeriod === 'All' || point.time_period === selectedTimePeriod)
    .slice(0, 220);

  const { xMax, yMax, meanDist, meanDur } = useMemo(() => {
    const xMaxValue = Math.ceil(Math.max(1, ...points.map((point) => point.distance_km)) / 2) * 2;
    const yMaxValue = Math.ceil(Math.max(1, ...points.map((point) => point.delivery_duration_min)) / 10) * 10;
    return {
      xMax: xMaxValue,
      yMax: yMaxValue,
      meanDist: points.reduce((sum, point) => sum + point.distance_km, 0) / Math.max(1, points.length),
      meanDur: points.reduce((sum, point) => sum + point.delivery_duration_min, 0) / Math.max(1, points.length)
    };
  }, [points]);

  const scaleX = (value: number) => SCATTER_PAD + (value / xMax) * (SCATTER_W - SCATTER_PAD * 2);
  const scaleY = (value: number) => SCATTER_H - SCATTER_PAD - (value / yMax) * (SCATTER_H - SCATTER_PAD * 2);

  return (
    <section className="weather-subview" aria-label="天气订单散点">
      <div className="weather-subview-copy">
        <span className="detail-eyebrow">订单 / 06</span>
        <h2>距离-时长订单散点</h2>
        <p>抽样点按配送距离和实际配送时长定位，橙色代表延迟订单。点击点位会锁定右侧 ETA 风险票据。</p>
      </div>

      {points.length ? (
        <svg className="scene-scatter-svg weather-orders-scatter" viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`} preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={`gx-${tick}`}
              x1={SCATTER_PAD + tick * (SCATTER_W - SCATTER_PAD * 2)}
              y1={SCATTER_PAD}
              x2={SCATTER_PAD + tick * (SCATTER_W - SCATTER_PAD * 2)}
              y2={SCATTER_H - SCATTER_PAD}
              className="scatter-grid-line"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={`gy-${tick}`}
              x1={SCATTER_PAD}
              y1={SCATTER_PAD + tick * (SCATTER_H - SCATTER_PAD * 2)}
              x2={SCATTER_W - SCATTER_PAD}
              y2={SCATTER_PAD + tick * (SCATTER_H - SCATTER_PAD * 2)}
              className="scatter-grid-line"
            />
          ))}
          <line x1={scaleX(meanDist)} y1={SCATTER_PAD} x2={scaleX(meanDist)} y2={SCATTER_H - SCATTER_PAD} className="scatter-mean-line" />
          <line x1={SCATTER_PAD} y1={scaleY(meanDur)} x2={SCATTER_W - SCATTER_PAD} y2={scaleY(meanDur)} className="scatter-mean-line" />

          {points.map((point) => {
            const active = selectedOrderId === point.order_id;
            return (
              <circle
                key={point.order_id}
                cx={scaleX(point.distance_km)}
                cy={scaleY(point.delivery_duration_min)}
                r={active ? 5.2 : point.is_delayed ? 3.4 : 2.5}
                className={`scatter-dot${point.is_delayed ? ' is-delayed' : ''}${active ? ' is-active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedOrderId(point.order_id);
                  setSelectedItem({ type: 'order_dot', item: toOrderSelection(point) });
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedOrderId(point.order_id);
                    setSelectedItem({ type: 'order_dot', item: toOrderSelection(point) });
                  }
                }}
              />
            );
          })}

          <line x1={SCATTER_PAD} y1={SCATTER_H - SCATTER_PAD} x2={SCATTER_W - SCATTER_PAD} y2={SCATTER_H - SCATTER_PAD} className="scatter-axis" />
          <line x1={SCATTER_PAD} y1={SCATTER_PAD} x2={SCATTER_PAD} y2={SCATTER_H - SCATTER_PAD} className="scatter-axis" />
          <text x={SCATTER_W / 2} y={SCATTER_H - 8} className="scatter-axis-label" textAnchor="middle">距离（公里）</text>
          <text x={14} y={SCATTER_H / 2} className="scatter-axis-label" textAnchor="middle" transform={`rotate(-90, 14, ${SCATTER_H / 2})`}>配送时长（分钟）</text>
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <text key={`tx-${tick}`} x={SCATTER_PAD + tick * (SCATTER_W - SCATTER_PAD * 2)} y={SCATTER_H - SCATTER_PAD + 16} className="scatter-tick" textAnchor="middle">
              {fmt(xMax * tick, 0)}
            </text>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <text key={`ty-${tick}`} x={SCATTER_PAD - 8} y={SCATTER_H - SCATTER_PAD - tick * (SCATTER_H - SCATTER_PAD * 2) + 4} className="scatter-tick" textAnchor="end">
              {fmt(yMax * tick, 0)}
            </text>
          ))}
        </svg>
      ) : <p className="detail-empty">暂无当前筛选下的订单散点</p>}
    </section>
  );
}
