import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { loginApi, getMeApi } from '@/api/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tokens = await loginApi(email, password)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const user = await getMeApi()
      login(user, tokens.access_token, tokens.refresh_token)
      navigate('/projects')
    } catch {
      setError('邮箱或密码错误')
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
      <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-[#111111]/80 backdrop-blur-xl p-10 shadow-2xl">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-inner">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white mb-2">登录您的账户</h1>
          <p className="text-sm text-muted-foreground/60 font-light">
            请输入您的邮箱和密码进行验证
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            type="email"
            placeholder="您的邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            label="邮箱"
          />
          <Input
            id="password"
            type="password"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            label="密码"
          />

          {error && (
            <p className="text-xs text-red-500 font-medium pt-1 text-center">{error}</p>
          )}

          <div className="pt-4 flex flex-col items-center space-y-5">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  登录中
                </div>
              ) : '继续'}
            </Button>

            <p className="text-xs text-muted-foreground/60 text-center max-w-[280px] font-light">
              还没收到验证码？或者没有账户？ <Link to="/register" className="text-white hover:text-primary transition-colors font-medium">去注册</Link>
            </p>

            <Link to="/" className="text-[11px] text-muted-foreground/40 font-medium hover:text-white transition-colors mt-2 uppercase tracking-wider">
              返回首页
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
