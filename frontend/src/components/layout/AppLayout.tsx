import { Outlet, Link, useLocation } from 'react-router-dom'
import { Film, FolderOpen, Settings, Users, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/projects', label: '我的项目', icon: FolderOpen },
  { path: '/community', label: '社区模板', icon: Users },
  { path: '/settings', label: '设置', icon: Settings },
]

export function AppLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden text-white">
      <aside className="flex w-64 flex-col border-r border-white/10 bg-[#111111]/80 backdrop-blur-md h-full shadow-2xl shadow-black z-10 relative">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="rounded-xl bg-white/5 border border-white/10 p-2 shadow-inner">
            <Film className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-light tracking-tight text-white mb-0.5">
            AI <span className="font-serif italic text-primary/90 font-medium">微电影</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative block group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl bg-white/10 border border-white/5"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    'relative z-10 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary drop-shadow-sm" : "text-white/40 group-hover:text-white/70")} />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex w-full items-center justify-between rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all p-2 -mx-2 group">
            <div className="flex flex-col truncate px-2">
              <span className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                {user?.username || '用户'}
              </span>
              <span className="text-xs text-white/40 truncate font-light mt-0.5">
                {user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-full p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-0 flex-1 h-full overflow-hidden flex flex-col bg-transparent">
        <div className="w-full h-full overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="min-h-full flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
