'use client';

// 主题选择器：7 套主题卡片，点击即全局切换（localStorage 持久化）
import { THEMES, useTheme, type ThemeKey } from '@/app/components/theme-provider';

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-semibold text-gray-900">主题装扮</h2>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const active = t.key === theme;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key as ThemeKey)}
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition-all ${
                active
                  ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]'
                  : 'border-transparent hover:scale-[1.02]'
              }`}
              style={{ background: t.preview }}
              aria-pressed={active}
            >
              <span className="text-xl drop-shadow-sm">{t.emoji}</span>
              <span
                className={`text-sm font-semibold ${
                  t.key === 'dark' ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                {t.name}
              </span>
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs text-[var(--primary)] shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
