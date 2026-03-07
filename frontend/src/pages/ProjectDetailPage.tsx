import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Image, FileText, Video, Settings2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { getProject } from '@/api/projects'
import { Button } from '@/components/ui/Button'
import { PhotosPanel } from '@/components/project/PhotosPanel'
import { ScriptPanel } from '@/components/project/ScriptPanel'
import { VideoPanel } from '@/components/project/VideoPanel'
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
  const [activeTab, setActiveTab] = useState<TabKey>('photos')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="font-medium animate-pulse">加载项目数据...</p>
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
        <Button variant="outline" size="sm" className="gap-2 glass-panel border-white/10 hover:border-white/20">
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
    </div>
  )
}
