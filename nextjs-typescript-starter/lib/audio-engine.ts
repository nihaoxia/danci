// 发音引擎（客户端单例）：
// - 音频字节经 /api/audio 代理（服务端 DB 缓存）+ 浏览器 immutable 磁盘缓存
// - 播放走 Web Audio API：点击时音频已在内存，无 DOM audio 元素与网络开销
// - iOS 手势限制：首次任意 pointerdown 时解锁 AudioContext
let ctx: AudioContext | null = null;
let unlockBound = false;

// 原始字节缓存（预取阶段填充）
const dataCache = new Map<string, Promise<ArrayBuffer>>();
// 解码后的 PCM 缓存（首次播放时填充）
const decodedCache = new Map<string, AudioBuffer>();

function cacheKey(word: string, type: 1 | 2) {
  return `${type}:${word}`;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// iOS 要求音频在用户手势内启动：进入应用后的第一次任意点击即解锁
function ensureUnlock() {
  if (unlockBound || typeof document === 'undefined') return;
  unlockBound = true;
  document.addEventListener(
    'pointerdown',
    () => {
      getCtx()?.resume().catch(() => {});
    },
    { once: true, capture: true }
  );
}

/** 拉取音频字节（预取时只到这一步） */
export function prefetchWord(word: string, type: 1 | 2): Promise<ArrayBuffer> {
  ensureUnlock();
  const key = cacheKey(word, type);
  let p = dataCache.get(key);
  if (!p) {
    p = fetch(`/api/audio?word=${encodeURIComponent(word)}&type=${type}`).then(
      (res) => {
        if (!res.ok) throw new Error(`audio ${res.status}`);
        return res.arrayBuffer();
      }
    );
    p.catch(() => {
      // 失败时移除缓存标记，下次点击可重试
      dataCache.delete(key);
    });
    dataCache.set(key, p);
  }
  return p;
}

/** 播放单词发音 */
export async function playWord(word: string, type: 1 | 2): Promise<void> {
  ensureUnlock();
  const audioCtx = getCtx();
  if (!audioCtx) return; // 浏览器不支持 Web Audio 时静默放弃

  await audioCtx.resume().catch(() => {});
  const key = cacheKey(word, type);

  let decoded = decodedCache.get(key);
  if (!decoded) {
    const data = await prefetchWord(word, type);
    decoded = await audioCtx.decodeAudioData(data.slice(0)); // slice 防止原始 buffer 被 detach
    decodedCache.set(key, decoded);
  }

  const source = audioCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(audioCtx.destination);
  source.start();
}
