'use client';

// 可展开/收起列表：默认展示前 limit 条
import { useState } from 'react';

export function ExpandableList({
  items,
  limit = 6,
}: {
  items: React.ReactNode[];
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const rest = items.length - limit;
  const visible = expanded ? items : items.slice(0, limit);

  return (
    <div>
      <ul className="space-y-2">{visible}</ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-[var(--primary-text)]"
        >
          {expanded ? '收起' : `展开全部（还有 ${rest} 条）`}
        </button>
      )}
    </div>
  );
}
