"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Search, Trash2, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllUsers, type AdminUser } from "@/lib/auth";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState("");

  const refresh = useCallback(() => setUsers(getAllUsers()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = keyword.trim()
    ? users.filter(
      (u) =>
        u.name.toLowerCase().includes(keyword.trim().toLowerCase()) ||
        u.email.toLowerCase().includes(keyword.trim().toLowerCase())
    )
    : users;

  return (
    <>
      <PageHeader
        title="管理员管理"
        description="添加与管理员账号，第一个注册者为超级管理员"
        actions={
          <Button size="sm">
            <UserPlus />
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
          <span className="text-sm text-muted-foreground">
            共 {filtered.length} 位管理员
          </span>
        </div>

        <div className="rounded-xl border bg-card">
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
                    {users.length === 0
                      ? "暂无管理员，去注册一个吧"
                      : "暂无匹配的管理员"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u, idx) => {
                  const isSelf = u.email === user?.email;
                  return (
                    <TableRow key={u.email}>
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
                            超级管理员
                          </Badge>
                        ) : (
                          <Badge variant="secondary">管理员</Badge>
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
                            className="text-destructive hover:text-destructive disabled:opacity-40"
                            aria-label="删除"
                            title={isSelf ? "无法删除当前登录账号" : "删除"}
                            disabled={isSelf || u.role === "super"}
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

        {users.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-8 text-sm">
            第一个注册的管理员将成为超级管理员
          </div>
        )}
      </div>
    </>
  );
}
