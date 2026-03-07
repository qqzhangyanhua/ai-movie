import { motion } from 'framer-motion'
import { Upload, Sparkles, Video, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: "01",
    title: "上传素材",
    description: "拖拽照片或视频片段，AI 将在云端高速处理并自动识别场景色彩与人物情绪",
    icon: Upload
  },
  {
    number: "02",
    title: "AI 脚本创作",
    description: "多模态大模型为你量身定制电影级分镜脚本、优美的旁白与专业配乐建议",
    icon: Sparkles
  },
  {
    number: "03",
    title: "智能合成",
    description: "一键匹配音乐、复杂转场与视觉特效，输出令人惊艳的高清 4K 短片",
    icon: Video
  }
]

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 relative bg-background">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground font-serif">
            The Workflow of <span className="italic font-light text-primary">Professionals</span>
          </h2>
          <p className="text-foreground/60 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            告别繁琐的时间线剪辑。让 AI 处理复杂的技术细节，将精力留给纯粹的创意表达。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[4rem] left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
              className="relative text-center group"
            >
              <div className="relative mx-auto w-32 h-32 mb-10 flex flex-col items-center justify-center">
                {/* Number Badge */}
                <div className="absolute -top-4 bg-background px-3 py-1 border border-primary/20 rounded-full z-20">
                  <span className="text-xs font-mono text-primary font-bold">{step.number}</span>
                </div>

                {/* Icon Container */}
                <div className="w-20 h-20 rounded-full border border-white/5 bg-[#111114] flex items-center justify-center relative z-10 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <step.icon size={28} strokeWidth={1.5} className="text-foreground/80 group-hover:text-primary transition-colors duration-500" />
                </div>

                {/* Subtle Glow Behind Icon */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 blur-xl rounded-full transition-all duration-500 z-0 scale-75 group-hover:scale-100"></div>

                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-[60%] translate-x-4 -translate-y-1/2 text-white/10 group-hover:text-primary/40 transition-colors duration-500">
                    <ArrowRight size={20} strokeWidth={1} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-semibold mb-3 text-foreground tracking-tight">{step.title}</h3>
              <p className="text-foreground/50 leading-relaxed font-light text-sm px-4">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
