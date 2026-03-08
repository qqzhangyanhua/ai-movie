import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Film, Trash2, Calendar, CheckCircle2, Loader2, AlertCircle, FileText, ArrowRight, ChevronRight } from 'lucide-react'
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
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />已完成
      </span>
    )
    if (status === 'processing' || status === 'pending') return (
      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />生成中
      </span>
    )
    if (status === 'failed') return (
      <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-red-400">
        <AlertCircle className="h-3 w-3" />失败
      </span>
    )
    return (
      <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        <FileText className="h-3 w-3" />草稿
      </span>
    )
  }

  return (
    <div className="relative flex-1 p-8 bg-[#0A0A0A] selection:bg-primary/30 flex flex-col w-full h-full">
      {/* Rox inspired Background Graphic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="sticky top-0 w-full h-[100vh] flex items-center justify-center">
          <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[140%] opacity-[0.03]">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.1" />
              <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.1" />
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.1" />
              <circle cx="50" cy="50" r="50" stroke="white" strokeWidth="0.1" />
              <circle cx="50" cy="50" r="60" stroke="white" strokeWidth="0.1" />
              <circle cx="50" cy="50" r="70" stroke="white" strokeWidth="0.1" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pb-12 w-full flex-1">
        <div className="mb-16 mt-8 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white mb-6 backdrop-blur-md items-center gap-1.5 shadow-sm">
              AI 创作工具现已 <span className="text-primary font-serif italic ml-0.5">全面开放!</span>
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-4">
              卓越导演的 <span className="font-serif italic text-primary font-medium tracking-normal">创作中枢</span>
            </h1>
            <p className="mt-5 text-xs sm:text-sm text-muted-foreground font-light max-w-2xl mx-auto flex items-center justify-center gap-3 uppercase tracking-widest">
              <span>剧本生成</span>
              <span className="w-px h-3 bg-white/20" />
              <span>智能制片</span>
              <span className="w-px h-3 bg-white/20" />
              <span>电影级画质</span>
            </p>
          </motion.div>

          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Button
                onClick={() => setShowCreate(true)}
                className="rounded-full px-6 h-11 bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all font-light tracking-wide text-sm flex items-center gap-2 group shadow-none hover:shadow-none"
              >
                新建微电影
                <span className="flex items-center justify-center w-5 h-5 rounded-full border border-white/30 group-hover:border-white/60 transition-colors">
                  <ChevronRight className="h-3 w-3" />
                </span>
              </Button>
            </motion.div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonProjectCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center mt-12"
          >
            <Button
              onClick={() => setShowCreate(true)}
              className="rounded-full px-8 h-12 bg-white text-black hover:bg-neutral-200 transition-colors font-medium text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              创建首个项目
            </Button>
            <p className="mt-8 text-xs text-muted-foreground/60 max-w-sm text-center font-light leading-relaxed">
              无需任何基础，只需上传几张照片，AI 将为你自动生成并编排精彩的微电影。
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-12"
          >
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  variants={itemVariants}
                  key={project.id}
                  layoutId={`project-${project.id}`}
                  className="group relative cursor-pointer rounded-2xl bg-[#111111]/80 border border-white/5 p-6 transition-all duration-500 hover:border-white/20 hover:bg-[#151515] overflow-hidden shadow-2xl shadow-black"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {/* Decorative subtle top glow */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white group-hover:bg-white/10 transition-colors duration-300 shadow-inner">
                        <Film className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={project.latest_video_status} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('确定要删除此项目吗？'))
                              deleteMutation.mutate(project.id)
                          }}
                          className="rounded-full p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="删除项目"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="mb-2 text-lg font-medium tracking-tight text-white/90 group-hover:text-white transition-colors">{project.name}</h3>

                    {project.description ? (
                      <p className="mb-8 text-xs text-muted-foreground font-light line-clamp-2 h-8 leading-relaxed">
                        {project.description}
                      </p>
                    ) : (
                      <p className="mb-8 text-xs text-muted-foreground/40 italic font-light h-8">
                        暂无描述
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between text-[11px] font-medium text-muted-foreground/60 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5 uppercase tracking-wider">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.updated_at).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="flex items-center gap-1 text-primary/70 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        进入 <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

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
