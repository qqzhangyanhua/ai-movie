import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, BookTemplate, Clock, User, Copy, TrendingUp, ArrowDownWideNarrow } from 'lucide-react'
import { getCommunityTemplates, cloneTemplate } from '@/api/scripts'
import { getProjects } from '@/api/projects'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import { SkeletonTemplateCard } from '@/components/ui/Skeleton'
import type { Script } from '@/types'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'travel', label: '旅行' },
  { value: 'food', label: '美食' },
  { value: 'business', label: '商业' },
  { value: 'education', label: '教育' },
  { value: 'other', label: '其他' },
]

export function CommunityPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const [cloneTarget, setCloneTarget] = useState<Script | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState('')

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['community-templates', search, category, sortBy],
    queryFn: () => getCommunityTemplates({
      search: search || undefined,
      category: category || undefined,
      sort_by: sortBy,
    }),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  const cloneMut = useMutation({
    mutationFn: ({ templateId, projectId }: { templateId: string; projectId: string }) =>
      cloneTemplate(templateId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      setCloneTarget(null)
      setSelectedProjectId('')
      toast.success('模板已成功导入到项目')
    },
    onError: () => toast.error('导入模板失败'),
  })

  const handleClone = () => {
    if (!cloneTarget || !selectedProjectId) return
    cloneMut.mutate({
      templateId: cloneTarget.id,
      projectId: selectedProjectId,
    })
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">社区模板</h1>
        <p className="mt-2 text-muted-foreground font-medium">
          浏览和使用社区分享的精美微电影剧本模板
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Category tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
                category === cat.value
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-white/10 bg-[#111111]/80 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#111111]/80 border border-white/10 p-1">
            <button
              onClick={() => setSortBy('newest')}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                sortBy === 'newest' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              )}
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              最新
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                sortBy === 'popular' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              最热
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTemplateCard key={i} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#111111]/30 py-24 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
              <BookTemplate className="h-8 w-8 text-white/40" />
            </div>
            <p className="text-xl font-medium text-white/80 mb-2">
              {search ? '没有找到匹配的模板' : '暂无社区模板'}
            </p>
            <p className="text-sm text-muted-foreground/60 font-light">
              换个关键词或者稍后再来查看吧
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => setCloneTarget(template)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!cloneTarget}
        onClose={() => setCloneTarget(null)}
        title="使用此模板"
      >
        <div className="space-y-6 mt-2">
          {cloneTarget && (
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
              <h3 className="font-semibold text-white tracking-tight">{cloneTarget.title}</h3>
              {cloneTarget.description && (
                <p className="mt-2 text-sm text-muted-foreground font-light leading-relaxed">
                  {cloneTarget.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 text-[11px] font-medium text-white/40 uppercase tracking-wider">
                <span>{cloneTarget.content?.scenes?.length ?? 0} 个场景</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{cloneTarget.content?.metadata?.total_duration?.toFixed(1) ?? 0}S</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70 uppercase tracking-widest pl-1">
              选择要导入到的项目
            </label>
            {projects.length === 0 ? (
              <p className="text-sm text-red-400 pl-1 font-medium">请先创建一个项目</p>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all appearance-none"
              >
                <option value="" className="bg-[#111] text-white">选择项目...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <Button variant="ghost" onClick={() => setCloneTarget(null)}>
              取消
            </Button>
            <Button
              onClick={handleClone}
              disabled={!selectedProjectId || cloneMut.isPending}
            >
              {cloneMut.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  导入中
                </div>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  导入到项目
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function TemplateCard({
  template,
  onUse,
}: {
  template: Script
  onUse: () => void
}) {
  const scenesCount = template.content?.scenes?.length ?? 0
  const totalDuration = template.content?.metadata?.total_duration ?? 0
  const categoryLabel = CATEGORIES.find((c) => c.value === template.category)?.label

  return (
    <div className="group relative rounded-2xl border border-white/5 bg-[#111111]/80 p-6 transition-all duration-500 hover:border-white/20 hover:bg-[#151515] flex flex-col h-full shadow-2xl shadow-black overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium tracking-tight text-white/90 group-hover:text-white transition-colors">{template.title}</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {template.source_type === 'system' && (
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-primary border border-primary/20">
                官方模板
              </span>
            )}
            {categoryLabel && (
              <span className="inline-block rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-blue-400 border border-blue-500/20">
                {categoryLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {template.description && (
        <p className="mb-6 text-xs text-muted-foreground font-light line-clamp-2 h-8 leading-relaxed">
          {template.description}
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {template.content?.scenes?.slice(0, 3).map((scene, i) => (
          <span
            key={i}
            className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] text-white/60 font-medium"
          >
            {scene.caption?.slice(0, 10) ?? `场景${i + 1}`}
          </span>
        ))}
        {scenesCount > 3 && (
          <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] text-white/60 font-medium">
            +{scenesCount - 3}
          </span>
        )}
      </div>

      <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] font-medium text-white/40 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {totalDuration.toFixed(0)}S
          </span>
          <span className="flex items-center gap-1.5">
            <Copy className="h-3 w-3" />
            {template.clone_count ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            {template.source_type === 'system' ? '系统' : '用户'}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onUse} className="h-8 rounded-full px-4 text-xs">
          <Copy className="mr-1.5 h-3 w-3" />
          使用
        </Button>
      </div>
    </div>
  )
}
