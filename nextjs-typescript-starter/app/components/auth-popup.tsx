'use client';

// 登录 / 注册弹窗：两种模式在同一弹窗内切换
// 表单提交走 Server Actions（app/actions/auth.ts），成功后由 signIn 重定向回当前页面
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  loginAction,
  registerAction,
  type AuthActionState,
} from '@/app/actions/auth';

interface AuthPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthPopup({ open, onOpenChange }: AuthPopupProps) {
  const pathname = usePathname();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const isLogin = mode === 'login';

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('redirectTo', pathname);
    setError(null);
    startTransition(async () => {
      const action = isLogin ? loginAction : registerAction;
      const res: AuthActionState = await action({}, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isLogin ? '邮箱登录' : '注册账号'}
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="关闭"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <div className="flex items-center rounded-md border border-gray-300 px-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4 shrink-0 text-gray-400"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <input
              name="email"
              type="email"
              required
              placeholder="邮箱"
              autoComplete="email"
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center rounded-md border border-gray-300 px-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4 shrink-0 text-gray-400"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <input
              name="password"
              type="password"
              required
              minLength={isLogin ? undefined : 6}
              placeholder="密码"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="h-10 w-full rounded-md bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {pending ? '请稍候…' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          {isLogin ? '没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={switchMode}
            className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isLogin ? '去注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
