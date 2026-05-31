import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getDelayFactorFlow } from '../data/client';
import ChartCard from '../components/ChartCard';
import { DelayFactorFlow } from '../types/data';

export default function DelayFactorFlowView() {
  const [data, setData] = useState<DelayFactorFlow[]>([]);

  useEffect(() => {
    getDelayFactorFlow().then(setData);
  }, []);

  const nodes = Array.from(new Set(data.flatMap((item) => [item.source, item.target]))).map((name) => ({ name }));
  const option: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'sankey',
        top: 20,
        bottom: 20,
        left: 20,
        right: 60,
        nodeWidth: 16,
        nodeGap: 10,
        data: nodes,
        links: data.map((item) => ({
          source: item.source,
          target: item.target,
          value: item.order_count
        })),
        lineStyle: { color: 'gradient', opacity: 0.35 },
        itemStyle: { color: '#4f7cac' },
        label: { fontSize: 12 }
      }
    ]
  };

  return (
    <ChartCard
      title="Delay Factor Flow View"
      description="借鉴 Parallel Sets，用 Sankey 占位表达天气、交通与延迟结果路径。"
      option={option}
      isEmpty={!data.length}
    />
  );
}
