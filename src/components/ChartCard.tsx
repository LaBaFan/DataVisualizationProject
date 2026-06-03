import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import EmptyState from './EmptyState';

interface ChartCardProps {
  title: string;
  description?: string;
  option?: EChartsOption;
  height?: number;
  children?: ReactNode;
  isEmpty?: boolean;
  className?: string;
  onChartClick?: (params: unknown) => void;
}

export default function ChartCard({
  title,
  description,
  option,
  height = 320,
  children,
  isEmpty = false,
  className = '',
  onChartClick
}: ChartCardProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current || !option || isEmpty) return undefined;
    const chart = echarts.init(chartRef.current);
    chart.setOption(option, true);
    if (onChartClick) {
      chart.on('click', onChartClick);
    }
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (onChartClick) {
        chart.off('click', onChartClick);
      }
      chart.dispose();
    };
  }, [option, isEmpty, onChartClick]);

  return (
    <section className={`chart-card ${className}`.trim()}>
      <div className="card-heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
      {isEmpty ? <EmptyState /> : option ? <div ref={chartRef} style={{ height }} /> : null}
    </section>
  );
}
