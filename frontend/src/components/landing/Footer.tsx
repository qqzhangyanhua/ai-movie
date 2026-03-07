import { Link } from 'react-router-dom'

export const Footer = () => {
  return (
    <footer className="pt-24 pb-12 border-t border-white/5 bg-[#0A0A0A] relative z-10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10"></div>
                <div className="w-4 h-4 rounded-full bg-primary relative z-10"></div>
              </div>
              <span className="text-2xl font-serif font-bold tracking-tight text-foreground">
                AI Movie
              </span>
            </div>
            <p className="text-foreground/50 text-sm leading-relaxed font-light pr-4">
              The specialized generative engine for global creators. Produce commercial-grade storytelling at unprecedented scale.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-6 uppercase tracking-widest">产品</h4>
            <div className="flex flex-col gap-4 text-sm font-light text-foreground/50">
              <a href="#features" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">功能特性</a>
              <a href="#how-it-works" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">制作流程</a>
              <Link to="/community" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">社区作品</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-6 uppercase tracking-widest">资源</h4>
            <div className="flex flex-col gap-4 text-sm font-light text-foreground/50">
              <a href="#" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">帮助中心</a>
              <a href="#" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">API 文档</a>
              <a href="#" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">创作者指南</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-6 uppercase tracking-widest">法律</h4>
            <div className="flex flex-col gap-4 text-sm font-light text-foreground/50">
              <a href="#" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">隐私政策</a>
              <a href="#" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">服务条款</a>
              <a href="#" className="hover:text-primary transition-colors hover:translate-x-1 duration-300 w-fit">版权信息</a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-foreground/40 font-light">
          <p>© {new Date().getFullYear()} AI Movie Inc. All rights reserved.</p>
          <div className="flex gap-8 mt-4 md:mt-0 uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
