import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// 全局单例（挂在 globalThis 上）：Next dev 热更新会重新执行本模块，
// 普通模块级变量会被重建为新连接池，反复热更新就会把 Supabase session 池（上限 15）占满，
// 导致所有 DB 操作随机报 EMAXCONNSESSION（发音/进度/页面查询随机失败）。
// 挂到 globalThis 可跨热更新复用同一实例。
// max 上限必须收紧：session 池总共只有 15 个连接（auth 池还占 2 个）。
const globalForDb = globalThis as unknown as {
  __appSqlClient?: ReturnType<typeof postgres>;
};

export const client =
  globalForDb.__appSqlClient ??
  postgres(`${process.env.POSTGRES_URL!}?sslmode=require`, {
    max: 3,
    prepare: false, // Supabase pooler（PgBouncer）不支持 prepared statements
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__appSqlClient = client;
}

export const db = drizzle(client);
