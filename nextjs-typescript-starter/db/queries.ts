// 只读查询层（design.md 3.2）：供 Server Component 直接调用
// books / words 是准静态数据，用 unstable_cache 缓存，避免每次导航都跨洋查询 Supabase
// （数据变更后最多 5 分钟自动过期；后台改书/词属于极低频操作，可接受）
import { asc, and, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { db } from './index';
import { books, words, type Book, type Word } from './schema';

/** 全部单词书，按创建时间正序（缓存 5 分钟） */
export const getBooks = unstable_cache(
  async (): Promise<Book[]> =>
    db.select().from(books).orderBy(asc(books.createdAt)),
  ['books-list'],
  { revalidate: 300 }
);

/** 按 bookId 查询单本书（缓存 5 分钟） */
export const getBookByBookId = (bookId: string) =>
  unstable_cache(
    async (): Promise<Book | null> => {
      const rows = await db
        .select()
        .from(books)
        .where(eq(books.bookId, bookId))
        .limit(1);
      return rows[0] ?? null;
    },
    [`book-${bookId}`],
    { revalidate: 300 }
  )();

/** 查询某本书的全部单词，按 wordRank 正序（缓存 5 分钟） */
export const getWordsByBookId = (bookId: string) =>
  unstable_cache(
    async (): Promise<Word[]> =>
      db
        .select()
        .from(words)
        .where(and(eq(words.bookId, bookId)))
        .orderBy(asc(words.wordRank)),
    [`words-${bookId}`],
    { revalidate: 300 }
  )();

/** 按 bookId + wordRank 查询单个单词，详情页（缓存 5 分钟） */
export const getWordByRank = (bookId: string, rank: number) =>
  unstable_cache(
    async (): Promise<Word | null> => {
      const rows = await db
        .select()
        .from(words)
        .where(and(eq(words.bookId, bookId), eq(words.wordRank, rank)))
        .limit(1);
      return rows[0] ?? null;
    },
    [`word-${bookId}-${rank}`],
    { revalidate: 300 }
  )();
