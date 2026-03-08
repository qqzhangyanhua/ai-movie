import { Upload, FileText, Layout, Video, Share } from "lucide-react";

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
    <section className="relative border-t border-slate-800/50 bg-slate-950 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
          创作流程
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-slate-400">
          五步完成你的专属微电影
        </p>
        <div className="space-y-0">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className="flex flex-col gap-6 sm:flex-row sm:items-start"
            >
              <div className="flex shrink-0 items-start gap-4 sm:flex-col sm:items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30">
                  <item.icon className="size-6" />
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-6 h-8 w-px bg-slate-700 sm:ml-0 sm:h-12 sm:w-px" />
                )}
              </div>
              <div className="flex-1 pb-12 sm:pb-8">
                <span className="mb-2 inline-block text-sm font-medium text-indigo-400">
                  步骤 {item.step}
                </span>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
