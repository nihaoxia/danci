// 学习进度：DTO 定义 + 客户端请求函数（服务端 route 与 client 组件共用）
// 进度数据全部来自真实数据库（user_book_progress / user_word_progress 联 books）

export interface BookProgress {
  bookId: string;
  title: string;
  wordCount: number; // 书的总词数
  lastWordRank: number; // 继续学习的位置（只前进不后退）
  learnedCount: number; // 真实已学词数（词级记录 count）
  updatedAt: string; // ISO 时间
}

/** 拉取某用户的全部书级进度（按 updatedAt 倒序） */
export async function fetchProgress(email: string): Promise<BookProgress[]> {
  try {
    const res = await fetch(`/api/progress?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as BookProgress[];
  } catch {
    return [];
  }
}

/** 上报学习进度：词级幂等插入 + 书级 greatest 前进，返回服务端最新进度列表 */
export async function saveProgressApi(
  email: string,
  bookId: string,
  wordRank: number
): Promise<BookProgress[]> {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, bookId, wordRank }),
  });
  if (!res.ok) {
    throw new Error(`保存进度失败: ${res.status}`);
  }
  return (await res.json()) as BookProgress[];
}
