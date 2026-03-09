"use client";

import { Upload, FileText, Layout, Video, Share } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    step: 1,
    icon: Upload,
    title: "上传照片，创建角色",
    description: "上传你的照片，AI 自动识别并创建专属角色",
  },
  {
    step: 2,
    icon: FileText,
    title: "选择剧本模板或 AI 生成",
    description: "从模板库选择或让 AI 根据你的故事生成剧本",
  },
  {
    step: 3,
    icon: Layout,
    title: "自动生成分镜",
    description: "AI 将剧本转化为可视化分镜，一键完成",
  },
  {
    step: 4,
    icon: Video,
    title: "AI 生成视频片段",
    description: "每个分镜自动生成对应视频，支持多种风格",
  },
  {
    step: 5,
    icon: Share,
    title: "合成微电影，下载分享",
    description: "一键合成完整微电影，支持下载与社交分享",
  },
];

export function HowItWorks() {
  return (
    <section className="relative border-t border-white/[0.08] bg-[#0A0A0A] px-6 py-24">
      <div className="mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
          className="text-center"
        >
          <h2 className="mb-4 text-center text-3xl font-medium tracking-tight text-white sm:text-4xl font-serif">
            创作流程
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-gray-400">
            五步完成你的专属微电影
          </p>
        </motion.div>

        <div className="space-y-0 relative">
          {/* Animated vertical connecting line */}
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-[#D4AF37]/50 via-white/10 to-transparent hidden sm:block"
          />

          {steps.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 50, damping: 20, delay: i * 0.1 }}
              key={item.step}
              className="group flex flex-col gap-6 sm:flex-row sm:items-start relative z-10"
            >
              <div className="flex shrink-0 items-start gap-4 sm:flex-col sm:items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#111111] text-gray-300 ring-1 ring-white/10 transition-colors group-hover:ring-[#D4AF37]/50 group-hover:text-[#D4AF37] shadow-xl">
                  <item.icon className="size-5" />
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-6 h-8 w-px bg-white/10 sm:hidden" />
                )}
              </div>
              <div className="flex-1 pb-12 sm:pb-16 pt-2">
                <span className="mb-2 inline-block text-xs uppercase tracking-widest font-medium text-[#D4AF37]">
                  步骤 {item.step}
                </span>
                <h3 className="mb-2 text-xl font-medium text-white transition-colors group-hover:text-gray-200">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
