import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ChartCard from '../components/ChartCard';
import { TimePeriodSummary } from '../types/data';
import { formatNumber, formatPercent, labelOf } from '../utils/format';

interface TemporalSummaryStripProps {
  periods: TimePeriodSummary[];
  selectedTimePeriod?: string;
  onSelectTimePeriod: (summary: TimePeriodSummary) => void;
}

export default function TemporalSummaryStrip({
  periods,
  selectedTimePeriod,
  onSelectTimePeriod
}: TemporalSummaryStripProps) {
  const option = useMemo<EChartsOption>(
    () => ({
      grid: { top: 26, left: 42, right: 44, bottom: 34 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const items = Array.isArray(params) ? params : [params];
          const raw = (items[0]?.data as { raw?: TimePeriodSummary })?.raw;
          if (!raw) return '';
          return [
            `<strong>${labelOf(raw.time_period)}</strong>`,
            `订单量：${formatNumber(raw.order_count)}`,
            `平均时长：${formatNumber(raw.avg_delivery_duration_min, 1)} 分钟`,
            `延迟率：${formatPercent(raw.delay_rate)}`
          ].join('<br/>');
        }
      },
      xAxis: {
        type: 'category',
        data: periods.map((period) => labelOf(period.time_period)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#d7ddd7' } },
        axisLabel: { color: '#4b5b55', fontWeight: 700 }
      },
      yAxis: [
        {
          type: 'value',
          name: '订单',
          splitLine: { lineStyle: { color: '#edf0ec' } },
          axisLabel: { color: '#60706a' }
        },
        {
          type: 'value',
          name: '延迟率',
          min: 0,
          max: Math.max(0.5, ...periods.map((period) => period.delay_rate)) || 0.5,
          axisLabel: { formatter: (value: number) => `${Math.round(value * 100)}%`, color: '#60706a' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          type: 'bar',
          name: '订单量',
          data: periods.map((period) => ({
            value: period.order_count,
            raw: period,
            itemStyle: {
              color: period.time_period === selectedTimePeriod ? '#1f6f78' : '#75a6a3',
              borderRadius: [5, 5, 0, 0]
            }
          })),
          barWidth: 26
        },
        {
          type: 'line',
          name: '平均时长',
          data: periods.map((period) => period.avg_delivery_duration_min),
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: '#cc5638' },
          itemStyle: { color: '#cc5638' }
        },
        {
          type: 'line',
          name: '延迟率',
          yAxisIndex: 1,
          data: periods.map((period) => period.delay_rate),
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2, color: '#d5a11e', type: 'dashed' },
          itemStyle: { color: '#d5a11e' }
        }
      ]
    }),
    [periods, selectedTimePeriod]
  );

  const timeNotes = [
    'Breakfast',
    'Lunch Rush',
    'Dinner Rush',
    'Night Delivery'
  ];

  return (
    <ChartCard
      title="配送时段节奏 / ETA by Time Period"
      description="按时段扫视订单峰值、平均配送时长与延迟率。"
      option={option}
      height={250}
      isEmpty={!periods.length}
      onChartClick={(params) => {
        const raw = (params as { data?: { raw?: TimePeriodSummary }; name?: string }).data?.raw;
        const fallback = periods.find((period) => labelOf(period.time_period) === (params as { name?: string }).name);
        const period = raw ?? fallback;
        if (period) onSelectTimePeriod(period);
      }}
    >
      <div className="time-notes" aria-hidden="true">
        {timeNotes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>
    </ChartCard>
  );
}
