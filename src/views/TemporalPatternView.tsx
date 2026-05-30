import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getHourSummary } from '../api/client';
import ChartCard from '../components/ChartCard';
import { HourSummary } from '../types/data';

export default function TemporalPatternView() {
  const [data, setData] = useState<HourSummary[]>([]);

  useEffect(() => {
    getHourSummary().then(setData);
  }, []);

  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 52, right: 52, bottom: 40, top: 48 },
    xAxis: { type: 'category', data: data.map((item) => `${item.order_hour}:00`) },
    yAxis: [
      { type: 'value', name: '分钟' },
      { type: 'value', name: '延迟率 %' }
    ],
    series: [
      {
        name: '平均时长',
        type: 'line',
        smooth: true,
        data: data.map((item) => item.avg_delivery_duration_min),
        itemStyle: { color: '#4f7cac' }
      },
      {
        name: '延迟率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.map((item) => Number((item.delay_rate * 100).toFixed(1))),
        itemStyle: { color: '#d95f59' }
      }
    ]
  };

  return <ChartCard title="小时趋势" description="按小时比较平均配送时长和延迟率。" option={option} isEmpty={!data.length} />;
}
