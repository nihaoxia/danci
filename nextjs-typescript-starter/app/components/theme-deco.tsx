'use client';

// 页面右上角主题装饰：跟随主题切换的淡色 SVG（叶子/樱花/太阳/月星/星点/珍珠/波浪）
import { useTheme } from '@/app/components/theme-provider';

export function ThemeDeco() {
  const { theme } = useTheme();

  return (
    <div className="pointer-events-none fixed right-2 top-0 z-0 select-none" aria-hidden="true">
      <svg viewBox="0 0 140 140" className="h-32 w-32 opacity-70" fill="none">
        {theme === 'green' && (
          <g stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
            <path d="M96 44 Q120 24 128 30 Q126 52 100 52 Q94 50 96 44Z" fill="#bbf7d0" stroke="#4ade80" />
            <path d="M96 44 Q104 46 112 50" />
            <path d="M64 84 Q78 66 96 68 Q94 92 72 94 Q62 92 64 84Z" fill="#86efac" stroke="#22c55e" />
            <path d="M64 84 Q78 84 92 78" />
          </g>
        )}
        {theme === 'pink' && (
          <g>
            <g transform="translate(96 44)">
              {[0, 72, 144, 216, 288].map((r) => (
                <ellipse key={r} cx="0" cy="-13" rx="9" ry="13" fill="#fbcfe8" transform={`rotate(${r})`} />
              ))}
              <circle r="6" fill="#f9a8d4" />
              <circle r="2.5" fill="#f472b6" />
            </g>
            <g transform="translate(58 92) scale(0.7)">
              {[0, 72, 144, 216, 288].map((r) => (
                <ellipse key={r} cx="0" cy="-13" rx="9" ry="13" fill="#fce7f3" transform={`rotate(${r})`} />
              ))}
              <circle r="6" fill="#fbcfe8" />
              <circle r="2.5" fill="#f472b6" />
            </g>
          </g>
        )}
        {theme === 'red' && (
          <g>
            <circle cx="92" cy="56" r="22" fill="#fca5a5" />
            <circle cx="92" cy="56" r="15" fill="#fecaca" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
              <line
                key={r}
                x1="92" y1="18" x2="92" y2="10"
                stroke="#f87171" strokeWidth="3" strokeLinecap="round"
                transform={`rotate(${r} 92 56)`}
              />
            ))}
          </g>
        )}
        {theme === 'purple' && (
          <g>
            <path d="M96 28 A30 30 0 1 0 120 68 A24 24 0 1 1 96 28Z" fill="#d8b4fe" />
            <path d="M44 44 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" fill="#c084fc" />
            <circle cx="58" cy="96" r="4" fill="#e9d5ff" />
            <circle cx="36" cy="72" r="2.5" fill="#d8b4fe" />
          </g>
        )}
        {theme === 'dark' && (
          <g fill="#8fa0ff">
            <path d="M92 40 l3.5 9 9 3.5 -9 3.5 -3.5 9 -3.5 -9 -9 -3.5 9 -3.5Z" />
            <circle cx="120" cy="88" r="4" />
            <circle cx="64" cy="80" r="2.5" />
            <circle cx="44" cy="56" r="2" opacity="0.7" />
            <circle cx="76" cy="112" r="1.8" opacity="0.5" />
          </g>
        )}
        {theme === 'pearl' && (
          <g>
            <circle cx="92" cy="52" r="20" fill="url(#pearl-g)" stroke="#e7ddc9" strokeWidth="2" />
            <circle cx="58" cy="92" r="12" fill="url(#pearl-g)" stroke="#e7ddc9" strokeWidth="2" />
            <circle cx="116" cy="100" r="7" fill="url(#pearl-g)" stroke="#e7ddc9" strokeWidth="1.5" />
            <circle cx="86" cy="45" r="4" fill="#ffffff" opacity="0.9" />
            <circle cx="54" cy="88" r="2.5" fill="#ffffff" opacity="0.9" />
            <defs>
              <radialGradient id="pearl-g" cx="0.35" cy="0.3" r="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f1ebdd" />
                <stop offset="100%" stopColor="#d8cdb4" />
              </radialGradient>
            </defs>
          </g>
        )}
        {theme === 'blue' && (
          <g stroke="#7db1f5" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M28 66 Q38 56 48 66 T68 66" />
            <path d="M48 92 Q58 82 68 92 T88 92" opacity="0.7" />
            <circle cx="104" cy="44" r="9" fill="#dbeafe" />
            <circle cx="120" cy="76" r="5" fill="#dbeafe" opacity="0.8" />
            <circle cx="88" cy="104" r="3.5" fill="#dbeafe" opacity="0.6" />
          </g>
        )}
      </svg>
    </div>
  );
}
