import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getCitySummary } from '../data/client';
import ChartCard from '../components/ChartCard';
import { CitySummary } from '../types/data';
import { labelOf } from '../utils/format';

export default function CityComparisonView() {
  const [data, setData] = useState<CitySummary[]>([]);

  useEffect(() => {
    getCitySummary().then(setData);
  }, []);

  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 56, right: 48, bottom: 44, top: 48 },
    xAxis: { type: 'category', data: data.map((item) => labelOf(item.city)) },
    yAxis: [{ type: 'value', name: '分钟' }, { type: 'value', name: '订单数' }],
    series: [
      { name: '平均时长', type: 'bar', data: data.map((item) => item.avg_delivery_duration_min), itemStyle: { color: '#4f7cac' } },
      { name: '订单数', type: 'line', yAxisIndex: 1, data: data.map((item) => item.order_count), itemStyle: { color: '#6a994e' } }
    ]
  };

  return (
    <ChartCard
      title="城市对比"
      description="比较不同城市类型的平均配送时长和订单量。"
      insight="柱形比较城市履约耗时，折线说明样本规模，避免把低订单量城市误读为稳定趋势。"
      option={option}
      isEmpty={!data.length}
    />
  );
}
