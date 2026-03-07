import { motion } from 'framer-motion'
import { BrainCircuit, Film, Wand2, Languages } from 'lucide-react'

const features = [
  {
    title: "智能文案助手",
    description: "基于最先进的 LLM 引擎，自动识别图片场景并撰写动人的分镜脚本与旁白。",
    icon: BrainCircuit,
  },
  {
    title: "电影级视觉滤镜",
    description: "内置海量专业调色方案，一键让你的素材呈现好莱坞大片的视觉质感。",
    icon: Film,
  },
  {
    title: "自动化视频合成",
    description: "AI 自动匹配节奏、转场与音效，无需复杂剪辑，即刻生成精美视频。",
    icon: Wand2,
  },
  {
    title: "多语种智能配音",
    description: "支持全球 30+ 种语言配音，自然真实的情感表达，让你的作品走向世界。",
    icon: Languages,
  }
]

export const Features = () => {
  return (
    <section id="features" className="py-32 relative bg-background overflow-hidden border-t border-white/5">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute -left-[20%] top-[20%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />核心功能
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground font-serif">
            A New Standard for <span className="italic font-light text-primary">Creation</span>
          </h2>
          <p className="max-w-2xl mx-auto text-foreground/60 text-lg font-light leading-relaxed">
            强大的 AI 技术，让视频制作变得前所未有的简单。无需专业技能，享受工业级的专业创作流。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.7, ease: "easeOut" }}
              className="p-8 rounded-[24px] bg-[#111114] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Subtle hover glow effect */}
              <div className="absolute -inset-px bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-500 rounded-[24px] pointer-events-none"></div>

              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <feature.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground tracking-tight">{feature.title}</h3>
              <p className="text-foreground/50 leading-relaxed text-sm font-light">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
