import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ChartCard from '../components/ChartCard';
import FoodIcon from '../components/FoodIcon';
import RouteDecoration from '../components/RouteDecoration';
import { RiskScenario } from '../types/data';
import { formatNumber, formatPercent, labelOf } from '../utils/format';

interface DeliveryRiskMapProps {
  scenarios: RiskScenario[];
  selectedScenarioId?: string;
  onSelectScenario: (scenario: RiskScenario) => void;
}

function riskColor(score: number): string {
  if (score >= 0.75) return '#c2412d';
  if (score >= 0.5) return '#e07a2f';
  if (score >= 0.3) return '#d5a11e';
  return '#268b8f';
}

function scenarioCodes(scenario: RiskScenario): string[] {
  const codes = [`WX ${labelOf(scenario.weather)}`, `TR ${labelOf(scenario.traffic_density)}`];
  const time = labelOf(scenario.time_period);
  if (/dinner|night|evening/i.test(time)) codes.push(`ETA ${time}`);
  codes.push(`VEH ${labelOf(scenario.vehicle_type)}`);
  if ((scenario.multiple_delivery_rate ?? 0) >= 0.25) codes.push('MULTI');
  if (scenario.risk_score >= 0.7) codes.push('HIGH');
  return codes;
}

export default function DeliveryRiskMap({ scenarios, selectedScenarioId, onSelectScenario }: DeliveryRiskMapProps) {
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'item',
        borderWidth: 0,
        padding: 12,
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          const scenario = (item.data as { raw?: RiskScenario }).raw;
          if (!scenario) return '';
          return [
            '<strong>配送场景</strong>',
            `场景：${scenario.label}`,
            `编码：${scenarioCodes(scenario).join(' · ')}`,
            `订单量：${formatNumber(scenario.order_count)}`,
            `平均时长：${formatNumber(scenario.avg_delivery_duration_min, 1)} 分钟`,
            `延迟率：${formatPercent(scenario.delay_rate)}`,
            `平均距离：${formatNumber(scenario.avg_distance_km, 1)} km`,
            `风险评分：${formatNumber(scenario.risk_score, 2)}`
          ].join('<br/>');
        }
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          sort: 'desc',
          top: 8,
          left: 8,
          right: 8,
          bottom: 8,
          label: {
            color: '#fff8ed',
            fontWeight: 700,
            lineHeight: 16,
            formatter: ({ data }) => {
              const scenario = (data as { raw?: RiskScenario }).raw;
              if (!scenario) return '';
              const codeLine = scenarioCodes(scenario).slice(0, 3).join(' · ');
              return `{name|${scenario.label}}\n{metric|${formatPercent(scenario.delay_rate, 0)} delay · ${codeLine}}`;
            },
            rich: {
              name: { fontSize: 13, fontWeight: 800, lineHeight: 18 },
              metric: { fontSize: 11, opacity: 0.85 }
            }
          },
          upperLabel: { show: false },
          itemStyle: {
            borderColor: '#f9faf8',
            borderWidth: 3,
            gapWidth: 3,
            borderRadius: 6
          },
          levels: [
            {
              itemStyle: {
                borderWidth: 3,
                gapWidth: 3
              }
            }
          ],
          data: scenarios.map((scenario) => ({
            name: scenario.label,
            value: Math.max(scenario.order_count, 1),
            raw: scenario,
            itemStyle: {
              color: riskColor(scenario.risk_score),
              borderColor: scenario.scenario_id === selectedScenarioId ? '#172026' : '#f9faf8',
              borderWidth: scenario.scenario_id === selectedScenarioId ? 5 : 3,
              shadowBlur: scenario.scenario_id === selectedScenarioId ? 16 : 0,
              shadowColor: 'rgba(23, 32, 38, 0.28)'
            }
          }))
        }
      ]
    }),
    [scenarios, selectedScenarioId]
  );

  return (
    <ChartCard
      title="配送延迟风险地图 / Delivery Risk Map"
      description="面积 = 订单量，颜色 = 延迟风险。点击任一配送场景进入右侧 ETA Risk Ticket。"
      option={option}
      height={460}
      isEmpty={!scenarios.length}
      className="risk-map-card"
      onChartClick={(params) => {
        const scenario = (params as { data?: { raw?: RiskScenario } }).data?.raw;
        if (scenario) onSelectScenario(scenario);
      }}
    >
      <RouteDecoration compact />
      <div className="risk-legend" aria-hidden="true">
        <span>低风险</span>
        <i />
        <span>高风险</span>
      </div>
      <div className={`selected-route-chip ${selectedScenarioId ? 'active' : ''}`.trim()} aria-hidden="true">
        <FoodIcon name={selectedScenarioId ? 'risk' : 'rider'} />
        <span>{selectedScenarioId ? '当前分析场景 / Selected Route' : '等待选择配送场景'}</span>
      </div>
    </ChartCard>
  );
}
