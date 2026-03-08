"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      setIsLoading(true);
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
          <CardDescription>使用您的账号登录 AI 微电影</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registered && (
              <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                注册成功，请登录
              </div>
            )}
            {error && (
              <div
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="请输入邮箱"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              没有账号？{" "}
              <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                注册
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">登录</CardTitle>
            <CardDescription>使用您的账号登录 AI 微电影</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-9 animate-pulse rounded-md bg-muted" />
              <div className="h-9 animate-pulse rounded-md bg-muted" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          </CardFooter>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
