import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, BookTemplate, Clock, User, Copy } from 'lucide-react'
import { getCommunityTemplates, cloneTemplate } from '@/api/scripts'
import { getProjects } from '@/api/projects'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import type { Script } from '@/types'

export function CommunityPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [cloneTarget, setCloneTarget] = useState<Script | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState('')

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['community-templates', search],
    queryFn: () => getCommunityTemplates({ search: search || undefined }),
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
    },
  })

  const handleClone = () => {
    if (!cloneTarget || !selectedProjectId) return
    cloneMut.mutate({
      templateId: cloneTarget.id,
      projectId: selectedProjectId,
    })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">社区模板</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          浏览和使用社区分享的剧本模板
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">加载中...</div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20">
          <BookTemplate className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            {search ? '没有找到匹配的模板' : '暂无社区模板'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => setCloneTarget(template)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!cloneTarget}
        onClose={() => setCloneTarget(null)}
        title="使用此模板"
      >
        <div className="space-y-4">
          {cloneTarget && (
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-medium">{cloneTarget.title}</h3>
              {cloneTarget.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {cloneTarget.description}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {cloneTarget.content?.scenes?.length ?? 0} 个场景 ·{' '}
                {cloneTarget.content?.metadata?.total_duration?.toFixed(1) ?? 0}s
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              选择要导入到的项目
            </label>
            {projects.length === 0 ? (
              <p className="text-sm text-destructive">请先创建一个项目</p>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">选择项目...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCloneTarget(null)}>
              取消
            </Button>
            <Button
              onClick={handleClone}
              disabled={!selectedProjectId || cloneMut.isPending}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              {cloneMut.isPending ? '导入中...' : '导入到项目'}
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

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{template.title}</h3>
          {template.source_type === 'system' && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              官方模板
            </span>
          )}
        </div>
      </div>

      {template.description && (
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {template.content?.scenes?.slice(0, 3).map((scene, i) => (
          <span
            key={i}
            className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
          >
            {scene.caption?.slice(0, 10) ?? `场景${i + 1}`}
          </span>
        ))}
        {scenesCount > 3 && (
          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            +{scenesCount - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalDuration.toFixed(0)}s
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {template.source_type === 'system' ? '系统' : '用户'}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onUse}>
          <Copy className="mr-1 h-3 w-3" />
          使用
        </Button>
      </div>
    </div>
  )
}
