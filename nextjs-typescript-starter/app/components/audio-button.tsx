'use client';

// 发音按钮：拼接有道语音 URL 播放
// type=1 英式 / type=2 美式（mock 数据中 ukspeech/usspeech 已含 type 参数）
// 性能：按钮渲染时即通过隐藏 <audio preload="auto"> 预加载音频，
// 点击时直接 play()，避免点击后才发起网络请求导致的明显延迟
import { useRef } from 'react';

export function AudioButton({
  word,
  type,
  label,
}: {
  word: string;
  type: 1 | 2;
  label: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;

  function play() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // 自动播放失败时静默
    });
  }

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" className="hidden" />
      <button
        type="button"
        onClick={play}
        className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
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
    </>
  );
}
