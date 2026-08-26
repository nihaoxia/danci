"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { adminRole, adminUsers } from "@/db/schema";
import { getSessionUser, hashPassword } from "@/lib/session";

export type AdminActionState = { error?: string; ok?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = adminRole.enumValues as readonly string[];

async function requireSuper() {
  const user = await getSessionUser();
  if (!user) return { error: "未登录" } as const;
  if (user.role !== "super") return { error: "无权限" } as const;
  return user;
}

export async function createAdminAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await requireSuper();
  if ("error" in auth) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "admin");

  if (!name) return { error: "请输入姓名" };
  if (!EMAIL_RE.test(email)) return { error: "邮箱格式不正确" };
  if (password.length < 6) return { error: "密码至少 6 位" };
  if (!ROLES.includes(role)) return { error: "角色不合法" };

  const dup = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (dup.length > 0) return { error: "该邮箱已被注册" };

  const passwordHash = await hashPassword(password);
  await db.insert(adminUsers).values({ name, email, passwordHash, role: role as "super" | "admin" });

  revalidatePath("/admin-users");
  return { ok: true };
}

export async function updateAdminRoleAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await requireSuper();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!id) return { error: "缺少目标用户" };
  if (!ROLES.includes(role)) return { error: "角色不合法" };
  if (id === auth.id) return { error: "不能修改自己的角色" };

  // 不允许把最后一个系统管理员降级
  if (role !== "super") {
    const [superCount] = await db
      .select({ n: count() })
      .from(adminUsers)
      .where(eq(adminUsers.role, "super"));
    const target = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);
    if (target[0]?.role === "super" && Number(superCount?.n ?? 0) <= 1) {
      return { error: "至少保留一位系统管理员" };
    }
  }

  await db
    .update(adminUsers)
    .set({ role: role as "super" | "admin" })
    .where(eq(adminUsers.id, id));

  revalidatePath("/admin-users");
  return { ok: true };
}

export async function deleteAdminAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await requireSuper();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "缺少目标用户" };
  if (id === auth.id) return { error: "不能删除自己" };

  const target = await db
    .select({ role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  if (!target[0]) return { error: "用户不存在" };

  if (target[0].role === "super") {
    const [superCount] = await db
      .select({ n: count() })
      .from(adminUsers)
      .where(eq(adminUsers.role, "super"));
    if (Number(superCount?.n ?? 0) <= 1) {
      return { error: "至少保留一位系统管理员" };
    }
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id));

  revalidatePath("/admin-users");
  return { ok: true };
}
