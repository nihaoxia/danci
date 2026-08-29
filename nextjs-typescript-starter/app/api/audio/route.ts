// 发音音频代理：DB 缓存 → miss 时取有道（带重试/超时/魔数校验）→ 入库 → 返回
// 浏览器配 immutable 强缓存：同一 (word, type) 每个客户端只请求一次，之后走磁盘缓存
// 全程兜底：任何异常都返回 JSON 502，不会 500 崩页
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { pronunciationCache } from '@/db/schema';

// 单词/短语的字符白名单（防止拼接任意 URL query）
const WORD_RE = /^[a-zA-Z0-9\s'’\-.]{1,64}$/;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};

const UA_HEADERS = { 'User-Agent': 'Mozilla/5.0 (WordLearningH5)' };

/** 校验音频魔数：MP3（ID3 / 0xFFFx）或 WAV（RIFF），防止把 HTML 错误页当音频入库 */
function looksLikeAudio(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true; // MPEG sync
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true; // ID3
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true; // RIFF
  return false;
}

/** 取有道音频：超时 8s + 失败自动重试 1 次（直连偶发连接失败/限流） */
async function fetchFromYoudao(word: string, typeNum: number): Promise<Buffer> {
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${typeNum}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: UA_HEADERS,
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (looksLikeAudio(buf)) return buf;
        lastErr = new Error('upstream not audio');
        continue; // 拿到的是错误页而非音频，重试一次
      }
      lastErr = new Error(`upstream ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('upstream failed');
}

export async function GET(request: NextRequest) {
  try {
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
        headers: { 'Content-Type': cached.contentType, ...CACHE_HEADERS },
      });
    }

    // 2. 缓存未命中：取有道并入库（并发下重复插入由唯一约束 + onConflict 兜底）
    try {
      const buf = await fetchFromYoudao(word, typeNum);
      await db
        .insert(pronunciationCache)
        .values({ word, type: typeNum, contentType: 'audio/mpeg', data: buf })
        .onConflictDoNothing();

      return new NextResponse(new Uint8Array(buf), {
        headers: { 'Content-Type': 'audio/mpeg', ...CACHE_HEADERS },
      });
    } catch (err) {
      console.error('[api/audio] upstream failed:', word, type, err);
      return NextResponse.json({ error: 'upstream unavailable' }, { status: 502 });
    }
  } catch (err) {
    // 兜底：DB 异常等任何错误都不返回 500 裸栈
    console.error('[api/audio] unexpected error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 502 });
  }
}
