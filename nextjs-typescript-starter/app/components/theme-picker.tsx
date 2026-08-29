'use client';

// 主题设置：「我的」页仅显示一个入口按钮，点击后弹出选择弹层
import { useState } from 'react';
import { THEMES, useTheme, type ThemeKey } from '@/app/components/theme-provider';

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 入口按钮（低调，与退出登录同排风格） */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-5.878M13.5 8.125c0-.621-.504-1.125-1.125-1.125h-6" />
          </svg>
          主题装扮
        </span>
        <span
          className="h-4 w-4 rounded-full border border-gray-200"
          style={{ background: THEMES.find((t) => t.key === theme)?.preview }}
          aria-hidden="true"
        />
      </button>

      {/* 主题选择弹层 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-20 sm:items-center sm:pb-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--card)] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">主题装扮</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="关闭"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((t) => {
                const active = t.key === theme;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTheme(t.key as ThemeKey)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${active
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]'
                        : 'border-transparent hover:bg-gray-50'
                      }`}
                    aria-pressed={active}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-black/5"
                      style={{ background: t.preview }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-sm font-medium text-gray-900">{t.name}</span>
                    {active && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-[var(--primary)]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
