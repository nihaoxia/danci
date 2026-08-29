'use client';

// 「我的」页视图：未登录 → 引导卡片 + 登录/注册 popup；已登录 → 用户信息（头像/昵称/签名）+ 学习进度 + 设置
// 单词书数据由服务端（app/me/page.tsx）从 books 表查询后传入，进度分母使用真实 wordCount
// 登录态来自 NextAuth session（AuthProvider）；退出登录/切换账号收进设置弹层
import Link from 'next/link';
import { useState } from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { AuthPopup } from '@/app/components/auth-popup';
import { useAuth } from '@/app/components/auth-provider';
import { ProgressBar } from '@/app/components/progress-bar';
import { ThemePicker } from '@/app/components/theme-picker';
import { SettingsEntry } from '@/app/components/profile-dialog';
import type { Book } from '@/db/schema';

export function MeView({
  books,
  autoOpenLogin,
}: {
  books: Book[];
  autoOpenLogin: boolean;
}) {
  const { user, profile, setProfile, progressList } = useAuth();
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
    const displayName = profile.nickname || user.email.split('@')[0];

    return (
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          {/* 头像（Radix Avatar：图片加载失败回退首字母） */}
          <Avatar.Root className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-[var(--primary-soft)]">
            {profile.avatar && (
              <Avatar.Image src={profile.avatar} className="h-full w-full object-cover" alt="头像" />
            )}
            <Avatar.Fallback className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--primary-text)]">
              {displayName.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="truncate text-xs text-gray-500">{profile.signature || user.email}</p>
          </div>
          {/* 设置入口：修改资料 / 切换账号 / 退出登录都收在这里 */}
          <SettingsEntry profile={profile} onSaved={setProfile} />
        </div>

        <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">学习进度</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">还没有学习记录，</p>
            <Link
              href="/"
              className="mt-1 inline-block text-sm font-medium text-[var(--primary-text)]"
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
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors hover:border-[var(--border-strong)]"
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

        <ThemePicker />
      </div>
    );
  }

  // 未登录视图
  return (
    <div className="p-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-soft)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-8 w-8 text-[var(--primary)]"
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
          className="h-10 w-full rounded-md bg-[var(--primary)] text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          登录 / 注册
        </button>
      </div>

      <ThemePicker />

      <AuthPopup open={popupOpen} onOpenChange={setPopupOpen} />
    </div>
  );
}
