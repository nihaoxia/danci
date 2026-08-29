'use server';

// 认证 Server Actions：登录 / 注册 / 退出（复用 starter 的 app/auth.ts 与 app/db.ts）
// 表单提交走 useTransition 直接调用（React 18 无 useActionState），返回 { error? }
// 登录/注册成功时 signIn 会 throw NEXT_REDIRECT 完成导航（redirectTo = 当前页面路径）
import { AuthError } from 'next-auth';
import { eq } from 'drizzle-orm';
import { signIn, signOut } from 'app/auth';
import { createUser, getUser } from 'app/db';
import { db } from '@/db';
import { User } from '@/db/schema';

export interface AuthActionState {
  error?: string;
}

/** 登录：校验邮箱密码（bcrypt），成功后设置 session cookie 并重定向回当前页 */
export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/');

  if (!email || !password) {
    return { error: '请输入邮箱和密码' };
  }

  try {
    await signIn('credentials', { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: '邮箱或密码错误' };
    }
    throw err; // NEXT_REDIRECT 等：交给 Next 处理
  }
  return {};
}

/** 注册：邮箱查重 → bcrypt 加密入库（含昵称/头像）→ 自动登录 */
export async function registerAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/');
  const nickname = String(formData.get('nickname') ?? '').trim();
  const avatar = String(formData.get('avatar') ?? '');

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: '请输入合法的邮箱地址' };
  }
  if (password.length < 6) {
    return { error: '密码至少需要 6 位' };
  }
  if (nickname.length > 20) {
    return { error: '昵称不能超过 20 字' };
  }
  if (avatar && (!avatar.startsWith('data:image/') || avatar.length > 100 * 1024)) {
    return { error: '头像格式或大小不符' };
  }

  try {
    const existing = await getUser(email);
    if (existing.length > 0) {
      return { error: '该邮箱已注册，请直接登录' };
    }
    await createUser(email, password);
    // 注册时一并保存昵称/头像，登录后各页面即可直接使用
    if (nickname || avatar) {
      await db
        .update(User)
        .set({
          ...(nickname ? { nickname } : {}),
          ...(avatar ? { avatar } : {}),
        })
        .where(eq(User.email, email));
    }
    await signIn('credentials', { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: '注册失败，请稍后重试' };
    }
    throw err;
  }
  return {};
}

/** 退出登录：清除 session cookie 并回到首页 */
export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
