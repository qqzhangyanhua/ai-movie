import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Film, Trash2, Calendar, Sparkles, CheckCircle2, Loader2, AlertCircle, FileText } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { getProjects, createProject, deleteProject } from '@/api/projects'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import { SkeletonProjectCard } from '@/components/ui/Skeleton'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      toast.success('项目创建成功')
    },
    onError: () => toast.error('创建项目失败，请重试'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('项目已删除')
    },
    onError: () => toast.error('删除项目失败'),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createMutation.mutate({ name: newName, description: newDesc || undefined })
  }

  type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | null | undefined
  function StatusBadge({ status }: { status: VideoStatus }) {
    if (status === 'completed') return (
      <span className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
        <CheckCircle2 className="h-3 w-3" />已完成
      </span>
    )
    if (status === 'processing' || status === 'pending') return (
      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />生成中
      </span>
    )
    if (status === 'failed') return (
      <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
        <AlertCircle className="h-3 w-3" />失败
      </span>
    )
    return (
      <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <FileText className="h-3 w-3" />草稿
      </span>
    )
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-10 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">我的项目</h1>
          <p className="mt-2 text-muted-foreground font-medium">
            管理并创作你的卓越微电影
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button onClick={() => setShowCreate(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            新建项目
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-[50vh] rounded-3xl border border-dashed border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
            <Sparkles className="h-10 w-10 text-primary drop-shadow-md" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">灵感在此生根</h3>
          <p className="max-w-md text-muted-foreground font-medium mb-8">
            你还没有创建任何微电影项目。点击下方按钮，只需上传几张照片，立刻开启你的 AI 导演之旅。
          </p>
          <Button size="lg" className="gap-2 shadow-xl shadow-primary/20" onClick={() => setShowCreate(true)}>
            <Plus className="h-5 w-5" />
            创建首个项目
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                variants={itemVariants}
                key={project.id}
                layoutId={`project-${project.id}`}
                className="group relative cursor-pointer rounded-2xl glass-panel p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 overflow-hidden"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Decorative bg gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <Film className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.latest_video_status} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('确定要删除此项目吗？'))
                            deleteMutation.mutate(project.id)
                        }}
                        className="rounded-full p-2 bg-destructive/10 text-destructive opacity-0 hover:bg-destructive hover:text-white transition-all duration-200 group-hover:opacity-100 backdrop-blur-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mb-2 text-xl font-bold truncate tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90 group-hover:from-primary group-hover:to-indigo-300 transition-all">{project.name}</h3>

                  {project.description ? (
                    <p className="mb-6 text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mb-6 text-sm text-muted-foreground/50 italic h-10">
                      暂无描述
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.updated_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto text-primary/60">
                      打开项目 &rarr;
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建微电影项目"
      >
        <form onSubmit={handleCreate} className="space-y-5 mt-2">
          <Input
            id="project-name"
            label="项目名称"
            placeholder="例如：赛博朋克 2077 回忆录"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            autoFocus
          />
          <Input
            id="project-desc"
            label="故事梗概（可选）"
            placeholder="简单描述一下这个故事的背景或风格..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="min-w-[100px]">
              {createMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  创建中
                </div>
              ) : '开始创作'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
