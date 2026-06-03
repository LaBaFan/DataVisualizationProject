interface EmptyStateProps {
  title?: string;
  message?: string;
  compact?: boolean;
}

export default function EmptyState({
  title = '暂无可用数据',
  message = '请确认 public/data/*.json 静态数据是否存在；缺失时页面会使用 mock 数据兜底。',
  compact = false
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`.trim()}>
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}
