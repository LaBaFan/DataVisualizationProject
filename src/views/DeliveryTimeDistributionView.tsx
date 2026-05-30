import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getDeliveryTimeDistribution } from '../api/client';
import ChartCard from '../components/ChartCard';
import { DeliveryTimeDistribution } from '../types/data';

export default function DeliveryTimeDistributionView() {
  const [data, setData] = useState<DeliveryTimeDistribution | null>(null);

  useEffect(() => {
    getDeliveryTimeDistribution().then(setData);
  }, []);

  const option: EChartsOption | undefined = data
    ? {
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, bottom: 36, top: 24 },
        xAxis: { type: 'category', data: data.bins.map((bin) => bin.range), name: '分钟区间' },
        yAxis: { type: 'value', name: '订单数' },
        series: [{ type: 'bar', data: data.bins.map((bin) => bin.count), itemStyle: { color: '#4f7cac' } }]
      }
    : undefined;

  return (
    <ChartCard
      title="配送时长分布"
      description="展示配送时间直方分布和长尾延迟区间。"
      option={option}
      isEmpty={!data}
    />
  );
}
