"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { books, words } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export type BookActionState = { error?: string; ok?: boolean };

// 单词书管理：登录即可操作（系统/普通管理员均可）
async function requireAuth() {
  const user = await getSessionUser();
  if (!user) return { error: "未登录" } as const;
  return user;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseWordCount(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

export async function createBookAction(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") ?? "").trim();
  const wordCount = parseWordCount(String(formData.get("wordCount") ?? "").trim());
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  const bookId = String(formData.get("bookId") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));

  if (!title) return { error: "请输入标题" };
  if (wordCount === null) return { error: "单词数量需为非负整数" };
  if (!bookId) return { error: "请选择 bookId" };

  await db.insert(books).values({
    title,
    wordCount,
    coverUrl: coverUrl || null,
    bookId,
    tags,
  });

  revalidatePath("/books");
  return { ok: true };
}

export async function updateBookAction(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const wordCount = parseWordCount(String(formData.get("wordCount") ?? "").trim());
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  const bookId = String(formData.get("bookId") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));

  if (!id) return { error: "缺少目标单词书" };
  if (!title) return { error: "请输入标题" };
  if (wordCount === null) return { error: "单词数量需为非负整数" };
  if (!bookId) return { error: "请选择 bookId" };

  await db
    .update(books)
    .set({ title, wordCount, coverUrl: coverUrl || null, bookId, tags })
    .where(eq(books.id, id));

  revalidatePath("/books");
  return { ok: true };
}

export async function deleteBookAction(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "缺少目标单词书" };

  // 查出 bookId，用于删除关联的 words 数据
  const [book] = await db
    .select({ bookId: books.bookId })
    .from(books)
    .where(eq(books.id, id));
  if (!book) return { error: "单词书不存在" };

  // 先删关联的 words（外键 CASCADE 也会处理，这里显式删除更安全）
  await db.delete(words).where(eq(words.bookId, book.bookId));

  // 再删 books 记录
  await db.delete(books).where(eq(books.id, id));

  revalidatePath("/books");
  return { ok: true };
}
