import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden">
      {/* 氛围环境光 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute -top-[20%] w-[60vw] h-[50vh] bg-[#D4AF37] opacity-[0.04] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -left-[10%] top-[20%] w-[30vw] h-[40vh] bg-white opacity-[0.02] blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* 柔和渐变网格背景 */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, #000 20%, transparent 100%)',
        }}
      />

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-widest">
            <div className="flex size-6 items-center justify-center rounded-full bg-white text-[#0A0A0A]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            AI MOVIE
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors flex items-center gap-1">
              产品 <ChevronDown className="size-3" />
            </Link>
            <Link href="#solutions" className="hover:text-white transition-colors flex items-center gap-1">
              解决方案 <ChevronDown className="size-3" />
            </Link>
            <Link href="#pricing" className="hover:text-white transition-colors">
              方案定价
            </Link>
            <Link href="#company" className="hover:text-white transition-colors flex items-center gap-1">
              关于我们 <ChevronDown className="size-3" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full border border-white/10 px-2 py-1.5 pl-5 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              开始创作
              <div className="flex size-7 items-center justify-center rounded-full border border-white/20 text-white transition-transform group-hover:translate-x-0.5">
                <ChevronRight className="size-3" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Footer />
      </main>
    </div>
  );
}
