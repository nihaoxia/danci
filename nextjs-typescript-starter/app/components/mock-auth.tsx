'use client';

// Mock 认证 Provider：用户会话仍用 localStorage 模拟（接 NextAuth 前的过渡实现），
// 学习进度则完全走真实数据库（GET/POST /api/progress → user_book_progress / user_word_progress）。

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { seededEmails, type MockUser } from '@/lib/mock-data';
import {
  fetchProgress,
  saveProgressApi,
  type BookProgress,
} from '@/lib/progress';

const USERS_KEY = 'mock-users';
const USER_KEY = 'mock-user';

interface MockAuthContextValue {
  user: MockUser | null;
  hydrated: boolean;
  progressList: BookProgress[];
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  getProgress: (bookId: string) => BookProgress | null;
  saveProgress: (bookId: string, wordRank: number) => void;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 不可用时静默失败
  }
}

// 模拟网络延迟，让 pending 状态可见
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [progressList, setProgressList] = useState<BookProgress[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const userRef = useRef<MockUser | null>(null);
  userRef.current = user;

  // 从服务端拉取进度（登录 / 恢复会话时调用）
  const refreshProgress = useCallback(async (email: string) => {
    const list = await fetchProgress(email);
    setProgressList(list);
  }, []);

  // 初始化：恢复登录态，并从数据库拉取对应用户的进度
  useEffect(() => {
    const stored = readJson<MockUser | null>(USER_KEY, null);
    if (stored?.email) {
      setUser(stored);
      void refreshProgress(stored.email);
    }
    setHydrated(true);
  }, [refreshProgress]);

  const login = useCallback(
    async (email: string, password: string) => {
      await delay(500);
      const trimmed = email.trim().toLowerCase();
      const users = readJson<string[]>(USERS_KEY, seededEmails);
      if (!users.includes(trimmed)) {
        return '邮箱或密码错误';
      }
      const nextUser = { id: 1, email: trimmed };
      setUser(nextUser);
      writeJson(USER_KEY, nextUser);
      void refreshProgress(trimmed);
      return null;
    },
    [refreshProgress]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await delay(500);
      const trimmed = email.trim().toLowerCase();
      if (password.length < 6) return '密码至少需要 6 位';
      const users = readJson<string[]>(USERS_KEY, seededEmails);
      if (users.includes(trimmed)) {
        return '该邮箱已注册，请直接登录';
      }
      writeJson(USERS_KEY, [...users, trimmed]);
      const nextUser = { id: users.length + 1, email: trimmed };
      setUser(nextUser);
      writeJson(USER_KEY, nextUser);
      setProgressList([]);
      return null;
    },
    []
  );

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setProgressList([]);
  }, []);

  const getProgress = useCallback(
    (bookId: string) => progressList.find((p) => p.bookId === bookId) ?? null,
    [progressList]
  );

  const saveProgress = useCallback(
    (bookId: string, wordRank: number) => {
      const email = userRef.current?.email;
      if (!email) return;
      // 乐观更新（greatest 语义：只前进不后退）
      setProgressList((prev) => {
        const existing = prev.find((p) => p.bookId === bookId);
        if (existing && wordRank <= existing.lastWordRank) return prev;
        const next = existing
          ? prev.map((p) =>
            p.bookId === bookId
              ? {
                ...p,
                lastWordRank: wordRank,
                learnedCount:
                  wordRank > p.lastWordRank ? p.learnedCount + 1 : p.learnedCount,
                updatedAt: new Date().toISOString(),
              }
              : p
          )
          : [
            ...prev,
            {
              bookId,
              title: '', // 服务端返回后带上真实书名
              wordCount: 0,
              lastWordRank: wordRank,
              learnedCount: 1,
              updatedAt: new Date().toISOString(),
            },
          ];
        return next;
      });
      // 服务端持久化：词级幂等插入 + 书级 greatest 前进，返回值覆盖为服务端真值
      void saveProgressApi(email, bookId, wordRank)
        .then(setProgressList)
        .catch(() => {
          // 保存失败时保留乐观值，下次操作会重新同步
        });
    },
    []
  );

  const value = useMemo(
    () => ({ user, hydrated, progressList, login, register, logout, getProgress, saveProgress }),
    [user, hydrated, progressList, login, register, logout, getProgress, saveProgress]
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error('useMockAuth 必须在 MockAuthProvider 内使用');
  return ctx;
}
