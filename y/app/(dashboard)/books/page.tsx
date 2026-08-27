import { count, desc } from "drizzle-orm";

import {
  BooksManager,
  type BookPublic,
  type AvailableBookId,
} from "@/components/books/books-manager";
import { db } from "@/db";
import { books, words } from "@/db/schema";

export default async function BooksPage() {
  const rows = await db.select().from(books).orderBy(desc(books.createdAt));

  // words 表按 bookId 聚合，用于：① 计算每本书实际关联单词数 ② 录入时点选真实 bookId
  const wordCounts = await db
    .select({ bookId: words.bookId, n: count() })
    .from(words)
    .groupBy(words.bookId);

  const countByBookId = new Map<string, number>();
  const availableBookIds: AvailableBookId[] = [];
  for (const r of wordCounts) {
    if (!r.bookId) continue;
    const n = Number(r.n);
    countByBookId.set(r.bookId, n);
    availableBookIds.push({ bookId: r.bookId, count: n });
  }

  const initialBooks: BookPublic[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    wordCount: r.wordCount,
    actualCount: countByBookId.get(r.bookId) ?? 0,
    coverUrl: r.coverUrl ?? "",
    bookId: r.bookId,
    tags: r.tags ?? [],
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <BooksManager
      initialBooks={initialBooks}
      availableBookIds={availableBookIds}
    />
  );
}
