'use client';

// 主题上下文：切换 html.theme-* class 并持久化到 localStorage
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const THEMES = [
  { key: 'green', name: '清新绿', preview: 'linear-gradient(135deg, #dcfce7, #6ee7a0)' },
  { key: 'pink', name: '樱花粉', preview: 'linear-gradient(135deg, #fce7f3, #f7a8c9)' },
  { key: 'red', name: '热情红', preview: 'linear-gradient(135deg, #fee2e2, #f8a09a)' },
  { key: 'purple', name: '神秘紫', preview: 'linear-gradient(135deg, #f3e8ff, #b57ee8)' },
  { key: 'dark', name: '深邃黑', preview: 'linear-gradient(135deg, #2c3752, #0d1220)' },
  { key: 'pearl', name: '珍珠白', preview: 'linear-gradient(135deg, #ffffff, #ddd3c2)' },
  { key: 'blue', name: '大海蓝', preview: 'linear-gradient(135deg, #dbeafe, #7db1f5)' },
] as const;

export type ThemeKey = (typeof THEMES)[number]['key'];
export const DEFAULT_THEME: ThemeKey = 'green';
const STORAGE_KEY = 'word-theme';

const THEME_KEYS = THEMES.map((t) => t.key);

function applyTheme(key: ThemeKey) {
  const root = document.documentElement;
  THEME_KEYS.forEach((k) => root.classList.remove(`theme-${k}`));
  root.classList.add(`theme-${key}`);
}

interface ThemeContextValue {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 初值始终为默认主题，避免 SSR/CSR 不一致；挂载后再同步 localStorage
  const [theme, setThemeState] = useState<ThemeKey>(DEFAULT_THEME);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // 隐私模式等场景读不到，用默认主题
    }
    if (saved && THEME_KEYS.includes(saved as ThemeKey)) {
      setThemeState(saved as ThemeKey);
      applyTheme(saved as ThemeKey);
    } else {
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeState(key);
    applyTheme(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // 写不进就仅本次会话生效
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
