"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";

export default function CreateProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CreateProject Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">加载项目时出错</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || "发生了未知错误，请稍后重试。"}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            错误代码：{error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="mr-2 size-4" />
          重试
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          <Home className="mr-2 size-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
