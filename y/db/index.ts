import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 环境变量未设置，请在 .env 中配置 Supabase 连接串");
}

// 开发环境复用连接，避免 HMR 反复建立连接池耗尽 Supabase 连接数
const globalForDb = globalThis as unknown as {
  dbClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.dbClient ??
  postgres(databaseUrl, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbClient = client;
}

export const db = drizzle({ client, schema });
