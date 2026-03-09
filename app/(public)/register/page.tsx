"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#050505] relative overflow-hidden">
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff30_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none opacity-80" />

      {/* Framing Lines (Wireframe aesthetic) */}
      <div className="absolute top-10 md:top-24 left-0 right-0 h-px bg-white/[0.12] pointer-events-none" />
      <div className="absolute bottom-10 md:bottom-24 left-0 right-0 h-px bg-white/[0.12] pointer-events-none" />
      <div className="absolute left-10 md:left-24 top-0 bottom-0 w-px bg-white/[0.12] pointer-events-none" />
      <div className="absolute right-10 md:right-24 top-0 bottom-0 w-px bg-white/[0.12] pointer-events-none" />

      {/* Intersection Pluses/Diamonds */}
      <div className="absolute top-10 md:top-24 left-10 md:left-24 -translate-x-1/2 -translate-y-1/2 size-2 bg-[#050505] border border-white/30 pointer-events-none z-10" />
      <div className="absolute top-10 md:top-24 right-10 md:right-24 translate-x-1/2 -translate-y-1/2 size-2 bg-[#050505] border border-white/30 pointer-events-none z-10" />
      <div className="absolute bottom-10 md:bottom-24 left-10 md:left-24 -translate-x-1/2 translate-y-1/2 size-2 bg-[#050505] border border-white/30 pointer-events-none z-10" />
      <div className="absolute bottom-10 md:bottom-24 right-10 md:right-24 translate-x-1/2 translate-y-1/2 size-2 bg-[#050505] border border-white/30 pointer-events-none z-10" />

      {/* Central Solid Box */}
      <div className="absolute top-10 bottom-10 left-10 right-10 md:top-24 md:bottom-24 md:left-24 md:right-24 bg-[#111111] rounded-[2rem] md:rounded-[4rem] border border-white/[0.08] shadow-2xl pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <Card className="w-full bg-[#18181A] border-white/[0.04] shadow-2xl p-6 sm:p-8 py-10 rounded-2xl">
          <CardHeader className="space-y-4 pb-8 p-0 text-center flex flex-col items-center">
            <div className="size-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center mb-2 border border-white/5 shadow-inner">
              <Sparkles className="size-5 text-gray-300" />
            </div>
            <CardTitle className="text-xl font-medium tracking-tight text-white">
              创建账号
            </CardTitle>
            <CardDescription className="text-[13px] text-gray-400">
              设置您的用户名、邮箱和密码
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 p-0">
              {error && (
                <div
                  className={cn(
                    "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-400 text-center mb-4"
                  )}
                >
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1 block">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.username}
                    className="bg-[#222222] border-transparent text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-lg text-[14px]"
                  />
                  {fieldErrors.username?.[0] && (
                    <p className="text-xs text-red-400 px-1">{fieldErrors.username[0]}</p>
                  )}
                </div>
                <div className="space-y-1 block">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.email}
                    className="bg-[#222222] border-transparent text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-lg text-[14px]"
                  />
                  {fieldErrors.email?.[0] && (
                    <p className="text-xs text-red-400 px-1">{fieldErrors.email[0]}</p>
                  )}
                </div>
                <div className="space-y-1 block">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.password}
                    className="bg-[#222222] border-transparent text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-lg text-[14px]"
                  />
                  {fieldErrors.password?.[0] && (
                    <p className="text-xs text-red-400 px-1">{fieldErrors.password[0]}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-0 pt-6">
              <Button
                type="submit"
                className="w-full h-11 bg-[#404040] hover:bg-[#4A4A4A] text-[#E0E0E0] rounded-full font-medium transition-colors text-[14px]"
                disabled={isLoading}
              >
                {isLoading ? "注册中..." : "Create Account"}
              </Button>
              <Link href="/login" className="text-center text-[13px] text-gray-400 hover:text-white transition-colors mt-2">
                Go back to login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
