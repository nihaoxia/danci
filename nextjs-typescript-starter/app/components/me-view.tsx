'use client';

// 「我的」页视图：未登录 → 引导卡片 + 登录/注册 popup；已登录 → 用户信息 + 学习进度
// 单词书数据由服务端（app/me/page.tsx）从 books 表查询后传入，进度分母使用真实 wordCount
// 登录态来自 NextAuth session（AuthProvider）；退出登录走 Server Action
import Link from 'next/link';
import { useState } from 'react';
import { signOutAction } from '@/app/actions/auth';
import { AuthPopup } from '@/app/components/auth-popup';
import { useAuth } from '@/app/components/auth-provider';
import { ProgressBar } from '@/app/components/progress-bar';
import type { Book } from '@/db/schema';

export function MeView({
  books,
  autoOpenLogin,
}: {
  books: Book[];
  autoOpenLogin: boolean;
}) {
  const { user, progressList } = useAuth();
  const [popupOpen, setPopupOpen] = useState(autoOpenLogin);

  // 已登录视图
  if (user) {
    const items = [...progressList]
      .map((p) => ({ progress: p, book: books.find((b) => b.bookId === p.bookId) }))
      .filter((item): item is { progress: typeof progressList[number]; book: Book } => !!item.book)
      .sort(
        (a, b) =>
          new Date(b.progress.updatedAt).getTime() - new Date(a.progress.updatedAt).getTime()
      );

    return (
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-600">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
            {user.email}
          </p>
        </div>

        <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">学习进度</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">还没有学习记录，</p>
            <Link
              href="/"
              className="mt-1 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              去首页挑一本书吧
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(({ progress, book }) => (
              <li key={progress.bookId}>
                <Link
                  href={`/study/${progress.bookId}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
                >
                  <p className="truncate text-sm font-medium text-gray-900">{book.title}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={progress.learnedCount} total={book.wordCount} />
                    <span className="shrink-0 text-xs text-gray-500">
                      {progress.learnedCount}/{book.wordCount}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-8 h-10 w-full rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            退出登录
          </button>
        </form>
      </div>
    );
  }

  // 未登录视图
  return (
    <div className="p-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-8 w-8 text-indigo-500"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <p className="text-base font-medium text-gray-900">登录后开始学习</p>
        <p className="text-sm text-gray-500">记录学习进度，随时继续</p>
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="h-10 w-full rounded-md bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          登录 / 注册
        </button>
      </div>

      <AuthPopup open={popupOpen} onOpenChange={setPopupOpen} />
    </div>
  );
}
