import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { loadOverviewSummary } from '../../api/staticDataClient';
import type { MapSelection, OverviewMetricSelection, OverviewSummary } from '../../types/data';

interface OverallDataOverviewBadgesProps {
  onSelect: (selection: MapSelection) => void;
}

const sourceFile = 'overview_summary.json';

function fmt(value: number | undefined, digits = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function fmtRate(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  const normalized = value > 1 ? value : value * 100;
  return `${fmt(normalized, 1)}%`;
}

function buildMetric(
  metricKey: keyof OverviewSummary,
  label: string,
  value: string,
  definition: string,
  icon: string,
  unit?: string
): OverviewMetricSelection & { icon: string } {
  return {
    id: `overview-metric-${metricKey}`,
    metricKey,
    label,
    value,
    definition,
    dataFilter: '全部清洗订单',
    sourceFile,
    unit,
    icon
  };
}

function metricList(summary: OverviewSummary | null) {
  const validOrders = summary?.valid_orders ?? summary?.order_count ?? summary?.total_orders;
  const required = [
    buildMetric('valid_orders', '有效订单', fmt(validOrders), '完成清洗并进入 FoodETA 总览统计口径的订单数量。', '单'),
    buildMetric('avg_delivery_duration_min', '平均时长', `${fmt(summary?.avg_delivery_duration_min, 1)} 分钟`, '全部清洗订单的平均配送时长。', '时', '分钟'),
    buildMetric('delay_rate', '延迟率', fmtRate(summary?.delay_rate), '配送时长超过延迟阈值的订单占比。', '%'),
    buildMetric('avg_distance_km', '平均距离', `${fmt(summary?.avg_distance_km, 1)} 公里`, '全部清洗订单的平均配送距离。', '距', '公里'),
    buildMetric('delay_threshold_min', '延迟阈值', `${fmt(summary?.delay_threshold_min, 1)} 分钟`, '用于判定订单是否延迟的配送时长阈值。', '阈', '分钟')
  ];

  const optional = [
    buildMetric('weather_categories', '天气类别', fmt(summary?.weather_categories), '总览数据中可用于天气筛选的类别数量。', '天'),
    buildMetric('vehicle_type_categories', '载具类别', '3', '当前前端保留的载具类别数量：摩托车、踏板车、电动车。', '车'),
    buildMetric('avg_speed_kmph', '平均速度', `${fmt(summary?.avg_speed_kmph, 1)} 公里/小时`, '全部清洗订单折算得到的平均配送速度。', '速', '公里/小时')
  ].filter((metric) => metric.value !== '-' && !metric.value.startsWith('- '));

  return [...required, ...optional];
}

export default function OverallDataOverviewBadges({ onSelect }: OverallDataOverviewBadgesProps) {
  const [summary, setSummary] = useState<OverviewSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    loadOverviewSummary().then((data) => {
      if (mounted) setSummary(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => metricList(summary), [summary]);

  const handleSelect = (metric: OverviewMetricSelection, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect({ type: 'overview_metric', item: metric });
  };

  return (
    <div className="overall-data-badges" aria-label="FoodETA 全局配送数据概览" onClick={(event) => event.stopPropagation()}>
      <div className="overall-data-badges-head">
        <span>FoodETA 全局配送数据概览</span>
        <small>{sourceFile}</small>
      </div>
      <div className="overall-data-badge-grid">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            type="button"
            className="overall-data-badge"
            title={`${metric.label}：${metric.definition} 来源：${metric.sourceFile}`}
            onClick={(event) => handleSelect(metric, event)}
          >
            <span className="overall-data-badge-icon" aria-hidden="true">{metric.icon}</span>
            <span>
              <strong>{metric.value}</strong>
              <small>{metric.label}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
