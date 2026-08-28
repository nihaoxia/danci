// 全局加载骨架：Tab 切换 / 首次进入时立即反馈，避免白屏等待
export default function Loading() {
  return (
    <div className="flex items-center justify-center p-10" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
      <span className="ml-3 text-sm text-gray-400">加载中…</span>
    </div>
  );
}
