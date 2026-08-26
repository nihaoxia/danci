"use client";

import * as React from "react";

import {
  getCurrentUser,
  signIn as signInFn,
  signOut as signOutFn,
  signUp as signUpFn,
  subscribe,
  type AuthError,
  type CurrentUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  signIn: (input: { email: string; password: string }) =>
    | { user?: CurrentUser; error?: AuthError };
  signUp: (input: { name: string; email: string; password: string }) =>
    | { user?: CurrentUser; error?: AuthError };
  signOut: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
    const unsub = subscribe(() => setUser(getCurrentUser()));
    return unsub;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: signInFn,
      signUp: signUpFn,
      signOut: signOutFn,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
