import { useEffect, useState } from 'react';
import { getRiskScenarioSummary } from '../data/client';
import EmptyState from '../components/EmptyState';
import { RiskScenarioSummary } from '../types/data';
import { formatNumber, formatPercent, labelOf } from '../utils/format';

export default function DeliveryRiskRankingView() {
  const [data, setData] = useState<RiskScenarioSummary[]>([]);

  useEffect(() => {
    getRiskScenarioSummary().then(setData);
  }, []);

  if (!data.length) return <EmptyState />;

  return (
    <section className="table-card">
      <div className="card-heading">
        <h2>Delivery Risk Ranking View</h2>
        <p>借鉴 LineUp 的多属性排序思想，当前以天气/交通组合派生风险排序占位。</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Scenario</th>
            <th>订单数</th>
            <th>平均时长</th>
            <th>延迟率</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {data
            .slice()
            .sort((a, b) => b.risk_score - a.risk_score)
            .map((item, index) => (
              <tr key={item.scenario_id}>
                <td>{index + 1}</td>
                <td>{`${labelOf(item.weather)} / ${labelOf(item.traffic_density)} / ${labelOf(item.time_period)}`}</td>
                <td>{formatNumber(item.order_count)}</td>
                <td>{formatNumber(item.avg_delivery_duration_min, 1)}</td>
                <td>{formatPercent(item.delay_rate)}</td>
                <td>
                  <div className="risk-bar">
                    <span style={{ width: `${Math.min(100, item.risk_score * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}
