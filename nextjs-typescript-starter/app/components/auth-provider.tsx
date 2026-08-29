'use client';

// 认证 Provider：NextAuth Session 驱动
// - 登录态来自 /api/auth/session（SessionProvider），页面保持 ISR 缓存
// - 学习进度走真实数据库（GET/POST /api/progress），登录后自动拉取，学习中乐观更新 + 服务端持久化
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';

import { fetchProgress, saveProgressApi, type BookProgress } from '@/lib/progress';

export interface ProfileInfo {
  nickname?: string | null;
  signature?: string | null;
  avatar?: string | null;
}

interface AuthUser {
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  profile: ProfileInfo;
  setProfile: (profile: ProfileInfo) => void;
  progressList: BookProgress[];
  getProgress: (bookId: string) => BookProgress | null;
  saveProgress: (bookId: string, wordRank: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const email = session?.user?.email?.toLowerCase() ?? null;
  const [progressList, setProgressList] = useState<BookProgress[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo>({});

  // 登录（或 session 恢复）后从数据库拉取进度与个人资料；未登录清空
  // 注意：不能用「已拉取过」标记做防重——StrictMode 下 effect 会挂载两次，
  // 第一次请求被 cleanup 取消后，第二次会被标记挡住，导致刷新后进度永远拉不回来
  useEffect(() => {
    if (!email) {
      setProgressList([]);
      setProgressLoaded(false);
      setProfile({});
      return;
    }
    let cancelled = false;
    fetchProgress().then((list) => {
      if (!cancelled) {
        setProgressList(list);
        setProgressLoaded(true);
      }
    });
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setProfile(data.profile ?? {});
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const getProgress = useCallbackRef((bookId: string) => {
    return progressList.find((p) => p.bookId === bookId) ?? null;
  }, [progressList]);

  const saveProgress = useCallbackRef((bookId: string, wordRank: number) => {
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
    void saveProgressApi(bookId, wordRank)
      .then(setProgressList)
      .catch(() => {
        // 保存失败（如 session 过期）时保留乐观值，后续操作会重新同步
      });
  }, [email]);

  const hydrated = status !== 'loading' && (!email || progressLoaded);

  const value = useMemo(
    () => ({
      user: email ? { email } : null,
      hydrated,
      profile,
      setProfile,
      progressList,
      getProgress,
      saveProgress,
    }),
    [email, hydrated, profile, progressList, getProgress, saveProgress]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 稳定的 useCallback 替身（避免组件内条件分支引入规则冲突）
function useCallbackRef<T extends (...args: never[]) => unknown>(
  fn: T,
  deps: React.DependencyList
): T {
  return useMemo(() => fn, deps);
}

export function AuthProvider({
  session,
  children,
}: {
  session: Session | null; // 服务端 auth() 初始 session：SSR 即登录态，刷新不闪未登录
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
