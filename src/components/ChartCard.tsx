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
    const chartElement = chartRef.current;
    const chart = echarts.init(chartElement);
    chart.setOption(option, true);
    if (onChartClick) {
      chart.on('click', onChartClick);
    }
    const resizeChart = () => chart.resize();
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resizeChart);
      resizeObserver.observe(chartElement);
    } else {
      window.addEventListener('resize', resizeChart);
    }
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resizeChart);
      }
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
