import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
//
// 全局单例（挂在 globalThis 上）：Next dev 热更新会重新执行本模块，
// 普通模块级变量会被重建为新连接池，反复热更新就会把 Supabase session 池（上限 15）占满，
// 导致所有 DB 操作随机报 EMAXCONNSESSION。挂到 globalThis 可跨热更新复用同一实例。
const globalForDb = globalThis as unknown as {
  __authSqlClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__authSqlClient ??
  postgres(`${process.env.POSTGRES_URL!}?sslmode=require`, {
    max: 2,
    prepare: false, // Supabase pooler（PgBouncer）不支持 prepared statements
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__authSqlClient = client;
}

let db = drizzle(client);

export async function getUser(email: string) {
  const users = await ensureTableExists();
  return await db.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  const users = await ensureTableExists();
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  return await db.insert(users).values({ email, password: hash });
}

async function ensureTableExists() {
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "User" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(64),
        password VARCHAR(64)
      );`;
  }

  const table = pgTable('User', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 64 }),
    password: varchar('password', { length: 64 }),
  });

  return table;
}
