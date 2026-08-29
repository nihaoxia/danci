// 个人资料接口：GET 读取 / PUT 更新（昵称、签名、头像）
// 身份从 session 取，不信任客户端传参；头像为前端压缩后的 data URL（≤100KB）
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from 'app/auth';
import { db } from '@/db';
import { User } from '@/db/schema';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const [row] = await db
    .select({
      nickname: User.nickname,
      signature: User.signature,
      avatar: User.avatar,
    })
    .from(User)
    .where(eq(User.email, session.user.email))
    .limit(1);

  return NextResponse.json({ profile: row ?? {} });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { nickname, signature, avatar } = body as {
    nickname?: unknown;
    signature?: unknown;
    avatar?: unknown;
  };

  // 校验：昵称 ≤20 字、签名 ≤60 字；头像必须是 data:image 且 ≤100KB
  if (nickname !== undefined && nickname !== null) {
    if (typeof nickname !== 'string' || nickname.length > 20) {
      return NextResponse.json({ error: '昵称不能超过 20 字' }, { status: 400 });
    }
  }
  if (signature !== undefined && signature !== null) {
    if (typeof signature !== 'string' || signature.length > 60) {
      return NextResponse.json({ error: '签名不能超过 60 字' }, { status: 400 });
    }
  }
  if (avatar !== undefined && avatar !== null && avatar !== '') {
    if (
      typeof avatar !== 'string' ||
      !avatar.startsWith('data:image/') ||
      avatar.length > 100 * 1024
    ) {
      return NextResponse.json({ error: '头像格式或大小不符' }, { status: 400 });
    }
  }

  await db
    .update(User)
    .set({
      ...(nickname !== undefined ? { nickname: (nickname as string) || null } : {}),
      ...(signature !== undefined ? { signature: (signature as string) || null } : {}),
      ...(avatar !== undefined ? { avatar: (avatar as string) || null } : {}),
    })
    .where(eq(User.email, session.user.email));

  return NextResponse.json({ ok: true });
}
