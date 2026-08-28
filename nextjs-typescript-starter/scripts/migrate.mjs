// 数据库迁移脚本：按 drizzle/ 目录中的 SQL 顺序执行未应用的迁移
// 用法：npm run db:migrate
import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// 手动加载 .env（脚本运行在 Next.js 之外）
try {
  const envFile = readFileSync('.env', 'utf8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  // .env 不存在时依赖外部环境变量
}

if (!process.env.POSTGRES_URL) {
  console.error('缺少 POSTGRES_URL 环境变量');
  process.exit(1);
}

const client = postgres(`${process.env.POSTGRES_URL}?sslmode=require`, {
  max: 1,
});
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('迁移执行完成');
} finally {
  await client.end();
}
