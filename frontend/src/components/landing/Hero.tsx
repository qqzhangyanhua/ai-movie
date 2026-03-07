import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'

export const Hero = () => {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore()
  const navigate = useNavigate()

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/projects')
    } else {
      setAuthModalOpen(true)
    }
  }

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center bg-background">
      {/* Background radial gradient for subtle lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Subtle concentric circles background (CSS based) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, transparent 0%, transparent 49.5%, white 50%, transparent 50.5%, transparent 100%),
            radial-gradient(circle at center, transparent 0%, transparent 49.5%, white 50%, transparent 50.5%, transparent 100%)
          `,
          backgroundSize: '1000px 1000px, 1600px 1600px',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat'
        }}
      ></div>

      <div className="container relative z-10 mx-auto px-6 max-w-5xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-medium text-foreground/80">AI Movie is now generally <span className="text-primary">available!</span></span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-6 leading-[1.05] text-foreground">
            智能生成引擎 <br className="hidden md:block" />
            for the <span className="font-serif italic text-primary font-normal">Global Creators</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/60 mb-10 leading-relaxed font-light max-w-2xl mx-auto">
            全新的视听合成中枢。通过领先的大语言模型与视频生成技术，将创意迅速转化为商业级影片体验。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-foreground font-medium text-base transition-all bg-transparent focus:outline-none focus:ring-2 focus:ring-white/20">
              联系销售代理 <span className="ml-1 text-primary">›</span>
            </button>
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-transparent border border-primary text-primary hover:bg-primary/10 font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
            >
              立即免费开始
            </button>
          </div>
        </motion.div>

        {/* Angled Mockup Area */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotateX: 10, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 w-full relative perspective-[2000px] flex justify-center"
        >
          {/* Main App Window Mockup */}
          <div
            className="w-[110%] max-w-6xl aspect-[16/9] bg-[#0f0f11] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(8deg) rotateY(-2deg) rotateZ(1deg)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05) inset'
            }}
          >
            {/* Mockup Header */}
            <div className="h-10 bg-[#141417] border-b border-white/5 flex items-center px-4 gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
              </div>
              <div className="mx-auto h-4 w-48 bg-white/5 rounded-full"></div>
            </div>

            {/* Mockup Body Elements */}
            <div className="p-6 h-full flex gap-6">
              {/* Sidebar */}
              <div className="w-48 h-full border-r border-white/5 pr-4 space-y-3">
                <div className="h-6 w-full bg-white/5 rounded"></div>
                <div className="h-6 w-3/4 bg-white/5 rounded"></div>
                <div className="h-6 w-5/6 bg-white/5 rounded"></div>
                <div className="h-px w-full bg-white/5 my-4"></div>
                <div className="h-6 w-full bg-white/5 rounded"></div>
                <div className="h-6 w-2/3 bg-primary/20 text-primary border border-primary/30 rounded flex items-center px-2 text-[10px]">Active Project</div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col gap-4 relative">
                {/* Search/Command Bar */}
                <div className="h-12 w-full max-w-2xl mx-auto mt-4 bg-[#1a1a1f] border border-white/10 rounded-xl flex items-center px-4 relative overflow-hidden">
                  <div className="w-4 h-4 rounded-full border border-primary/50 mr-3"></div>
                  <div className="h-4 w-64 bg-white/10 rounded"></div>
                  <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-r from-transparent to-primary/10"></div>
                </div>

                {/* Sub-cards */}
                <div className="flex-1 mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-[#141417] border border-white/5 rounded-xl p-4">
                    <div className="h-3 w-20 bg-white/20 rounded mb-3"></div>
                    <div className="h-2 w-full bg-white/5 rounded mb-2"></div>
                    <div className="h-2 w-full bg-white/5 rounded mb-2"></div>
                    <div className="h-2 w-4/5 bg-white/5 rounded"></div>
                  </div>
                  <div className="bg-[#141417] border border-white/5 rounded-xl p-4">
                    <div className="h-3 w-24 bg-white/20 rounded mb-3"></div>
                    <div className="h-2 w-full bg-white/5 rounded mb-2"></div>
                    <div className="h-2 w-full bg-white/5 rounded mb-2"></div>
                    <div className="h-2 w-3/4 bg-white/5 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Element (Mobile Phone Mockup) */}
          <div
            className="absolute -left-12 bottom-12 w-48 aspect-[9/19] bg-[#0a0a0c] rounded-3xl border border-white/20 shadow-2xl p-1 z-20"
            style={{
              transform: 'translateZ(50px) rotateY(-15deg) rotateX(10deg)',
            }}
          >
            <div className="w-full h-full border border-white/10 rounded-[22px] bg-[#141417] overflow-hidden relative flex flex-col pt-6 px-3">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-10 w-[40%]"></div>

              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 mb-4 mt-2"></div>
              <div className="h-3 w-3/4 bg-white/20 rounded mb-2"></div>
              <div className="h-2 w-1/2 bg-white/10 rounded mb-6"></div>

              <div className="space-y-3 flex-1">
                <div className="h-12 w-full bg-white/5 rounded-lg"></div>
                <div className="h-12 w-full bg-white/5 rounded-lg border border-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10 w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Brands Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-32 w-full border-t border-white/5 pt-12 pb-12"
        >
          <p className="text-center text-sm font-medium text-foreground/40 mb-8 tracking-wider">
            AI Transformation Partner to the Best
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-40 grayscale">
            {/* Replace with actual SVGs or stylized text for logos */}
            <div className="text-xl font-bold font-serif tracking-tighter">Snorkel</div>
            <div className="text-xl font-bold italic">Webflow</div>
            <div className="text-xl font-bold font-mono">hightouch</div>
            <div className="text-xl font-bold tracking-widest">bynder</div>
            <div className="text-xl font-bold lowercase">groq</div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
