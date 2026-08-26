"use client";

import { useActionState } from "react";
import { BookText, Loader2 } from "lucide-react";

import { signupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, {
    error: undefined,
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookText className="size-6" />
        </div>
        <CardTitle className="text-xl">注册系统管理员</CardTitle>
        <CardDescription>首个注册账号将成为系统管理员</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="请输入姓名"
              autoComplete="name"
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="至少 6 位"
              autoComplete="new-password"
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">确认密码</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="再次输入密码"
              autoComplete="new-password"
              required
              disabled={pending}
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending && <Loader2 className="animate-spin" />}
            注册
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        已有账号？去
        <a href="/signin" className="text-foreground hover:underline">
          登录
        </a>
      </CardFooter>
    </Card>
  );
}
