"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const body = { username, email, password };

    try {
      setIsLoading(true);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details?.fieldErrors) {
          setFieldErrors(data.details.fieldErrors);
        }
        setError(data.error ?? "注册失败");
        return;
      }

      router.push("/login?registered=true");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">注册</CardTitle>
          <CardDescription>创建您的 AI 微电影账号</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="请输入用户名"
                autoComplete="username"
                required
                disabled={isLoading}
                aria-invalid={!!fieldErrors.username}
              />
              {fieldErrors.username?.[0] && (
                <p className="text-sm text-destructive">{fieldErrors.username[0]}</p>
              )}
            </div>
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
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email?.[0] && (
                <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="至少 6 个字符"
                autoComplete="new-password"
                required
                disabled={isLoading}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password?.[0] && (
                <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "注册中..." : "注册"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              已有账号？{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                登录
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
