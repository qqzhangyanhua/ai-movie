import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface AuthModalProps {
  onClose: () => void
}

export const AuthModal = ({ onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const navigate = useNavigate()

  const handleNavigate = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-8"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-6">{mode === 'login' ? '登录' : '注册'}</h2>

          <div className="space-y-4">
            <button
              onClick={() => handleNavigate(mode === 'login' ? '/login' : '/register')}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
            >
              {mode === 'login' ? '前往登录页面' : '前往注册页面'}
            </button>

            <div className="text-center text-sm text-slate-400">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="ml-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
