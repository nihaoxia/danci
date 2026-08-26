// 将 PEPXiaoXue3_2.json（多个拼接的 JSON 对象）转为 CSV
// 列：wordRank,headWord,content,bookId，其中 content 整体作为 JSON 字符串保存
// 用法： node scripts/json-to-csv.mjs [输入json路径]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, basename, join, extname } from "node:path";

const inputPath =
  process.argv[2] ||
  "c:\\Users\\34140\\Desktop\\ai-coding\\danci\\y\\temp\\PEPXiaoXue3_2.json";

const raw = readFileSync(inputPath, "utf-8").replace(/^\uFEFF/, "").trim();

// 该文件是多个 JSON 对象直接拼接（}{ 相连），不是数组。
// 边界 }{ 只会出现在顶层对象之间，安全替换成 },{ 后包成数组解析。
const entries = JSON.parse("[" + raw.replace(/}\s*{/g, "},{") + "]");

const csvField = (v) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const header = ["wordRank", "headWord", "content", "bookId"].join(",");
const lines = entries.map((e) =>
  [
    e.wordRank,
    e.headWord,
    JSON.stringify(e.content),
    e.bookId,
  ]
    .map(csvField)
    .join(",")
);

const csv = "\uFEFF" + [header, ...lines].join("\r\n") + "\r\n";

const outPath = join(dirname(inputPath), basename(inputPath, extname(inputPath)) + ".csv");
writeFileSync(outPath, csv, "utf-8");

console.log(`已处理 ${entries.length} 条，输出：${outPath}`);
