import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { registerApi, loginApi, getMeApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)
    try {
      await registerApi(email, username, password)
      const tokens = await loginApi(email, password)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const user = await getMeApi()
      login(user, tokens.access_token, tokens.refresh_token)
      navigate('/projects')
    } catch {
      setError('注册失败，邮箱可能已被使用')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] overflow-hidden text-[#ededed] font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Horizontal and Vertical dividing lines */}
        <div className="absolute left-[10%] right-[10%] top-0 bottom-0 border-x border-white/[0.04]" />
        <div className="absolute top-[12%] bottom-[12%] left-0 right-0 border-y border-white/[0.04]" />

        {/* Corner dots */}
        <div className="absolute top-0 left-0 w-[10%] h-[12%] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
        <div className="absolute top-0 right-0 w-[10%] h-[12%] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
        <div className="absolute bottom-0 left-0 w-[10%] h-[12%] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
        <div className="absolute bottom-0 right-0 w-[10%] h-[12%] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />

        {/* Center curve box */}
        <div className="absolute left-[10%] right-[10%] top-[12%] bottom-[12%] border border-white/[0.04] rounded-tl-[120px] rounded-br-[120px] bg-white/[0.01]" />

        {/* Crosshairs */}
        <div className="absolute left-[10%] top-[12%] -translate-x-1/2 -translate-y-1/2 text-white/[0.2] text-[10px] leading-none">+</div>
        <div className="absolute right-[10%] top-[12%] translate-x-1/2 -translate-y-1/2 text-white/[0.2] text-[10px] leading-none">+</div>
        <div className="absolute left-[10%] bottom-[12%] -translate-x-1/2 translate-y-1/2 text-white/[0.2] text-[10px] leading-none">+</div>
        <div className="absolute right-[10%] bottom-[12%] translate-x-1/2 translate-y-1/2 text-white/[0.2] text-[10px] leading-none">+</div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[400px] rounded-xl border border-white/[0.08] bg-[#111111] p-10 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#222]">
            <Sparkles className="h-6 w-6 text-[#ededed]" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-white mb-2">验证您的身份</h1>
          <p className="text-sm text-[#888]">
            请创建您的账户
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="email"
              type="email"
              placeholder="您的邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-[#1a1a1a] border border-transparent px-4 py-3.5 text-sm text-white placeholder-[#555] transition-colors focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div>
            <input
              id="username"
              type="text"
              placeholder="您的用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg bg-[#1a1a1a] border border-transparent px-4 py-3.5 text-sm text-white placeholder-[#555] transition-colors focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div>
            <input
              id="password"
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-[#1a1a1a] border border-transparent px-4 py-3.5 text-sm text-white placeholder-[#555] transition-colors focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div>
            <input
              id="confirmPassword"
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-[#1a1a1a] border border-transparent px-4 py-3.5 text-sm text-white placeholder-[#555] transition-colors focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 pt-1 text-center">{error}</p>
          )}

          <div className="pt-2 flex flex-col items-center space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#444] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '继续'}
            </button>

            <p className="text-xs text-[#666] text-center max-w-[280px]">
              已有账户？ <Link to="/login" className="text-white hover:underline transition-colors">登录您的账户</Link>
            </p>

            <Link to="/" className="text-xs text-[#666] font-medium hover:text-[#999] transition-colors mt-2">
              返回
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
