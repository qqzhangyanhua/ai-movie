import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film } from 'lucide-react'
import { registerApi, loginApi, getMeApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 text-primary">
            <Film className="h-8 w-8" />
            <span className="text-2xl font-bold">AI 微电影</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">创建你的账户</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="邮箱"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="username"
            label="用户名"
            type="text"
            placeholder="输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            id="password"
            label="密码"
            type="password"
            placeholder="至少6位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            id="confirmPassword"
            label="确认密码"
            type="password"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          已有账户？{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
