import { useEffect, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getHourSummary, getTimeAnnotations } from '../data/client';
import ChartCard from '../components/ChartCard';
import { HourSummary, TimeAnnotation } from '../types/data';

export default function AnnotatedTemporalView() {
  const [hours, setHours] = useState<HourSummary[]>([]);
  const [annotations, setAnnotations] = useState<TimeAnnotation[]>([]);

  useEffect(() => {
    Promise.all([getHourSummary(), getTimeAnnotations()]).then(([hourData, annotationData]) => {
      setHours(hourData);
      setAnnotations(annotationData);
    });
  }, []);

  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 52, right: 52, bottom: 44, top: 48 },
    xAxis: { type: 'category', data: hours.map((item) => `${item.order_hour}:00`) },
    yAxis: { type: 'value', name: '平均分钟' },
    series: [
      {
        type: 'line',
        smooth: true,
        data: hours.map((item) => item.avg_delivery_duration_min),
        itemStyle: { color: '#4f7cac' },
        markPoint: {
          data: annotations.map((annotation) => ({
            name: annotation.label,
            coord: [`${annotation.time_value}:00`, hours.find((item) => item.order_hour === annotation.time_value)?.avg_delivery_duration_min ?? 0],
            value: annotation.label
          }))
        },
        markLine: {
          symbol: 'none',
          data: annotations.map((annotation) => ({ xAxis: `${annotation.time_value}:00`, name: annotation.label }))
        }
      }
    ]
  };

  return (
    <div className="view-stack">
      <ChartCard
        title="Annotated Temporal Pattern View"
        description="借鉴 TimeNotes，在小时趋势中标注业务高峰和数据峰值。"
        option={option}
        isEmpty={!hours.length}
      />
      <section className="annotation-list">
        {annotations.map((item) => (
          <article key={item.annotation_id}>
            <strong>{item.label}</strong>
            <span>{item.time_value}:00</span>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
