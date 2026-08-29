'use client';

// 设置弹层（Radix Dialog，shadcn 同款底层原语）：
// 菜单视图：修改个人资料 / 切换账号 / 退出登录
// 资料编辑视图：头像（本地上传 + canvas 压缩）/ 昵称 / 签名
import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Avatar from '@radix-ui/react-avatar';
import { signOutAction } from '@/app/actions/auth';

export interface Profile {
  nickname?: string | null;
  signature?: string | null;
  avatar?: string | null;
}

export function SettingsEntry({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'edit'>('menu');

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setView('menu'); // 每次打开回到菜单
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          aria-label="设置"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-[var(--card)] p-4 shadow-xl focus:outline-none">
          {view === 'menu' ? (
            <MenuView onEdit={() => setView('edit')} />
          ) : (
            <EditView
              profile={profile}
              onBack={() => setView('menu')}
              onSaved={(p) => {
                onSaved(p);
                setOpen(false);
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MenuView({ onEdit }: { onEdit: () => void }) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Dialog.Title className="text-sm font-semibold text-gray-900">设置</Dialog.Title>
        <Dialog.Close asChild>
          <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Dialog.Close>
      </div>

      <ul className="divide-y divide-gray-100">
        <li>
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center gap-2.5 px-1 py-3 text-left text-sm text-gray-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            修改个人资料
          </button>
        </li>
        <li>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-1 py-3 text-left text-sm text-gray-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              切换账号
            </button>
          </form>
        </li>
        <li>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-1 py-3 text-left text-sm text-red-500"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              退出登录
            </button>
          </form>
        </li>
      </ul>
    </>
  );
}

function EditView({
  profile,
  onBack,
  onSaved,
}: {
  profile: Profile;
  onBack: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [nickname, setNickname] = useState(profile.nickname ?? '');
  const [signature, setSignature] = useState(profile.signature ?? '');
  // null = 未改动；'' = 已移除；dataURL = 新头像
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const shownAvatar = pendingAvatar === null ? profile.avatar ?? undefined : pendingAvatar || undefined;

  // 选择头像：canvas 等比裁剪到 256×256 JPEG（data URL，服务端限 100KB）
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    const dataUrl = await compressImage(file);
    if (dataUrl.length > 100 * 1024) {
      setError('图片过大，请换一张试试');
      return;
    }
    setError('');
    setPendingAvatar(dataUrl);
  }

  async function handleSave() {
    if (nickname.length > 20) {
      setError('昵称不能超过 20 字');
      return;
    }
    if (signature.length > 60) {
      setError('签名不能超过 60 字');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          signature,
          ...(pendingAvatar !== null ? { avatar: pendingAvatar } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '保存失败');
        return;
      }
      onSaved({
        nickname,
        signature,
        avatar: pendingAvatar === null ? profile.avatar : pendingAvatar || null,
      });
    } catch {
      setError('网络异常，请重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600"
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <Dialog.Title className="text-sm font-semibold text-gray-900">修改个人资料</Dialog.Title>
      </div>

      {/* 头像 */}
      <div className="flex flex-col items-center gap-2">
        <Avatar.Root className="h-16 w-16 overflow-hidden rounded-full border border-gray-100 bg-[var(--primary-soft)]">
          {shownAvatar && <Avatar.Image src={shownAvatar} className="h-full w-full object-cover" alt="头像" />}
          <Avatar.Fallback className="flex h-full w-full items-center justify-center text-xl font-semibold text-[var(--primary-text)]">
            {(nickname || 'U').charAt(0).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="font-medium text-[var(--primary-text)]"
          >
            更换头像
          </button>
          {profile.avatar && (
            <button
              type="button"
              onClick={() => setPendingAvatar('')}
              className="text-gray-400"
            >
              移除
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* 昵称 */}
      <label className="mt-5 block text-xs font-medium text-gray-500" htmlFor="pf-nickname">
        昵称（20 字以内）
      </label>
      <input
        id="pf-nickname"
        type="text"
        value={nickname}
        maxLength={20}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="给自己起个名字吧"
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
      />

      {/* 签名 */}
      <label className="mt-3 block text-xs font-medium text-gray-500" htmlFor="pf-signature">
        个性签名（60 字以内）
      </label>
      <textarea
        id="pf-signature"
        value={signature}
        maxLength={60}
        rows={2}
        onChange={(e) => setSignature(e.target.value)}
        placeholder="写一句激励自己的话"
        className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
      />

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 h-10 w-full rounded-md bg-[var(--primary)] text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
      >
        {saving ? '保存中…' : '保存'}
      </button>
    </>
  );
}

/** 压缩头像：等比 cover 裁剪到 256×256 JPEG data URL（注册表单与资料编辑共用） */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas unsupported'));
        return;
      }
      // cover 裁剪：取中间正方形
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}
