'use client';

// 学习页视图：登录校验、按 mock 进度计算起始位置、渲染卡片
// 单词与书籍数据由服务端（app/study/[bookId]/page.tsx）从数据库查询后传入
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/components/auth-provider';
import { WordCard, type CardWord } from '@/app/components/word-card';

interface StudyBook {
  bookId: string;
  title: string;
}

export function StudyView({
  book,
  cardWords,
}: {
  book: StudyBook;
  cardWords: CardWord[];
}) {
  const router = useRouter();
  const { user, hydrated, getProgress } = useAuth();

  // 未登录访问学习页 → 我的页并自动弹出登录 popup
  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/me?login=1');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return <p className="p-8 text-center text-sm text-gray-400">加载中…</p>;
  }

  if (cardWords.length === 0) {
    return (
      <EmptyState text="本书暂无单词">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          返回首页
        </Link>
      </EmptyState>
    );
  }

  // 起始位置：最近学到的单词的下一个；无进度则从第 1 个开始
  // 用「第一个 rank >= startRank 的单词」兜底 wordRank 不连续的情况
  const progress = getProgress(book.bookId);
  const startRank = progress ? progress.lastWordRank + 1 : 1;
  const initialIndex = cardWords.findIndex((w) => w.rank >= startRank);
  // 找不到（lastWordRank 已是最后一词或超出）→ 传入 words.length 表示已学完
  const startIndex = initialIndex === -1 ? cardWords.length : initialIndex;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="返回"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
          {book.title}
        </h1>
      </div>

      <WordCard bookId={book.bookId} words={cardWords} initialIndex={startIndex} />
    </div>
  );
}

function EmptyState({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 pt-20 text-center">
      <p className="text-sm text-gray-500">{text}</p>
      {children}
    </div>
  );
}
