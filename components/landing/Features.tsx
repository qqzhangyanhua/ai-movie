import { Film, Users, Sparkles, Share2 } from "lucide-react";

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
  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-t border-slate-800/50 bg-slate-950/50 px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
          为什么选择 AI 微电影
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-slate-400">
          用最简单的方式，创作属于你的电影故事
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30 hover:bg-slate-900/50 hover:shadow-xl hover:shadow-indigo-500/5"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-indigo-500/10 p-3 text-indigo-400 transition-colors group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
                <feature.icon className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
