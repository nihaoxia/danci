import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db";
import { adminSessions, adminUsers, type AdminRole } from "@/db/schema";

export const SESSION_COOKIE = "admin_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

function toPublicUser(u: typeof adminUsers.$inferSelect): SessionUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function anyAdminExists() {
  const rows = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .limit(1);
  return rows.length > 0;
}

export async function findAdminByEmail(email: string) {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

/** 创建会话并写入 httpOnly cookie，返回当前登录用户 */
export async function createSession(userId: string): Promise<SessionUser> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(adminSessions).values({ token, userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);
  if (!rows[0]) throw new Error("会话用户不存在");
  return toPublicUser(rows[0]);
}

/** 读取当前登录用户（未登录或会话过期返回 null） */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
    .limit(1);

  if (!rows[0]) return null;
  const { expiresAt: _expiresAt, ...user } = rows[0];
  return user;
}

/** 注销：删除会话并清除 cookie */
export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** 页面/布局守卫：未登录跳 /signin */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

/** 页面/布局守卫：非系统管理员跳 /books */
export async function requireSuperAdminPage(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "super") redirect("/books");
  return user;
}
