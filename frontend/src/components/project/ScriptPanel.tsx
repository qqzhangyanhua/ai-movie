import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Sparkles, BookmarkPlus, Share2 } from 'lucide-react'
import { getScripts, createScript, updateScript, deleteScript, saveAsTemplate, publishToCommmunity } from '@/api/scripts'
import { getPhotos } from '@/api/photos'
import { Button } from '@/components/ui/Button'
import { TimelineEditor } from '@/components/timeline/TimelineEditor'
import { GenerateScriptDialog } from './GenerateScriptDialog'
import type { Script, Scene, ScriptContent } from '@/types'

interface ScriptPanelProps {
  projectId: string
}

function emptyScene(order: number, photoId?: string): Scene {
  return {
    id: `scene-${Date.now()}-${order}`,
    photo_id: photoId ?? '',
    duration: 3.0,
    caption: '',
    transition: 'fade',
    order,
  }
}

export function ScriptPanel({ projectId }: ScriptPanelProps) {
  const queryClient = useQueryClient()
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showAiGenerate, setShowAiGenerate] = useState(false)

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['scripts', projectId],
    queryFn: () => getScripts(projectId),
  })

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', projectId],
    queryFn: () => getPhotos(projectId),
  })

  const createMutation = useMutation({
    mutationFn: createScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', projectId] })
      setIsCreating(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content?: ScriptContent }) =>
      updateScript(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', projectId] })
      setEditingScript(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', projectId] })
    },
  })

  const saveTemplateMut = useMutation({
    mutationFn: saveAsTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scripts', projectId] }),
  })

  const publishMut = useMutation({
    mutationFn: publishToCommmunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scripts', projectId] }),
  })

  const handleSave = (title: string, content: ScriptContent) => {
    if (editingScript) {
      updateMutation.mutate({ id: editingScript.id, title, content })
    } else {
      createMutation.mutate({ project_id: projectId, title, content })
    }
  }

  if (editingScript || isCreating) {
    return (
      <TimelineEditor
        initialTitle={editingScript?.title ?? '新剧本'}
        initialScenes={editingScript?.content?.scenes ?? [emptyScene(0)]}
        initialBgmId={editingScript?.content?.metadata?.bgm ?? null}
        photos={photos}
        onSave={handleSave}
        onBack={() => {
          setEditingScript(null)
          setIsCreating(false)
        }}
        isSaving={updateMutation.isPending || createMutation.isPending}
      />
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">剧本列表</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAiGenerate(true)}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI 生成
          </Button>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            新建剧本
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">加载中...</div>
      ) : scripts.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-white/10 border-dashed bg-[#111111]/30 py-12">
          <p className="text-sm text-muted-foreground font-light">还没有剧本</p>
          <Button className="mt-4 rounded-full" size="sm" onClick={() => setIsCreating(true)}>
            创建第一个剧本
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111111]/80 p-5 transition-all duration-300 hover:border-white/20 hover:bg-[#151515] shadow-lg shadow-black/20 cursor-pointer group"
              onClick={() => setEditingScript(script)}
            >
              <div>
                <h3 className="font-medium tracking-tight text-white/90 group-hover:text-white transition-colors">{script.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground font-light uppercase tracking-wider">
                  {script.content?.scenes?.length ?? 0} 个场景 ·{' '}
                  {script.content?.metadata?.total_duration?.toFixed(1) ?? 0}s
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!script.is_template && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveTemplateMut.mutate(script.id)
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-primary"
                    title="保存为模板"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </button>
                )}
                {script.is_template && !script.is_public && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('确定发布到社区？'))
                        publishMut.mutate(script.id)
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-primary"
                    title="发布到社区"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('确定删除此剧本？'))
                      deleteMutation.mutate(script.id)
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <GenerateScriptDialog
        open={showAiGenerate}
        onClose={() => setShowAiGenerate(false)}
        projectId={projectId}
        photos={photos}
      />
    </div>
  )
}
