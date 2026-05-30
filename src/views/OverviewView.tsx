import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getCitySummary, getHourSummary, getOverview } from '../api/client';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import { CitySummary, HourSummary, OverviewSummary } from '../types/data';
import { formatNumber, formatPercent, labelOf } from '../utils/format';

export default function OverviewView() {
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [hours, setHours] = useState<HourSummary[]>([]);
  const [cities, setCities] = useState<CitySummary[]>([]);

  useEffect(() => {
    Promise.all([getOverview(), getHourSummary(), getCitySummary()]).then(([overviewData, hourData, cityData]) => {
      setOverview(overviewData);
      setHours(hourData);
      setCities(cityData);
    });
  }, []);

  if (!overview) return <EmptyState />;

  const hourOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 48, right: 24, bottom: 36, top: 48 },
    xAxis: { type: 'category', data: hours.map((item) => `${item.order_hour}:00`) },
    yAxis: [
      { type: 'value', name: '订单数' },
      { type: 'value', name: '延迟率', axisLabel: { formatter: '{value}' } }
    ],
    series: [
      { name: '订单数', type: 'bar', data: hours.map((item) => item.order_count), itemStyle: { color: '#4f7cac' } },
      {
        name: '延迟率',
        type: 'line',
        yAxisIndex: 1,
        data: hours.map((item) => Number((item.delay_rate * 100).toFixed(1))),
        itemStyle: { color: '#d95f59' }
      }
    ]
  };

  return (
    <div className="view-stack">
      <section className="metric-grid">
        <div className="metric-card">
          <span>有效订单</span>
          <strong>{formatNumber(overview.valid_orders)}</strong>
        </div>
        <div className="metric-card">
          <span>平均配送时长</span>
          <strong>{formatNumber(overview.avg_delivery_duration_min, 1)} min</strong>
        </div>
        <div className="metric-card">
          <span>延迟率</span>
          <strong>{formatPercent(overview.delay_rate)}</strong>
        </div>
        <div className="metric-card">
          <span>平均距离</span>
          <strong>{formatNumber(overview.avg_distance_km, 1)} km</strong>
        </div>
      </section>
      <ChartCard title="小时订单量与延迟率" description="真实 processed hour_summary 数据。" option={hourOption} />
      <section className="table-card">
        <h2>城市概览</h2>
        <table>
          <thead>
            <tr>
              <th>城市</th>
              <th>订单数</th>
              <th>平均时长</th>
              <th>延迟率</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((item) => (
              <tr key={labelOf(item.city)}>
                <td>{labelOf(item.city)}</td>
                <td>{formatNumber(item.order_count)}</td>
                <td>{formatNumber(item.avg_delivery_duration_min, 1)}</td>
                <td>{formatPercent(item.delay_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
