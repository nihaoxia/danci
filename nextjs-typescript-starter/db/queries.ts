// 只读查询层（design.md 3.2）：供 Server Component 直接调用
import { asc, and, eq } from 'drizzle-orm';

import { db } from './index';
import { books, words, type Book, type Word } from './schema';

/** 全部单词书，按创建时间正序 */
export async function getBooks(): Promise<Book[]> {
  return db.select().from(books).orderBy(asc(books.createdAt));
}

/** 按 bookId 查询单本书 */
export async function getBookByBookId(bookId: string): Promise<Book | null> {
  const rows = await db.select().from(books).where(eq(books.bookId, bookId)).limit(1);
  return rows[0] ?? null;
}

/** 查询某本书的全部单词，按 wordRank 正序 */
export async function getWordsByBookId(bookId: string): Promise<Word[]> {
  return db
    .select()
    .from(words)
    .where(and(eq(words.bookId, bookId)))
    .orderBy(asc(words.wordRank));
}

/** 按 bookId + wordRank 查询单个单词（详情页） */
export async function getWordByRank(
  bookId: string,
  rank: number
): Promise<Word | null> {
  const rows = await db
    .select()
    .from(words)
    .where(and(eq(words.bookId, bookId), eq(words.wordRank, rank)))
    .limit(1);
  return rows[0] ?? null;
}
