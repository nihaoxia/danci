"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookText, Library, Users, LogOut } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/books", label: "单词书管理", icon: Library },
  { href: "/admin-users", label: "管理员管理", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  function handleLogout() {
    signOut();
    router.replace("/signin");
  }

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border">
      {/* 品牌 */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <BookText className="size-4" />
        </div>
        <span className="text-base font-semibold">单词后台</span>
      </div>

      {/* 导航 */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 底部用户区 */}
      <div className="flex items-center justify-between gap-2 border-t border-sidebar-border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase">
            {user?.email?.[0] ?? "U"}
          </div>
          <span
            className="truncate text-sm text-sidebar-foreground"
            title={user?.email}
          >
            {user?.email ?? "未登录"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          aria-label="退出登录"
          title="退出登录"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
