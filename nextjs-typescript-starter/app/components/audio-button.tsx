'use client';

// 发音按钮：Web Audio 引擎播放
// - 按钮渲染时即预取音频字节（/api/audio 代理，服务端 DB 缓存 + 浏览器磁盘缓存）
// - 点击时从内存解码/播放，无网络等待，首次点击与其他点击体验一致
// - type=1 英式 / type=2 美式
import { useEffect, useState } from 'react';
import { playWord, prefetchWord } from '@/lib/audio-engine';

export function AudioButton({
  word,
  type,
  label,
}: {
  word: string;
  type: 1 | 2;
  label: string;
}) {
  const [playing, setPlaying] = useState(false);

  // 预取：卡片/详情页渲染时就把当前词的音频拉进内存
  useEffect(() => {
    prefetchWord(word, type).catch(() => { });
  }, [word, type]);

  async function play(e?: React.MouseEvent) {
    // 按钮可能位于整卡链接内部（学习卡片整卡可点进详情）：阻止触发导航
    e?.preventDefault();
    e?.stopPropagation();
    if (playing) return;
    setPlaying(true);
    try {
      await playWord(word, type);
      setTimeout(() => setPlaying(false), 300);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <button
      type="button"
      onClick={play}
      className={`flex touch-manipulation select-none items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${playing
          ? 'animate-pulse border-[var(--border-strong)] bg-[var(--primary)] text-white'
          : 'border-[var(--border-strong)] bg-[var(--primary-soft)] text-[var(--primary-text)] hover:opacity-80'
        }`}
      aria-label={`播放${label}发音`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
        />
      </svg>
      {label}
    </button>
  );
}
