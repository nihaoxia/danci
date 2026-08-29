// 发音音频代理：DB 缓存 → miss 时取有道入库 → 返回
// 浏览器配 immutable 强缓存：同一 (word, type) 每个客户端只请求一次，之后走磁盘缓存
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { pronunciationCache } from '@/db/schema';

// 单词/短语的字符白名单（防止拼接任意 URL query）
const WORD_RE = /^[a-zA-Z0-9\s'’\-.]{1,64}$/;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get('word') ?? '';
  const type = request.nextUrl.searchParams.get('type') ?? '';

  if (!WORD_RE.test(word)) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 });
  }
  if (type !== '1' && type !== '2') {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  }
  const typeNum = Number(type);

  // 1. 缓存命中：直接从 DB 返回音频字节
  const [cached] = await db
    .select()
    .from(pronunciationCache)
    .where(
      and(eq(pronunciationCache.word, word), eq(pronunciationCache.type, typeNum))
    )
    .limit(1);

  if (cached) {
    return new NextResponse(new Uint8Array(cached.data), {
      headers: {
        'Content-Type': cached.contentType,
        ...CACHE_HEADERS,
      },
    });
  }

  // 2. 缓存未命中：取有道音频并入库（并发请求下重复插入由唯一约束 + onConflict 兜底）
  const upstream = await fetch(
    `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${typeNum}`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0 (WordLearningH5)' },
      cache: 'no-store',
    }
  );
  if (!upstream.ok) {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 });
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: 'empty audio' }, { status: 502 });
  }
  const contentType = upstream.headers.get('content-type') ?? 'audio/mpeg';

  await db
    .insert(pronunciationCache)
    .values({ word, type: typeNum, contentType, data: buf })
    .onConflictDoNothing();

  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': contentType, ...CACHE_HEADERS },
  });
}
