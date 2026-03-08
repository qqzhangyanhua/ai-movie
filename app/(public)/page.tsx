import Link from "next/link";
import { Film } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Film className="size-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">AI 微电影</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          上传照片，AI 生成脚本，一键制作专属微电影
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
          登录
        </Link>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          注册
        </Link>
      </div>
    </div>
  );
}
