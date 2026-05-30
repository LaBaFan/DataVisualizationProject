interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = '暂无可用数据',
  message = '请确认 processed 数据已生成，或后端 API 已启动。'
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}
