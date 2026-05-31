interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = '暂无可用数据',
  message = '请确认 processed 数据已生成并位于 data/processed/ 目录。'
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}
