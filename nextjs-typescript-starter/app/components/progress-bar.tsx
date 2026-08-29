// 纯展示进度条：value / total → 宽度百分比
export function ProgressBar({
  value,
  total,
  className = '',
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-[var(--card-soft)] ${className}`}>
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
