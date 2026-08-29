'use client';

// 单词学习卡片：一次一卡，上一个/下一个切换（顶部进度条联动），整卡可点进详情，单词列表可跳转
import Link from 'next/link';
import { useState } from 'react';
import { AudioButton } from '@/app/components/audio-button';
import { useAuth } from '@/app/components/auth-provider';
import { ProgressBar } from '@/app/components/progress-bar';

export interface CardWord {
  rank: number;
  headWord: string;
  phone: string; // usphone ?? ukphone
  pos: string; // 词性（extractTrans 推断）
  tranCn: string; // trans[0].tranCn
  example?: { en: string; cn: string }; // sentences[0]
}

interface WordCardProps {
  bookId: string;
  words: CardWord[];
  initialIndex: number; // 起始下标；>= words.length 表示已学完
}

export function WordCard({ bookId, words, initialIndex }: WordCardProps) {
  const { saveProgress } = useAuth();
  const [index, setIndex] = useState(initialIndex);
  const [showList, setShowList] = useState(false);

  const completed = index >= words.length;
  const current = completed ? words[words.length - 1] : words[index];
  const isLast = index === words.length - 1;

  // 已学完本书
  if (completed) {
    return (
      <div>
        <ProgressBar value={words.length} total={words.length} className="mb-2" />
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-12 w-12 text-[var(--primary)]"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-lg font-semibold text-gray-900">已学完本书</p>
            <p className="mt-1 text-sm text-gray-500">可以从头复习巩固一下</p>
          </div>
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="h-10 w-full rounded-md bg-[var(--primary)] text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            从头复习
          </button>
          <button
            type="button"
            onClick={() => setShowList(true)}
            className="h-10 w-full rounded-md border border-gray-200 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            查看单词列表
          </button>
          {showList && (
            <WordListPanel
              words={words}
              activeIndex={null}
              onPick={(i) => {
                setIndex(i);
                setShowList(false);
              }}
              onClose={() => setShowList(false)}
            />
          )}
        </div>
      </div>
    );
  }

  function handlePrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    // 保存刚学完的这个词的进度（fire-and-forget，只前进不后退）
    saveProgress(bookId, words[index].rank);
    setIndex((i) => i + 1);
  }

  return (
    // 固定视口高度的纵向布局：进度条/按钮钉死两端，卡片占满剩余空间，
    // 单词内容再长也只在卡片内部滚动，上一个/下一个位置不变。
    // 高度多留 4rem，让按钮悬在 TabBar 上方一截，无需滚动即可见
    <div className="flex h-[calc(100dvh-9rem)] flex-col">
      <div className="mb-2 flex shrink-0 items-center gap-3">
        {/* 学习进度条：上一个/下一个切换实时联动 */}
        <ProgressBar value={index + 1} total={words.length} className="flex-1" />
        <span className="shrink-0 text-xs text-gray-500">
          {index + 1} / {words.length}
        </span>
        <button
          type="button"
          onClick={() => setShowList((s) => !s)}
          className="shrink-0 text-xs font-medium text-[var(--primary-text)]"
        >
          {showList ? '收起列表' : '查看所有单词'}
        </button>
      </div>

      {showList ? (
        <WordListPanel
          words={words}
          activeIndex={index}
          onPick={(i) => {
            setIndex(i);
            setShowList(false);
          }}
          onClose={() => setShowList(false)}
        />
      ) : (
        <>
          {/* 整卡可点进详情；发音按钮内部已阻止冒泡；内容溢出时卡片内部滚动 */}
          <Link
            href={`/word/${bookId}/${current.rank}`}
            className="block min-h-0 flex-1 select-none touch-manipulation overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-colors hover:border-[var(--border-strong)]"
          >
            <div className="flex flex-col items-center py-4 text-center">
              <span className="text-3xl font-semibold text-gray-900">
                {current.headWord}
              </span>
              {/* 发音直接放在卡片上：播放用单词本身拼接有道语音，不依赖音标字段，所有单词都可发音 */}
              <div className="mt-2 flex gap-2">
                <AudioButton word={current.headWord} type={1} label="英" />
                <AudioButton word={current.headWord} type={2} label="美" />
              </div>
              {current.phone && (
                <p className="mt-2 text-sm text-gray-500">/{current.phone}/</p>
              )}
              {(current.tranCn || current.pos) && (
                <p className="mt-2 text-base text-gray-800">
                  {current.pos && <span className="mr-2 text-gray-500">{current.pos}</span>}
                  {current.tranCn}
                </p>
              )}

              {current.example && (
                <div className="mt-6 w-full rounded-xl bg-[var(--card-soft)] p-4 text-left">
                  <p className="text-sm leading-relaxed text-gray-800">
                    {current.example.en}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                    {current.example.cn}
                  </p>
                </div>
              )}

              <p className="mt-6 text-xs text-gray-400">点击卡片查看详情</p>
            </div>
          </Link>

          {/* 按钮固定在底部：不随卡片内容长度移动 */}
          <div className="mt-4 flex shrink-0 select-none gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={index === 0}
              className="h-11 flex-1 touch-manipulation rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一个
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="h-11 flex-1 touch-manipulation rounded-md bg-[var(--primary)] text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              {isLast ? '完成' : '下一个'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 单词列表面板：点击任意单词跳转到对应卡片
function WordListPanel({
  words,
  activeIndex,
  onPick,
  onClose,
}: {
  words: CardWord[];
  activeIndex: number | null;
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          全部单词（{words.length}）
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
          aria-label="收起"
        >
          收起
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <ul className="grid grid-cols-2 gap-2">
          {words.map((w, i) => (
            <li key={w.rank}>
              <button
                type="button"
                onClick={() => onPick(i)}
                className={`w-full rounded-lg border p-2.5 text-left transition-colors ${i === activeIndex
                  ? 'border-[var(--border-strong)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--card-soft)]'
                  }`}
              >
                <span className="block truncate text-sm font-medium text-gray-900">
                  {w.headWord}
                </span>
                {w.tranCn && (
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {w.tranCn}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
