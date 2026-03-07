import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export const LandingNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, setAuthModalOpen } = useAuthStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5 py-4">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link to="/" className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/10"></div>
              <div className="w-4 h-4 rounded-full bg-primary relative z-10"></div>
            </div>
            AI Movie
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-8 ml-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground font-medium text-sm transition-colors">产品功能 <span className="text-[10px] ml-1 opacity-60">▼</span></a>
            <a href="#customers" className="text-foreground/70 hover:text-foreground font-medium text-sm transition-colors">客户案例</a>
            <Link to="/community" className="text-foreground/70 hover:text-foreground font-medium text-sm transition-colors">资源社区 <span className="text-[10px] ml-1 opacity-60">▼</span></Link>
            <a href="#pricing" className="text-foreground/70 hover:text-foreground font-medium text-sm transition-colors">定价方案</a>
          </div>

          <div className="flex-1"></div>

          {/* Right Links & Buttons */}
          <div className="hidden lg:flex items-center gap-6">
            <a href="#contact" className="text-foreground/70 hover:text-foreground font-medium text-sm transition-colors">联系销售</a>

            {isAuthenticated ? (
              <Link to="/projects" className="text-foreground/70 hover:text-foreground font-medium text-sm transition-colors">
                进入工作台
              </Link>
            ) : (
              <Link to="/login" className="px-5 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-foreground font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white/5">
                登录
              </Link>
            )}

            <button onClick={() => !isAuthenticated && setAuthModalOpen(true)} className="px-5 py-2.5 rounded-full bg-transparent border border-primary text-primary hover:bg-primary/10 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              免费试用 <span className="ml-1">›</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="lg:hidden mt-4 bg-white rounded-lg shadow-2xl p-4 absolute w-[calc(100%-3rem)] left-6 flex flex-col gap-4 text-black">
            <a href="#features" className="font-semibold px-4 py-2 hover:bg-slate-50 rounded">产品功能</a>
            <a href="#customers" className="font-semibold px-4 py-2 hover:bg-slate-50 rounded">客户案例</a>
            <Link to="/community" className="font-semibold px-4 py-2 hover:bg-slate-50 rounded">资源社区</Link>
            <a href="#pricing" className="font-semibold px-4 py-2 hover:bg-slate-50 rounded">定价方案</a>
            <hr className="border-slate-100" />
            <Link to="/login" className="font-semibold px-4 py-2 hover:bg-slate-50 rounded">登录</Link>
            <button className="w-full mt-2 px-5 py-3 bg-black text-white rounded-md font-semibold">
              免费试用
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
