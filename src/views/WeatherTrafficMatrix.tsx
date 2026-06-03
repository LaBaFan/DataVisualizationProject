import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ChartCard from '../components/ChartCard';
import { WeatherTrafficSummary } from '../types/data';
import { formatNumber, formatPercent, labelOf } from '../utils/format';

interface WeatherTrafficMatrixProps {
  matrix: WeatherTrafficSummary[];
  selectedWeather?: string;
  selectedTraffic?: string;
  onSelectMatrix: (summary: WeatherTrafficSummary) => void;
}

export default function WeatherTrafficMatrix({
  matrix,
  selectedWeather,
  selectedTraffic,
  onSelectMatrix
}: WeatherTrafficMatrixProps) {
  const weathers = useMemo(() => Array.from(new Set(matrix.map((item) => labelOf(item.weather)))).sort(), [matrix]);
  const trafficLevels = useMemo(
    () => Array.from(new Set(matrix.map((item) => labelOf(item.traffic_density)))).sort(),
    [matrix]
  );

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { top: 18, left: 78, right: 28, bottom: 42 },
      tooltip: {
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          const raw = (item.data as { raw?: WeatherTrafficSummary }).raw;
          if (!raw) return '';
          return [
            `<strong>天气 × 交通压力</strong>`,
            `组合：${labelOf(raw.weather)} / ${labelOf(raw.traffic_density)}`,
            `订单量：${formatNumber(raw.order_count)}`,
            `延迟率：${formatPercent(raw.delay_rate)}`,
            `风险评分：${formatNumber(raw.risk_score, 2)}`,
            `平均配送时长：${formatNumber(raw.avg_delivery_duration_min, 1)} 分钟`,
            `平均距离：${formatNumber(raw.avg_distance_km, 1)} km`
          ].join('<br/>');
        }
      },
      xAxis: {
        type: 'category',
        data: trafficLevels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#d7ddd7' } },
        axisLabel: { color: '#4b5b55', fontWeight: 700 }
      },
      yAxis: {
        type: 'category',
        data: weathers,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#d7ddd7' } },
        axisLabel: { color: '#4b5b55', fontWeight: 700 }
      },
      visualMap: {
        min: 0,
        max: Math.max(0.5, ...matrix.map((item) => item.delay_rate)) || 0.5,
        show: false,
        inRange: { color: ['#d7f0ea', '#f2ca70', '#c2412d'] }
      },
      series: [
        {
          type: 'heatmap',
          data: matrix.map((item) => {
            const x = trafficLevels.indexOf(labelOf(item.traffic_density));
            const y = weathers.indexOf(labelOf(item.weather));
            const selected = labelOf(item.weather) === selectedWeather && labelOf(item.traffic_density) === selectedTraffic;
            return {
              value: [x, y, item.delay_rate],
              raw: item,
              itemStyle: {
                borderColor: selected ? '#172026' : '#ffffff',
                borderWidth: selected ? 3 : 2,
                borderRadius: 5
              }
            };
          }),
          label: {
            show: true,
            formatter: ({ data }) => {
              const raw = (data as { raw?: WeatherTrafficSummary }).raw;
              return raw ? formatPercent(raw.delay_rate, 0) : '';
            },
            color: '#18231f',
            fontWeight: 800
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: 'rgba(23, 32, 38, 0.25)'
            }
          }
        }
      ]
    }),
    [matrix, selectedTraffic, selectedWeather, trafficLevels, weathers]
  );

  return (
    <ChartCard
      title="天气 × 交通压力矩阵 / Weather × Traffic Pressure"
      description="点击天气与交通组合，快速锁定高延迟组合。"
      option={option}
      height={250}
      isEmpty={!matrix.length}
      onChartClick={(params) => {
        const raw = (params as { data?: { raw?: WeatherTrafficSummary } }).data?.raw;
        if (raw) onSelectMatrix(raw);
      }}
    />
  );
}
