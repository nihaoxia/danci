// 音频预热脚本：把库里所有单词的英美发音通过 /api/audio 预取入库
// 上线新书后跑一次（npm run warmup-audio），此后用户点击发音全部走 DB 缓存
// 失败自动重试 3 轮，仍失败的打印清单退出码 1
import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/POSTGRES_URL="(.*?)"/)[1];
const sql = postgres(`${url}?sslmode=require`, { max: 1, prepare: false });

const BASE = 'http://localhost:3000/api/audio';
const CONCURRENCY = 4;

async function fetchOne(word, type) {
  try {
    const res = await fetch(`${BASE}?word=${encodeURIComponent(word)}&type=${type}`);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0;
  } catch {
    return false;
  }
}

const words = (await sql`
  select distinct "headWord" from public.words
  where "headWord" is not null and "headWord" <> ''
  order by "headWord"`);
console.log(`待预热单词 ${words.length} 个，每词英美 2 条音频`);

for (let round = 1; round <= 3; round++) {
  const pending = [];
  for (const { headWord: word } of words) {
    for (const type of [1, 2]) {
      pending.push({ word, type });
    }
  }
  let fail = [];
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(({ word, type }) => fetchOne(word, type).then((ok) => ({ word, type, ok })))
    );
    fail.push(...results.filter((r) => !r.ok));
    process.stdout.write(`\r轮次 ${round}: ${Math.min(i + CONCURRENCY, pending.length)}/${pending.length}`);
  }
  console.log('');
  if (fail.length === 0) {
    console.log('全部预热完成');
    await sql.end();
    process.exit(0);
  }
  console.log(`失败 ${fail.length} 条:`, fail.map((f) => `${f.word}#${f.type}`).join(', '));
}

console.error('预热 3 轮后仍有失败');
await sql.end();
process.exit(1);
