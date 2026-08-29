// 发音引擎（客户端单例）：
// - 音频字节经 /api/audio 代理（服务端 DB 缓存）+ 浏览器 immutable 磁盘缓存
// - 播放走 Web Audio API：点击时音频已下载并解码进内存，点击路径上只剩 source.start()
// - 引擎初始化/解锁时机（消除"第一个词总是延迟"的三个来源）：
//   1) AudioContext 随全站初始化创建（initAudioEngine，AuthProvider 挂载时调用），
//      而不是首次点击发音时才创建（音频子系统冷启动 100~300ms）
//   2) 解锁监听全站注册：用户的任意第一次点击即 resume 音频子系统，不需要等到点发音
//   3) 预取拿到音频字节后立即异步解码缓存（decodeAudioData 不要求 ctx running），
//      解码开销也从点击路径移除
let ctx: AudioContext | null = null;
let unlockBound = false;

// 原始字节缓存（预取阶段填充）
const dataCache = new Map<string, Promise<ArrayBuffer>>();
// 解码后的 PCM 缓存（预取/首次播放时填充）
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

// iOS/Chrome 要求音频子系统在用户手势内启动：任意第一次点击即解锁。
// 注册时机由 initAudioEngine 控制（全站挂载时），而不是首次预取时。
function ensureUnlock() {
  if (unlockBound || typeof document === 'undefined') return;
  unlockBound = true;
  document.addEventListener(
    'pointerdown',
    () => {
      getCtx()?.resume().catch(() => { });
    },
    { once: true, capture: true }
  );
}

/** 全站初始化：创建 AudioContext + 注册首次点击解锁。应用挂载时调用一次 */
export function initAudioEngine() {
  if (typeof window === 'undefined') return;
  getCtx();
  ensureUnlock();
}

/** 异步预热解码：拿到字节后立即解码进缓存，失败静默（播放时还有降级路径） */
function warmDecode(key: string, dataPromise: Promise<ArrayBuffer>) {
  void dataPromise
    .then((data) => {
      const audioCtx = getCtx();
      if (!audioCtx || decodedCache.has(key)) return;
      return audioCtx.decodeAudioData(data.slice(0)).then(
        (buf) => decodedCache.set(key, buf),
        () => { }
      );
    })
    .catch(() => { });
}

/** 拉取音频字节（预取时只到这一步，随后自动预热解码） */
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
    warmDecode(key, p);
  }
  return p;
}

/** 播放单词发音；Web Audio 失败时自动降级为 <audio> 元素播放 */
export async function playWord(word: string, type: 1 | 2): Promise<void> {
  ensureUnlock();
  const audioCtx = getCtx();
  if (!audioCtx) return; // 浏览器不支持 Web Audio 时静默放弃

  const key = cacheKey(word, type);

  try {
    await audioCtx.resume().catch(() => { });

    let decoded = decodedCache.get(key);
    if (!decoded) {
      // 正常情况下预取阶段已解码完成，这里只是兜底
      const data = await prefetchWord(word, type);
      decoded = await audioCtx.decodeAudioData(data.slice(0)); // slice 防止原始 buffer 被 detach
      decodedCache.set(key, decoded);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(audioCtx.destination);
    source.start();
  } catch {
    // 降级路径：Web Audio 解码失败（如拿到损坏/未知编码数据）时，
    // 用 DOM audio 播放同一 URL —— 它的解码容错能力更强
    const audio = new Audio(`/api/audio?word=${encodeURIComponent(word)}&type=${type}`);
    audio.play().catch(() => { }); // 全部失败则保持安静，不抛错崩页
  }
}
