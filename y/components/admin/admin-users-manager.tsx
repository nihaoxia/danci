"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useActionState,
  useState,
} from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import {
  createAdminAction,
  deleteAdminAction,
  updateAdminRoleAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminRole } from "@/db/schema";

export type AdminUserPublic = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RoleField({
  defaultValue = "admin",
  disabled,
}: {
  defaultValue?: AdminRole;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      {(
        [
          { value: "admin", label: "普通管理员" },
          { value: "super", label: "系统管理员" },
        ] as const
      ).map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 text-sm"
        >
          <input
            type="radio"
            name="role"
            value={opt.value}
            defaultChecked={defaultValue === opt.value}
            disabled={disabled}
            className="size-4 accent-foreground"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function CreateAdminForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createAdminAction,
    { error: undefined, ok: undefined }
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-name">姓名</Label>
        <Input id="c-name" name="name" required disabled={pending} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-email">邮箱</Label>
        <Input
          id="c-email"
          name="email"
          type="email"
          required
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-password">初始密码</Label>
        <Input
          id="c-password"
          name="password"
          type="password"
          placeholder="至少 6 位"
          required
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>角色</Label>
        <RoleField disabled={pending} />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          创建
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditRoleForm({
  target,
  onDone,
}: {
  target: AdminUserPublic;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateAdminRoleAction,
    { error: undefined, ok: undefined }
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={target.id} />
      <div className="text-muted-foreground flex flex-col gap-1 text-sm">
        <span>
          姓名：<span className="text-foreground">{target.name}</span>
        </span>
        <span>
          邮箱：<span className="text-foreground">{target.email}</span>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <Label>角色</Label>
        <RoleField defaultValue={target.role} disabled={pending} />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          保存
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteAdminForm({
  target,
  onDone,
}: {
  target: AdminUserPublic;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    deleteAdminAction,
    { error: undefined, ok: undefined }
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={target.id} />
      <p className="text-sm">
        确认删除管理员
        <span className="font-medium"> {target.name} </span>
        （{target.email}）？该操作不可撤销。
      </p>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <DialogFooter>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          确认删除
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdminUsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUserPublic[];
  currentUserId: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserPublic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserPublic | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return initialUsers;
    return initialUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw)
    );
  }, [initialUsers, keyword]);

  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const closeEdit = useCallback(() => setEditTarget(null), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  return (
    <>
      <PageHeader
        title="管理员管理"
        description="系统管理员可新建、编辑与删除管理员账号"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            添加管理员
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="搜索姓名或邮箱"
              className="pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <span className="text-muted-foreground text-sm">
            共 {filtered.length} 位管理员
          </span>
        </div>

        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-10 text-center"
                  >
                    暂无匹配的管理员
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u, idx) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <Badge variant="outline" className="text-[10px]">
                              我
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {u.role === "super" ? (
                          <Badge variant="default">
                            <ShieldCheck />
                            系统管理员
                          </Badge>
                        ) : (
                          <Badge variant="secondary">普通管理员</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="disabled:opacity-40"
                            aria-label="编辑角色"
                            title={isSelf ? "不能修改自己的角色" : "编辑角色"}
                            disabled={isSelf}
                            onClick={() => setEditTarget(u)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive disabled:opacity-40"
                            aria-label="删除"
                            title={isSelf ? "不能删除自己" : "删除"}
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 新建管理员 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加管理员</DialogTitle>
            <DialogDescription>
              为新管理员设置姓名、邮箱、初始密码与角色
            </DialogDescription>
          </DialogHeader>
          <CreateAdminForm onDone={closeCreate} />
        </DialogContent>
      </Dialog>

      {/* 编辑角色 */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && closeEdit()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑管理员角色</DialogTitle>
            <DialogDescription>切换该账号的系统/普通管理员角色</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <EditRoleForm
              key={editTarget.id}
              target={editTarget}
              onDone={closeEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && closeDelete()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除管理员</DialogTitle>
            <DialogDescription>此操作将清除其登录会话且不可撤销</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <DeleteAdminForm
              key={deleteTarget.id}
              target={deleteTarget}
              onDone={closeDelete}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
