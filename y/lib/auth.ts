// 基于 localStorage 的模拟登录态（仅 UI 演示用）

export type AdminUser = {
  name: string;
  email: string;
  password: string; // 仅演示，明文存储
  role: "super" | "admin";
  createdAt: string;
};

export type CurrentUser = Omit<AdminUser, "password">;

const USERS_KEY = "danci:users";
const SESSION_KEY = "danci:session";

function isBrowser() {
  return typeof window !== "undefined";
}

function readUsers(): AdminUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as AdminUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: AdminUser[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublic(u: AdminUser): CurrentUser {
  const { password: _password, ...rest } = u;
  return rest;
}

export function getAllUsers(): AdminUser[] {
  return readUsers();
}

export function getCurrentUser(): CurrentUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function hasAnyUser(): boolean {
  return readUsers().length > 0;
}

export type AuthError = { message: string };

export function signUp(input: {
  name: string;
  email: string;
  password: string;
}): { user?: CurrentUser; error?: AuthError } {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) return { error: { message: "请输入姓名" } };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: { message: "邮箱格式不正确" } };
  if (input.password.length < 6)
    return { error: { message: "密码至少 6 位" } };

  const users = readUsers();
  if (users.some((u) => u.email === email))
    return { error: { message: "该邮箱已被注册" } };

  const newUser: AdminUser = {
    name: input.name.trim(),
    email,
    password: input.password,
    role: users.length === 0 ? "super" : "admin",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);

  const pub = toPublic(newUser);
  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(pub));
    notify();
  }
  return { user: pub };
}

export function signIn(input: {
  email: string;
  password: string;
}): { user?: CurrentUser; error?: AuthError } {
  const email = input.email.trim().toLowerCase();
  const users = readUsers();
  const found = users.find((u) => u.email === email);
  if (!found) return { error: { message: "账号不存在" } };
  if (found.password !== input.password)
    return { error: { message: "密码错误" } };

  const pub = toPublic(found);
  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(pub));
    notify();
  }
  return { user: pub };
}

export function signOut() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
  notify();
}

// 订阅机制，跨组件同步登录态
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
