"use server";

import { redirect } from "next/navigation";

import {
  anyAdminExists,
  createSession,
  findAdminByEmail,
  getSessionUser,
  hashPassword,
  signOut,
  verifyPassword,
} from "@/lib/session";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AuthState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  // 已有管理员则禁止二次注册
  if (await anyAdminExists()) redirect("/signin");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name) return { error: "请输入姓名" };
  if (!EMAIL_RE.test(email)) return { error: "邮箱格式不正确" };
  if (password.length < 6) return { error: "密码至少 6 位" };
  if (password !== confirm) return { error: "两次输入的密码不一致" };

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (existing.length > 0) return { error: "该邮箱已被注册" };

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(adminUsers)
    .values({
      name,
      email,
      passwordHash,
      role: "super", // 首个注册者即系统管理员
    })
    .returning({ id: adminUsers.id });

  if (!created) return { error: "注册失败，请重试" };

  await createSession(created.id);
  redirect("/books");
}

export async function signinAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const current = await getSessionUser();
  if (current) redirect("/books");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "请输入正确的邮箱" };
  if (!password) return { error: "请输入密码" };

  const user = await findAdminByEmail(email);
  if (!user) return { error: "账号不存在" };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "密码错误" };

  await createSession(user.id);
  redirect("/books");
}

export async function signoutAction(): Promise<void> {
  await signOut();
  redirect("/signin");
}
