"use client";

import { Film, Users, Sparkles, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Film,
    title: "降低创作门槛",
    description: "无需拍摄或剪辑经验，AI 自动完成一切",
  },
  {
    icon: Users,
    title: "个性化角色",
    description: "上传照片，成为电影主角",
  },
  {
    icon: Sparkles,
    title: "AI 自动生成",
    description: "剧本、分镜、视频、后期，全部 AI 完成",
  },
  {
    icon: Share2,
    title: "社交传播",
    description: "一键分享你的 AI 微电影",
  },
];

export function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 60, damping: 20 } },
  };

  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-t border-white/[0.08] bg-[#0A0A0A] px-6 py-24"
    >
      <div className="mx-auto max-w-6xl relative z-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <motion.h2 variants={itemVariants} className="mb-4 text-center text-3xl font-medium tracking-tight text-white sm:text-4xl font-serif">
            为什么选择 AI 微电影
          </motion.h2>
          <motion.p variants={itemVariants} className="mx-auto mb-16 max-w-2xl text-center text-gray-400">
            用最简单的方式，创作属于你的电影故事
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, i) => (
            <motion.div
              variants={itemVariants}
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111111] p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616] hover:shadow-2xl hover:shadow-[#D4AF37]/5"
            >
              <div className="mb-4 inline-flex rounded-xl bg-white/5 p-3 text-white transition-colors group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37]">
                <feature.icon className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
