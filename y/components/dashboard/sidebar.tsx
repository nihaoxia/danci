"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookText, Library, Users, LogOut, Loader2 } from "lucide-react";
import { useTransition } from "react";

import { signoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const allNavItems = [
  { href: "/books", label: "单词书管理", icon: Library, superOnly: false },
  { href: "/admin-users", label: "管理员管理", icon: Users, superOnly: true },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const navItems = allNavItems.filter(
    (item) => !item.superOnly || user.role === "super"
  );

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <BookText className="size-4" />
        </div>
        <span className="text-base font-semibold">单词后台</span>
      </div>

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

      <div className="flex items-center justify-between gap-2 border-t border-sidebar-border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase">
            {user.email[0]}
          </div>
          <span
            className="truncate text-sm text-sidebar-foreground"
            title={user.email}
          >
            {user.email}
          </span>
        </div>
        <form
          action={() => {
            startTransition(() => signoutAction());
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label="退出登录"
            title="退出登录"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </aside>
  );
}
