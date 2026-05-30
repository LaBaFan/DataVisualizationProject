import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getCourierVehicleSummary } from '../api/client';
import ChartCard from '../components/ChartCard';
import { CourierVehicleSummary } from '../types/data';
import { labelOf } from '../utils/format';

export default function CourierVehicleView() {
  const [data, setData] = useState<CourierVehicleSummary | null>(null);

  useEffect(() => {
    getCourierVehicleSummary().then(setData);
  }, []);

  const option: EChartsOption | undefined = data
    ? {
        tooltip: { trigger: 'axis' },
        legend: { top: 0 },
        grid: { left: 56, right: 40, bottom: 44, top: 48 },
        xAxis: { type: 'category', data: data.by_vehicle_type.map((item) => labelOf(item.vehicle_type)) },
        yAxis: [{ type: 'value', name: '分钟' }, { type: 'value', name: '延迟率 %' }],
        series: [
          {
            name: '平均时长',
            type: 'bar',
            data: data.by_vehicle_type.map((item) => item.avg_delivery_duration_min),
            itemStyle: { color: '#4f7cac' }
          },
          {
            name: '延迟率',
            type: 'line',
            yAxisIndex: 1,
            data: data.by_vehicle_type.map((item) => Number((item.delay_rate * 100).toFixed(1))),
            itemStyle: { color: '#d95f59' }
          }
        ]
      }
    : undefined;

  return <ChartCard title="骑手与车辆" description="当前骨架先比较车辆类型表现。" option={option} isEmpty={!data} />;
}
