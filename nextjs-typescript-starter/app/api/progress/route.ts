// 学习进度 API（真实数据库）
// GET  /api/progress?email=xxx  → 该用户的全部书级进度（联 books，按 updatedAt 倒序）
// POST /api/progress            → { email, bookId, wordRank } 词级幂等插入 + 书级 greatest 前进
import { NextResponse } from 'next/server';
import { count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/index';
import {
  books,
  userBookProgress,
  userWordProgress,
} from '@/db/schema';
import type { BookProgress } from '@/lib/progress';

/** 查询用户全部进度（书级 + 已学词数），按 updatedAt 倒序 */
async function getProgressList(email: string): Promise<BookProgress[]> {
  const [bookRows, countRows] = await Promise.all([
    db
      .select({
        bookId: userBookProgress.bookId,
        title: books.title,
        wordCount: books.wordCount,
        lastWordRank: userBookProgress.lastWordRank,
        updatedAt: userBookProgress.updatedAt,
      })
      .from(userBookProgress)
      .innerJoin(books, eq(books.bookId, userBookProgress.bookId))
      .where(eq(userBookProgress.userEmail, email))
      .orderBy(desc(userBookProgress.updatedAt)),
    db
      .select({ bookId: userWordProgress.bookId, learned: count() })
      .from(userWordProgress)
      .where(eq(userWordProgress.userEmail, email))
      .groupBy(userWordProgress.bookId),
  ]);

  const learnedMap = new Map(countRows.map((r) => [r.bookId, Number(r.learned)]));
  return bookRows.map((row) => ({
    bookId: row.bookId,
    title: row.title,
    wordCount: row.wordCount,
    lastWordRank: row.lastWordRank,
    learnedCount: learnedMap.get(row.bookId) ?? 0,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 });
  }
  try {
    return NextResponse.json(await getProgressList(email));
  } catch (err) {
    console.error('[api/progress] GET failed:', err);
    return NextResponse.json({ error: '查询进度失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { email?: string; bookId?: string; wordRank?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const { bookId } = body;
  const { wordRank } = body;
  if (
    !email ||
    !bookId ||
    typeof wordRank !== 'number' ||
    !Number.isInteger(wordRank) ||
    wordRank < 1
  ) {
    return NextResponse.json(
      { error: '参数不合法：需要 email / bookId / 正整数 wordRank' },
      { status: 400 }
    );
  }

  try {
    await db.transaction(async (tx) => {
      // 词级记录：幂等插入（重复学同一词不产生重复行）
      await tx
        .insert(userWordProgress)
        .values({ userEmail: email, bookId, wordRank })
        .onConflictDoNothing();

      // 书级进度：不存在则插入，存在则 greatest 只前进不后退，并刷新 updated_at
      await tx
        .insert(userBookProgress)
        .values({ userEmail: email, bookId, lastWordRank: wordRank })
        .onConflictDoUpdate({
          target: [userBookProgress.userEmail, userBookProgress.bookId],
          set: {
            lastWordRank: sql`greatest(${userBookProgress.lastWordRank}, ${wordRank})`,
            updatedAt: sql`now()`,
          },
        });
    });

    // 返回服务端最新进度，客户端直接以此为准
    return NextResponse.json(await getProgressList(email));
  } catch (err) {
    console.error('[api/progress] POST failed:', err);
    // 外键违规（bookId 不存在）等数据库错误
    return NextResponse.json({ error: '保存进度失败' }, { status: 400 });
  }
}
