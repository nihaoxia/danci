'use client';

// 首页视图（Tab 1）：主题色 Hero（问候/统计/继续学习主推）+ 全部单词书（封面卡片）
// 单词书数据由服务端（app/page.tsx）从 books 表查询后传入
import Link from 'next/link';
import { useAuth } from '@/app/components/auth-provider';
import { ProgressBar } from '@/app/components/progress-bar';
import type { Book } from '@/db/schema';

export function HomeView({ books }: { books: Book[] }) {
  const { user, hydrated, profile, progressList } = useAuth();

  if (!hydrated) {
    return <p className="p-8 text-center text-sm text-gray-400">加载中…</p>;
  }

  // 已登录：最近学习（按 updatedAt 倒序），第一本作为 Hero 主推
  const recent = user
    ? [...progressList]
      .map((p) => ({ progress: p, book: books.find((b) => b.bookId === p.bookId) }))
      .filter(
        (item): item is { progress: typeof progressList[number]; book: Book } => !!item.book
      )
      .sort(
        (a, b) =>
          new Date(b.progress.updatedAt).getTime() -
          new Date(a.progress.updatedAt).getTime()
      )
    : [];
  const featured = recent[0];
  const totalLearned = progressList.reduce((sum, p) => sum + p.learnedCount, 0);

  return (
    <div className="pb-4">
      {/* Hero：主题渐变区 */}
      <div
        className="mx-4 mt-10 rounded-3xl p-5 text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
      >
        {user ? (
          <>
            <p className="text-xs opacity-80">
              Hi，{profile.nickname || user.email.split('@')[0]}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold">已学 {totalLearned}</span>
              <span className="text-sm opacity-80">词</span>
            </div>
            {featured ? (
              <div className="mt-4 rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                <p className="truncate text-xs opacity-90">
                  上次学到《{featured.book.title}》第 {featured.progress.lastWordRank} 词
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar
                      value={featured.progress.learnedCount}
                      total={featured.book.wordCount}
                      className="!bg-white/30"
                    />
                  </div>
                  <span className="shrink-0 text-xs opacity-90">
                    {featured.progress.learnedCount}/{featured.book.wordCount}
                  </span>
                </div>
                <Link
                  href={`/study/${featured.book.bookId}`}
                  className="mt-3 flex h-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--primary-text)] shadow-sm transition-transform active:scale-95"
                >
                  继续学习
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm opacity-90">去下面挑一本书，开始你的第一课吧</p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">单词学习</p>
            <p className="mt-1 text-sm opacity-90">每天进步一点点，词汇量看得见</p>
            <Link
              href="/me?login=1"
              className="mt-4 flex h-9 w-28 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--primary-text)] shadow-sm transition-transform active:scale-95"
            >
              开始学习
            </Link>
          </>
        )}
      </div>

      {/* 全部单词书 */}
      <h2 className="mb-2 mt-6 px-4 text-base font-semibold text-gray-900">全部单词书</h2>
      {books.length === 0 ? (
        <p className="mx-4 rounded-2xl border border-dashed border-gray-200 bg-[var(--card)] p-6 text-center text-sm text-gray-400">
          暂无单词书，快去后台添加吧
        </p>
      ) : (
        <ul className="space-y-3 px-4">
          {books.map((book) => {
            const progress = progressList.find((p) => p.bookId === book.bookId);
            return <BookCard key={book.id} book={book} loggedIn={!!user} progress={progress} />;
          })}
        </ul>
      )}
    </div>
  );
}

function BookCard({
  book,
  loggedIn,
  progress,
}: {
  book: Book;
  loggedIn: boolean;
  progress?: { learnedCount: number };
}) {
  const href = loggedIn ? `/study/${book.bookId}` : '/me?login=1';
  const pct =
    progress && book.wordCount > 0
      ? Math.min(100, Math.round((progress.learnedCount / book.wordCount) * 100))
      : 0;
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md"
      >
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-20 w-16 shrink-0 rounded-lg object-cover shadow-sm"
          />
        ) : (
          <div
            className="flex h-20 w-16 shrink-0 items-end justify-center rounded-lg pb-1.5 text-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
          >
            学
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{book.title}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs text-gray-500">{book.wordCount} 词</span>
            {book.tags.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-text)]"
              >
                {tag}
              </span>
            ))}
          </div>
          {loggedIn && progress && (
            <div className="mt-2 flex items-center gap-2">
              <ProgressBar value={progress.learnedCount} total={book.wordCount} />
              <span className="shrink-0 text-[10px] text-gray-400">{pct}%</span>
            </div>
          )}
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4 shrink-0 text-gray-300"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </li>
  );
}
