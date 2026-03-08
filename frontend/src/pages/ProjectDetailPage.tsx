import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Image, FileText, Video, Settings2, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { getProject, updateProject, deleteProject } from '@/api/projects'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { PhotosPanel } from '@/components/project/PhotosPanel'
import { ScriptPanel } from '@/components/project/ScriptPanel'
import { VideoPanel } from '@/components/project/VideoPanel'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type TabKey = 'photos' | 'script' | 'video'

const tabs: { key: TabKey; label: string; icon: typeof Image }[] = [
  { key: 'photos', label: ' 照片素材', icon: Image },
  { key: 'script', label: ' 智能剧本', icon: FileText },
  { key: 'video', label: ' 视频合成', icon: Video },
]

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>('photos')
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  })

  const updateMut = useMutation({
    mutationFn: (payload: { name?: string; description?: string }) =>
      updateProject(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowSettings(false)
      toast.success('项目信息已更新')
    },
    onError: () => toast.error('更新失败，请重试'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('项目已删除')
      navigate('/projects')
    },
    onError: () => toast.error('删除失败，请重试'),
  })

  const openSettings = () => {
    setEditName(project?.name ?? '')
    setEditDesc(project?.description ?? '')
    setShowSettings(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    updateMut.mutate({ name: editName, description: editDesc || undefined })
  }

  const handleDelete = () => {
    if (confirm(`确定要永久删除项目「${project?.name}」吗？此操作不可撤销。`)) {
      deleteMut.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-background/50">
        <header className="flex items-center gap-5 border-b border-white/5 bg-card/40 px-8 py-5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/5" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </header>
        <div className="flex border-b border-white/5 px-8 py-4 gap-4">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="glass-panel p-10 rounded-3xl text-center border border-white/10 flex flex-col items-center shadow-2xl">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-xl font-bold text-foreground mb-2">项目不存在或已删除</p>
          <p className="text-muted-foreground mb-6 font-medium">您访问的项目似乎迷路了</p>
          <Button variant="primary" onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回项目列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background/50">
      <header className="flex items-center gap-5 border-b border-white/5 bg-card/40 backdrop-blur-md px-8 py-5 sticky top-0 z-20">
        <button
          onClick={() => navigate('/projects')}
          className="rounded-full p-2.5 glass-panel text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all flex items-center justify-center group border border-white/5"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground truncate mt-1.5 font-medium">{project.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 glass-panel border-white/10 hover:border-white/20"
          onClick={openSettings}
        >
          <Settings2 className="h-4 w-4" />
          项目设置
        </Button>
      </header>

      <div className="flex border-b border-white/5 bg-card/20 px-8 sticky top-[81px] z-10 backdrop-blur-sm">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-200 outline-none',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-t-xl'
                )}
              >
                <tab.icon className={cn("h-4 w-4", isActive && "text-primary drop-shadow-sm")} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full relative max-w-7xl mx-auto"
        >
          {activeTab === 'photos' && <PhotosPanel projectId={project.id} />}
          {activeTab === 'script' && <ScriptPanel projectId={project.id} />}
          {activeTab === 'video' && <VideoPanel projectId={project.id} />}
        </motion.div>
      </div>

      {/* Project Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="项目设置"
      >
        <form onSubmit={handleSave} className="space-y-5 mt-2">
          <Input
            id="settings-name"
            label="项目名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            autoFocus
          />
          <Input
            id="settings-desc"
            label="故事梗概（可选）"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
          />
          <div className="flex justify-between gap-3 pt-4 border-t border-white/10 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleteMut.isPending ? '删除中...' : '删除项目'}
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowSettings(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateMut.isPending || !editName.trim()}>
                {updateMut.isPending ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
