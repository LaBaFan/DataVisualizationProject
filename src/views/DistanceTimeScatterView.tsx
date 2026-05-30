import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getDistanceTimeSample } from '../api/client';
import ChartCard from '../components/ChartCard';
import { DistanceTimePoint } from '../types/data';

export default function DistanceTimeScatterView() {
  const [data, setData] = useState<DistanceTimePoint[]>([]);

  useEffect(() => {
    getDistanceTimeSample().then(setData);
  }, []);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const value = Array.isArray(params.value) ? params.value : [];
        return `距离 ${value[0]} km<br/>时长 ${value[1]} min`;
      }
    },
    grid: { left: 56, right: 24, bottom: 44, top: 24 },
    xAxis: { type: 'value', name: '距离 km' },
    yAxis: { type: 'value', name: '配送时长 min' },
    series: [
      {
        type: 'scatter',
        symbolSize: 7,
        data: data.slice(0, 1200).map((item) => [
          Number(item.distance_km.toFixed(2)),
          item.delivery_duration_min,
          item.is_delayed ? 1 : 0
        ]),
        itemStyle: {
          color: (params: any) => (Array.isArray(params.value) && params.value[2] ? '#d95f59' : '#4f7cac'),
          opacity: 0.72
        }
      }
    ]
  };

  return (
    <ChartCard
      title="距离-时长散点"
      description="使用订单抽样数据观察距离与配送时长关系，红色表示延迟订单。"
      option={option}
      isEmpty={!data.length}
    />
  );
}
