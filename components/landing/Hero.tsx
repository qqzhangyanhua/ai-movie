"use client";

import Link from "next/link";
import { ChevronRight, Sparkles, CheckCircle2, Loader2, Image as ImageIcon, User, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";

export function Hero() {
  const FADE_UP_ANIMATION_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } },
  };

  const MOCKUP_ANIMATION_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 80, scale: 0.95, rotateX: 15 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: { type: "spring", stiffness: 50, damping: 20, delay: 0.5 }
    },
  };

  return (
    <section className="relative flex min-h-[90vh] pb-24 flex-col items-center pt-32 overflow-hidden px-6 perspective-1000">
      <motion.div
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        className="mx-auto max-w-5xl text-center z-10"
      >
        {/* Top Badge */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mb-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 backdrop-blur-md">
            <span>Rox is now generally</span>
            <span className="ml-1 text-[#D4AF37]">available!</span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          variants={FADE_UP_ANIMATION_VARIANTS}
          className="mb-8 text-5xl font-medium tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1] font-serif"
        >
          Revenue Agents <br />
          <span className="font-serif italic text-white/90">for the </span>
          <span className="bg-gradient-to-r from-[#F3DF9A] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent font-serif pr-2">
            Global 2000
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={FADE_UP_ANIMATION_VARIANTS}
          className="mx-auto mb-10 max-w-2xl text-[15px] tracking-wide text-gray-400 sm:text-base"
        >
          Warehouse Native | Pre-Built Agents | Driving Top Line Revenue
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={FADE_UP_ANIMATION_VARIANTS}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            href="/contact"
            className="group flex items-center gap-3 rounded-full border border-[#D4AF37]/30 px-2 py-1.5 pl-6 text-sm font-medium text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
          >
            Contact Sales
            <div className="flex size-7 items-center justify-center rounded-full border border-[#D4AF37]/30 transition-transform group-hover:translate-x-0.5">
              <ChevronRight className="size-3" />
            </div>
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-white/10 bg-white/5 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Start Now
          </Link>
        </motion.div>
      </motion.div>

      {/* App Mockup Placeholder - 3D Reveal */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={MOCKUP_ANIMATION_VARIANTS}
        className="mt-20 w-full max-w-6xl z-10"
        style={{ transformPerspective: 1200 }}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-3xl border-x border-t border-white/10 bg-[#111111] shadow-[0_-20px_80px_-20px_rgba(255,255,255,0.05)]">
          {/* Mockup Header */}
          <div className="flex h-10 items-center border-b border-white/5 bg-[#1A1A1A] px-4">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-white/20" />
              <div className="size-2.5 rounded-full bg-white/20" />
              <div className="size-2.5 rounded-full bg-white/20" />
            </div>
            {/* Fake URL Bar */}
            <div className="mx-auto flex h-6 w-1/3 items-center justify-center rounded-md bg-[#222] text-[10px] text-gray-500 font-mono">
              app.aimovie.studio/projects/create
            </div>
          </div>

          {/* Mockup Content: Animated Process */}
          <div className="relative h-full w-full bg-[#0A0A0A] p-4 sm:p-8 overflow-hidden flex flex-col items-center">

            {/* Tech grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative w-full max-w-3xl mt-2 flex flex-col gap-6">

              {/* Step 1: User Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.5 }}
                className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-[#161616] border border-white/10 p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 rounded-full bg-[#111] flex items-center justify-center border border-white/10">
                    <User className="size-4 text-gray-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-300">
                    "利用这张照片，生成一部赛博朋克风格的科幻微电影预告片。"
                  </div>
                </div>
                <div className="ml-11 flex gap-2">
                  <div className="h-16 w-16 relative rounded border border-white/10 bg-[#222] overflow-hidden flex items-center justify-center group cursor-pointer">
                    <ImageIcon className="size-6 text-gray-500" />
                    <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay" />
                    {/* Scanning effect */}
                    <motion.div
                      initial={{ top: "-10%" }}
                      animate={{ top: "110%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 2.5 }}
                      className="absolute left-0 right-0 h-0.5 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Step 2: AI Processing (Thinking) */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.6, delay: 2.5 }}
                className="self-start w-full max-w-2xl"
              >
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-3 ml-2">
                  <Sparkles className="size-4 text-[#D4AF37] animate-pulse" />
                  <span className="font-serif italic font-medium">AI Director Thinking...</span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 120 }}
                    transition={{ duration: 3, delay: 3, ease: "linear" }}
                    className="ml-2 h-[2px] rounded-full bg-gradient-to-r from-[#D4AF37] to-transparent overflow-hidden relative"
                  >
                    <motion.div
                      animate={{ x: [0, 120] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-1/2 bg-white/50 blur-sm"
                    />
                  </motion.div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#111111]/80 backdrop-blur-md p-5 flex flex-col gap-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
                  {/* Process items */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3.5 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-gray-300">提取面部特征与风格锁定...</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 4.5 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-gray-300">生成剧本与镜头语言语言分析...</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      12 / 12 Scenes
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 5.5 }}
                    className="flex items-start gap-3 text-sm mt-1"
                  >
                    <Loader2 className="size-4 text-[#D4AF37] animate-spin mt-0.5" />
                    <div className="flex flex-col gap-3 w-full">
                      <span className="text-[#D4AF37] font-medium">云端渲染视频序列中...</span>

                      {/* Rendering Progress Grid */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 6 }}
                        className="grid grid-cols-4 gap-3 w-full"
                      >
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="aspect-video rounded bg-black/50 border border-white/10 overflow-hidden relative">
                            {/* Fake image thumbnails fading in */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 0.2, 0.5] }}
                              transition={{ duration: 2, delay: 6.5 + (i * 0.8) }}
                              className="absolute inset-0 bg-cover bg-center mix-blend-luminosity"
                              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=500&q=80')" }}
                            />
                            {/* Scanning render bar */}
                            <motion.div
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2, ease: "linear" }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent skew-x-12"
                            />
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Step 3: Result Ready (Floating Play Button) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 9.5, type: "spring" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16 z-20"
              >
                <div className="group relative flex cursor-pointer items-center justify-center">
                  <div className="absolute -inset-4 rounded-full bg-[#D4AF37]/20 blur-xl transition-all group-hover:bg-[#D4AF37]/30" />
                  <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3DF9A] shadow-lg shadow-[#D4AF37]/20 transition-transform hover:scale-105">
                    <Play className="size-6 text-[#0A0A0A] ml-1" fill="currentColor" />
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
          {/* Gradient overlay to fade bottom */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
}
