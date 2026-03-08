import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Calendar, Key, Edit2, Check, X, Film, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { getMeApi, updateProfileApi, changePasswordApi } from '@/api/auth'
import { getProjects } from '@/api/projects'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'

export function ProfilePage() {
    const queryClient = useQueryClient()
    const setUser = useAuthStore((s) => s.setUser)
    const [isEditing, setIsEditing] = useState(false)
    const [editUsername, setEditUsername] = useState('')
    const [showPwdDialog, setShowPwdDialog] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['me'],
        queryFn: getMeApi,
    })

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    })

    const updateMut = useMutation({
        mutationFn: updateProfileApi,
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['me'] })
            setUser(updatedUser)
            setIsEditing(false)
            toast.success('用户名已更新')
        },
        onError: () => toast.error('更新失败，请重试'),
    })

    const pwdMut = useMutation({
        mutationFn: () => changePasswordApi(oldPassword, newPassword),
        onSuccess: () => {
            setShowPwdDialog(false)
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
            toast.success('密码修改成功')
        },
        onError: () => toast.error('密码修改失败，请检查旧密码是否正确'),
    })

    const startEdit = () => {
        setEditUsername(user?.username ?? '')
        setIsEditing(true)
    }

    const handleSaveUsername = () => {
        if (!editUsername.trim()) return
        updateMut.mutate({ username: editUsername.trim() })
    }

    const handleChangePwd = (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error('两次输入的新密码不一致')
            return
        }
        if (newPassword.length < 6) {
            toast.error('新密码长度至少 6 位')
            return
        }
        pwdMut.mutate()
    }

    if (userLoading) {
        return (
            <div className="p-8 max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="rounded-2xl border border-white/5 bg-card/40 p-8 space-y-6">
                    <div className="flex items-center gap-5">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                    <Skeleton className="h-px w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!user) return null

    const stats = [
        { icon: Film, label: '项目数', value: projects.length },
        { icon: ImageIcon, label: '已创建', value: new Date(user.created_at).toLocaleDateString('zh-CN') },
    ]

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    个人中心
                </h1>

                {/* Profile Card */}
                <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-8 mb-6">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center border border-white/10 shadow-inner">
                            <User className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="h-10 rounded-lg border border-input bg-background px-3 text-lg font-bold flex-1"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveUsername}
                                        disabled={updateMut.isPending}
                                        className="rounded-lg p-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="rounded-lg p-2.5 bg-white/5 text-muted-foreground hover:bg-white/10 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">{user.username}</h2>
                                    <button
                                        onClick={startEdit}
                                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-center gap-3"
                            >
                                <div className="rounded-lg bg-primary/10 p-2.5">
                                    <stat.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    <p className="text-lg font-bold">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info rows */}
                    <div className="space-y-4 border-t border-white/5 pt-6">
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">注册时间</span>
                            </div>
                            <span className="text-sm font-medium">
                                {new Date(user.created_at).toLocaleDateString('zh-CN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">账户安全</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPwdDialog(true)}
                                className="gap-1.5"
                            >
                                <Key className="h-3.5 w-3.5" />
                                修改密码
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Change Password Dialog */}
            <Dialog
                open={showPwdDialog}
                onClose={() => setShowPwdDialog(false)}
                title="修改密码"
            >
                <form onSubmit={handleChangePwd} className="space-y-4">
                    <Input
                        id="old-pwd"
                        label="当前密码"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                    <Input
                        id="new-pwd"
                        label="新密码"
                        type="password"
                        placeholder="至少 6 位"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        id="confirm-pwd"
                        label="确认新密码"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPwdDialog(false)}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={pwdMut.isPending}>
                            {pwdMut.isPending ? '修改中...' : '确认修改'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    )
}
