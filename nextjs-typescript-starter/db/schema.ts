import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import {
  bigserial,
  customType,
  index,
  integer,
  json,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

// bytea 自定义类型（音频二进制）
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea';
  },
});

// 认证用户表（与 app/db.ts 中 ensureTableExists 的建表逻辑保持一致）
export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 64 }),
  password: varchar('password', { length: 64 }),
});

export type User = typeof users.$inferSelect;

// 单词书表（已存在于 Supabase，列名为 snake_case）
export const books = pgTable('books', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  title: text('title').notNull(),
  wordCount: integer('word_count').notNull().default(0),
  coverUrl: text('cover_url'),
  bookId: text('book_id').notNull().unique(),
  tags: text('tags')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Book = typeof books.$inferSelect;

// 单词表（已存在于 Supabase，列名为 camelCase）
export const words = pgTable('words', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  wordRank: integer('wordRank'),
  headWord: text('headWord'),
  content: json('content'),
  bookId: text('bookId'),
});

export type Word = typeof words.$inferSelect;

// 学习进度表（新增）：每用户每本书一条进度，(userEmail, bookId) 唯一
export const studyProgress = pgTable(
  'study_progress',
  {
    id: serial('id').primaryKey(),
    userEmail: varchar('userEmail', { length: 64 }).notNull(),
    bookId: text('bookId').notNull(),
    lastWordRank: integer('lastWordRank'),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userEmailBookIdUniq: unique('study_progress_user_email_book_id_unique').on(
      table.userEmail,
      table.bookId
    ),
    updatedAtIdx: index('study_progress_updated_at_idx').on(table.updatedAt),
  })
);

export type StudyProgress = typeof studyProgress.$inferSelect;

// ---------- 学习进度（真实进度表，2026-08-28 新增） ----------

// 书级进度：每用户每本书一条，last_word_rank 表示继续学习的位置（只前进不后退）
// 注：id 实际是 bigint identity 列；工程 drizzle-orm@0.29 无 identity API，
// 用 bigserial 标注使 insert 时可省略 id（由 DB identity 默认值生成）
export const userBookProgress = pgTable(
  'user_book_progress',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userEmail: varchar('user_email', { length: 64 }).notNull(),
    bookId: text('book_id').notNull(),
    lastWordRank: integer('last_word_rank').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    emailBookUniq: unique('user_book_progress_email_book_unique').on(
      table.userEmail,
      table.bookId
    ),
    emailUpdatedIdx: index('user_book_progress_email_idx').on(
      table.userEmail,
      table.updatedAt
    ),
  })
);

export type UserBookProgress = typeof userBookProgress.$inferSelect;

// 词级学习记录：每个学过的单词一条（幂等），已学词数 = count(*)
export const userWordProgress = pgTable(
  'user_word_progress',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userEmail: varchar('user_email', { length: 64 }).notNull(),
    bookId: text('book_id').notNull(),
    wordRank: integer('word_rank').notNull(),
    learnedAt: timestamp('learned_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    emailBookWordUniq: unique('user_word_progress_email_book_word_unique').on(
      table.userEmail,
      table.bookId,
      table.wordRank
    ),
    emailBookIdx: index('user_word_progress_email_idx').on(
      table.userEmail,
      table.bookId
    ),
  })
);

// ---------- 认证用户（NextAuth Credentials，表由 app/db.ts 自动创建） ----------
// 2026-08-28 新增个人资料列：nickname / signature / avatar（data URL，前端压缩后存储）

export const User = pgTable('User', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 64 }),
  password: varchar('password', { length: 64 }),
  nickname: varchar('nickname', { length: 32 }),
  signature: varchar('signature', { length: 60 }),
  avatar: text('avatar'),
});

export type UserProfileRow = typeof User.$inferSelect;

export type UserWordProgress = typeof userWordProgress.$inferSelect;

// ---------- 发音缓存（2026-08-28 新增） ----------

// 发音音频缓存：首次请求时代理取有道并入库，之后全部走 DB（同词跨书复用）
// 以 (word, type) 为键与 bookId/rank 解耦；预计几千词 × 30KB ≈ 百 MB 级，按需增长
export const pronunciationCache = pgTable(
  'pronunciation_cache',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    word: varchar('word', { length: 64 }).notNull(),
    type: smallint('type').notNull(), // 1=英音 2=美音
    contentType: varchar('content_type', { length: 64 })
      .notNull()
      .default('audio/mpeg'),
    data: bytea('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    wordTypeUniq: unique('pronunciation_cache_word_type_unique').on(
      table.word,
      table.type
    ),
  })
);

export type PronunciationCache = typeof pronunciationCache.$inferSelect;
