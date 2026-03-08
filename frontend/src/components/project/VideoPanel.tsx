import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Download, XCircle, Loader2, CheckCircle2, AlertCircle, Eye, RotateCcw } from 'lucide-react'
import { getVideoTasks, createVideoTask, getVideoTask, cancelVideoTask, retryVideoTask } from '@/api/video-tasks'
import { getScripts } from '@/api/scripts'
import { getPhotos } from '@/api/photos'
import { getAiConfigs } from '@/api/ai-configs'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import { ScenePreview } from './ScenePreview'
import type { VideoTask } from '@/types'

interface VideoPanelProps {
  projectId: string
}

const STATUS_CONFIG: Record<
  VideoTask['status'],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pending: { label: '等待中', icon: Loader2, className: 'text-yellow-500' },
  processing: { label: '生成中', icon: Loader2, className: 'text-blue-500 animate-spin' },
  completed: { label: '已完成', icon: CheckCircle2, className: 'text-green-500' },
  failed: { label: '失败', icon: AlertCircle, className: 'text-destructive' },
}

export function VideoPanel({ projectId }: VideoPanelProps) {
  const queryClient = useQueryClient()
  const [showGenDialog, setShowGenDialog] = useState(false)
  const [selectedScript, setSelectedScript] = useState('')
  const [selectedConfig, setSelectedConfig] = useState('')
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null)
  const [previewScriptId, setPreviewScriptId] = useState<string | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['video-tasks', projectId],
    queryFn: () => getVideoTasks(projectId),
  })

  const { data: scripts = [] } = useQuery({
    queryKey: ['scripts', projectId],
    queryFn: () => getScripts(projectId),
  })

  const { data: aiConfigs = [] } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: getAiConfigs,
  })

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', projectId],
    queryFn: () => getPhotos(projectId),
  })

  useQuery({
    queryKey: ['video-task-poll', pollingTaskId],
    queryFn: async () => {
      if (!pollingTaskId) return null
      const task = await getVideoTask(pollingTaskId)
      if (task.status === 'completed' || task.status === 'failed') {
        setPollingTaskId(null)
        queryClient.invalidateQueries({ queryKey: ['video-tasks', projectId] })
      }
      return task
    },
    enabled: !!pollingTaskId,
    refetchInterval: 5000,
  })

  const createMut = useMutation({
    mutationFn: createVideoTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['video-tasks', projectId] })
      setPollingTaskId(task.id)
      setShowGenDialog(false)
      toast.success('视频生成任务已提交')
    },
    onError: () => toast.error('提交视频任务失败'),
  })

  const cancelMut = useMutation({
    mutationFn: cancelVideoTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-tasks', projectId] })
      setPollingTaskId(null)
    },
  })

  const retryMut = useMutation({
    mutationFn: retryVideoTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['video-tasks', projectId] })
      setPollingTaskId(task.id)
      toast.success('视频任务已重新提交')
    },
    onError: () => toast.error('重试失败，请稍后再试'),
  })

  useEffect(() => {
    const activeTask = tasks.find(
      (t) => t.status === 'pending' || t.status === 'processing'
    )
    if (activeTask && !pollingTaskId) {
      setPollingTaskId(activeTask.id)
    }
  }, [tasks, pollingTaskId])

  const handleGenerate = () => {
    if (!selectedScript || !selectedConfig) return
    createMut.mutate({
      project_id: projectId,
      script_id: selectedScript,
      ai_config_id: selectedConfig,
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">视频生成</h2>
        <div className="flex gap-2">
          {scripts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const firstScript = scripts[0]
                if (firstScript) setPreviewScriptId(firstScript.id)
              }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              预览
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowGenDialog(true)}
            disabled={scripts.length === 0 || aiConfigs.length === 0}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            生成视频
          </Button>
        </div>
      </div>

      {scripts.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          请先在「智能剧本」标签页创建剧本，再生成视频
        </div>
      )}
      {aiConfigs.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          请先在「设置」页面添加 AI 服务配置
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border py-10">
          <Play className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">还没有生成过视频</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const config = STATUS_CONFIG[task.status]
            const StatusIcon = config.icon
            return (
              <div
                key={task.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${config.className}`} />
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(task.status === 'pending' || task.status === 'processing') && (
                      <>
                        {task.progress != null && task.progress > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {task.progress}%
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMut.mutate(task.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {task.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryMut.mutate(task.id)}
                        disabled={retryMut.isPending}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      >
                        <RotateCcw className={`h-4 w-4 mr-1 ${retryMut.isPending ? 'animate-spin' : ''}`} />
                        重试
                      </Button>
                    )}
                    {task.status === 'completed' && task.result_video_path && (
                      <a
                        href={`/uploads/${task.result_video_path}`}
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="h-3.5 w-3.5" />
                        下载
                      </a>
                    )}
                  </div>
                </div>
                {task.status === 'processing' && task.progress != null && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
                {task.status === 'failed' && task.error_message && (
                  <p className="mt-2 text-xs text-destructive">
                    {task.error_message}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={showGenDialog}
        onClose={() => setShowGenDialog(false)}
        title="生成视频"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">选择剧本</label>
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">请选择...</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">AI 配置</label>
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">请选择...</option>
              {aiConfigs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.provider})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowGenDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                !selectedScript || !selectedConfig || createMut.isPending
              }
            >
              {createMut.isPending ? '提交中...' : '开始生成'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Scene Preview */}
      {previewScriptId && (() => {
        const previewScript = scripts.find((s) => s.id === previewScriptId)
        const previewScenes = previewScript?.content?.scenes ?? []
        return previewScenes.length > 0 ? (
          <ScenePreview
            scenes={previewScenes}
            photos={photos}
            onClose={() => setPreviewScriptId(null)}
          />
        ) : null
      })()}
    </div>
  )
}
