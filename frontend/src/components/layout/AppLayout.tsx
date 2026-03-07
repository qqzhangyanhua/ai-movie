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
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-border bg-card h-full shadow-sm z-10 relative">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="rounded-lg bg-primary p-2 shadow-sm">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            AI 微电影
          </span>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
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
                    className="absolute inset-0 rounded-lg bg-accent"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    'relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-50'
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-accent-foreground" : "text-slate-400 group-hover:text-slate-600")} />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex w-full items-center justify-between rounded-lg hover:bg-slate-50 transition-colors p-2 -mx-2">
            <div className="flex flex-col truncate px-2">
              <span className="text-sm font-semibold text-foreground truncate">
                {user?.username || '用户'}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-0 flex-1 h-full overflow-hidden flex flex-col bg-slate-50/50">
        <div className="w-full h-full overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
