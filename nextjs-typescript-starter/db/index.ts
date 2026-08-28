import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// 模块级单例：postgres.js 客户端 + drizzle 实例
// 连接串来自 .env 的 POSTGRES_URL（Supabase）
// max 上限必须收紧：Supabase session 池只有 15 个连接，Next dev 热更新会实例化多个本模块，
// 不限流会把连接池占满导致所有查询报 EMAXCONNSESSION
export const client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`, {
  max: 3,
  prepare: false, // Supabase pooler（PgBouncer）不支持 prepared statements
});
export const db = drizzle(client);
