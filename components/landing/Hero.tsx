"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export function Hero() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_50%,rgba(139,92,246,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_20%_80%,rgba(59,130,246,0.1),transparent)]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span
            className={cn(
              "bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent",
              "animate-in fade-in slide-in-from-bottom-4 duration-700"
            )}
          >
            一张照片，生成一部电影
          </span>
        </h1>
        <p
          className={cn(
            "mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl",
            "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both"
          )}
        >
          AI 驱动的个人微电影创作平台
        </p>
        <div
          className={cn(
            "flex flex-col items-center gap-4 sm:flex-row sm:justify-center",
            "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both"
          )}
        >
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40"
            )}
          >
            开始创作
          </Link>
          <button
            type="button"
            onClick={scrollToFeatures}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white"
            )}
          >
            了解更多
            <ChevronDown className="ml-2 size-4 animate-bounce" />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={scrollToFeatures}
          className="flex flex-col items-center gap-2 text-slate-500 transition-colors hover:text-slate-400"
          aria-label="向下滚动"
        >
          <span className="text-xs">向下滚动</span>
          <ChevronDown className="size-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
