import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getWeatherTrafficSummary } from '../data/client';
import ChartCard from '../components/ChartCard';
import { WeatherTrafficSummary } from '../types/data';
import { labelOf } from '../utils/format';

export default function WeatherTrafficView() {
  const [data, setData] = useState<WeatherTrafficSummary[]>([]);

  useEffect(() => {
    getWeatherTrafficSummary().then(setData);
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const top = data.slice().sort((a, b) => b.avg_delivery_duration_min - a.avg_delivery_duration_min).slice(0, 12);
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 140, right: 24, bottom: 36, top: 24 },
      xAxis: { type: 'value', name: '平均分钟' },
      yAxis: { type: 'category', data: top.map((item) => `${labelOf(item.weather)} / ${labelOf(item.traffic_density)}`) },
      series: [{ type: 'bar', data: top.map((item) => item.avg_delivery_duration_min), itemStyle: { color: '#6a994e' } }]
    };
  }, [data]);

  return <ChartCard title="天气与交通组合" description="按平均配送时长展示高耗时组合。" option={option} isEmpty={!data.length} />;
}
