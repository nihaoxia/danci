'use client';

// 首页视图（Tab 1）：最近学习（已登录）+ 全部单词书
// 单词书数据由服务端（app/page.tsx）从 books 表查询后传入
import Link from 'next/link';
import { useMockAuth } from '@/app/components/mock-auth';
import type { Book } from '@/db/schema';

export function HomeView({ books }: { books: Book[] }) {
  const { user, hydrated, progressList } = useMockAuth();

  if (!hydrated) {
    return <p className="p-8 text-center text-sm text-gray-400">加载中…</p>;
  }

  // 已登录：最近学习（按 updatedAt 倒序，最多 5 条，仅展示有数据的书）
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
      .slice(0, 5)
    : [];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900">单词学习</h1>

      {user && recent.length > 0 && (
        <>
          <h2 className="mb-2 mt-5 text-base font-semibold text-gray-900">最近学习</h2>
          <ul className="space-y-3">
            {recent.map(({ progress, book }) => (
              <li key={progress.bookId}>
                <Link
                  href={`/study/${progress.bookId}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{book.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      已学 {progress.learnedCount}/{book.wordCount}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-indigo-600">
                    继续学习
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">全部单词书</h2>
      {books.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
          暂无单词书，快去后台添加吧
        </p>
      ) : (
        <ul className="space-y-3">
          {books.map((book) => (
            <li key={book.id}>
              <BookCard book={book} loggedIn={!!user} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookCard({ book, loggedIn }: { book: Book; loggedIn: boolean }) {
  const href = loggedIn ? `/study/${book.bookId}` : '/me?login=1';
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
    >
      <div className="flex h-14 w-11 shrink-0 items-end justify-center rounded-md bg-gradient-to-br from-indigo-400 to-indigo-600 pb-1 text-center text-xs font-bold text-white">
        学
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{book.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {book.wordCount} 词{book.tags.length > 0 && ` · ${book.tags.join(' · ')}`}
        </p>
      </div>
    </Link>
  );
}
