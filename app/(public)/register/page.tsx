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

// Google Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

// Microsoft Icon
const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 23 23" {...props}>
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
)

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
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[#050505] z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#ffffff08,transparent)]" />
      </div>
      
      {/* Glow Effect */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <Card className="w-full bg-[#0A0A0A] border-white/10 shadow-2xl p-6 sm:p-8 rounded-xl backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6 p-0 text-center flex flex-col items-center">
            <div className="size-10 bg-white text-black rounded-lg flex items-center justify-center mb-2 shadow-inner">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight text-white">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-sm text-gray-400">
                Sign Up to continue to AI Movie
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 p-0">
              {error && (
                <div
                  className={cn(
                    "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 text-center mb-4"
                  )}
                >
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.username}
                    className="bg-[#161616] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-gray-600 focus-visible:border-gray-600 h-11 rounded-lg text-sm transition-all"
                  />
                  {fieldErrors.username?.[0] && (
                    <p className="text-xs text-red-400 px-1">{fieldErrors.username[0]}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Business email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.email}
                    className="bg-[#161616] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-gray-600 focus-visible:border-gray-600 h-11 rounded-lg text-sm transition-all"
                  />
                  {fieldErrors.email?.[0] && (
                    <p className="text-xs text-red-400 px-1">{fieldErrors.email[0]}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.password}
                    className="bg-[#161616] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-gray-600 focus-visible:border-gray-600 h-11 rounded-lg text-sm transition-all"
                  />
                  {fieldErrors.password?.[0] && (
                    <p className="text-xs text-red-400 px-1">{fieldErrors.password[0]}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-4 bg-[#333333] hover:bg-[#404040] text-white rounded-lg font-medium transition-colors text-sm border border-white/5"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Continue"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-[#0A0A0A] px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-[#161616] hover:bg-[#1F1F1F] border-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  onClick={() => {}}
                >
                  <GoogleIcon className="w-4 h-4" />
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-[#161616] hover:bg-[#1F1F1F] border-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  onClick={() => {}}
                >
                  <MicrosoftIcon className="w-4 h-4" />
                  Continue with Microsoft
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-0 pt-6">
              <Link href="/login" className="text-center text-xs text-gray-500 hover:text-white transition-colors">
                Already have an account? <span className="text-white hover:underline">Log in</span>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
