// 单词详情页：按 bookId + wordRank 查询单词，完整渲染 content 各模块（模块为空时隐藏）
// words 为准静态数据，ISR 缓存页面（60s）
import Link from 'next/link';
import { AudioButton } from '@/app/components/audio-button';
import { ExpandableList } from '@/app/components/expandable-list';
import { getBookByBookId, getWordByRank } from '@/db/queries';
import { parseWordContent } from '@/db/word-content';

export const revalidate = 60;

export default async function WordPage({
  params,
}: {
  params: { bookId: string; rank: string };
}) {
  const rank = Number(params.rank);
  const book = await getBookByBookId(params.bookId);
  const word = Number.isFinite(rank)
    ? await getWordByRank(params.bookId, rank)
    : null;

  if (!book || !word) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 pt-20 text-center">
        <p className="text-sm text-gray-500">单词不存在</p>
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          返回首页
        </Link>
      </div>
    );
  }

  const content = parseWordContent(word.content)?.word.content;
  const headWord = word.headWord ?? '';
  const ukphone = content?.ukphone;
  const usphone = content?.usphone;
  const trans = content?.trans ?? [];
  const sentences = content?.sentence?.sentences ?? [];
  const phrases = content?.phrase?.phrases ?? [];
  const synos = content?.syno?.synos ?? [];
  const rels = content?.relWord?.rels ?? [];

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/study/${book.bookId}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="返回"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
          {headWord}
        </h1>
      </div>

      {/* 单词 + 音标 + 发音 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">{headWord}</h2>
          <div className="flex gap-2">
            {ukphone && <AudioButton word={headWord} type={1} label="英" />}
            {usphone && <AudioButton word={headWord} type={2} label="美" />}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
          {ukphone && <span>英 /{ukphone}/</span>}
          {usphone && <span>美 /{usphone}/</span>}
        </div>
      </div>

      {/* 释义 */}
      {trans.length > 0 && (
        <Section title="释义">
          <ul className="space-y-2">
            {trans.map((t, i) => (
              <li key={i}>
                <p className="text-sm text-gray-900">
                  {t.descCn && <span className="mr-2 text-gray-500">{t.descCn}</span>}
                  {t.tranCn}
                </p>
                {t.tranOther && (
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">英释: {t.tranOther}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 例句 */}
      {sentences.length > 0 && (
        <Section title="例句">
          <ul className="space-y-2.5">
            {sentences.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                <div>
                  <p className="text-sm leading-relaxed text-gray-900">{s.sContent}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{s.sCn}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 短语：默认展示前 6 条，可展开 */}
      {phrases.length > 0 && (
        <Section title="短语">
          <ExpandableList
            items={phrases.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                <div>
                  <p className="text-sm text-gray-900">{p.pContent}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{p.pCn}</p>
                </div>
              </li>
            ))}
          />
        </Section>
      )}

      {/* 同近义词：按词性分组 */}
      {synos.length > 0 && (
        <Section title="同近义词">
          <ul className="space-y-2.5">
            {synos.map((s, i) => (
              <li key={i}>
                <p className="text-sm text-gray-900">
                  <span className="mr-2 text-gray-500">{s.pos}</span>
                  {s.tran}
                </p>
                {s.hwds && s.hwds.length > 0 && (
                  <p className="mt-1 text-sm text-indigo-600">
                    {s.hwds.map((h) => h.w).join(' / ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 同根词：按词性分组 */}
      {rels.length > 0 && (
        <Section title="同根词">
          <ul className="space-y-2">
            {rels.map((r, i) =>
              (r.words ?? []).map((w, j) => (
                <li key={`${i}-${j}`} className="flex gap-3 text-sm">
                  <span className="w-9 shrink-0 text-gray-500">{r.pos}</span>
                  <span className="font-medium text-gray-900">{w.hwd}</span>
                  <span className="text-gray-500">{w.tran}</span>
                </li>
              ))
            )}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}
