import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { getAiConfigs } from '@/api/ai-configs'
import { generateScript } from '@/api/scripts'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import type { Photo } from '@/types'

interface GenerateScriptDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  photos: Photo[]
}

export function GenerateScriptDialog({
  open,
  onClose,
  projectId,
  photos,
}: GenerateScriptDialogProps) {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [selectedConfigId, setSelectedConfigId] = useState('')
  const [useAllPhotos, setUseAllPhotos] = useState(true)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])

  const { data: aiConfigs = [] } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: getAiConfigs,
  })

  const generateMut = useMutation({
    mutationFn: generateScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', projectId] })
      onClose()
      setDescription('')
    },
  })

  const togglePhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleGenerate = () => {
    if (!description.trim() || !selectedConfigId) return
    generateMut.mutate({
      project_id: projectId,
      description,
      photo_ids: useAllPhotos ? undefined : selectedPhotoIds,
      ai_config_id: selectedConfigId,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="AI 剧本生成" className="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-widest pl-1">描述你想要的微电影</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：一段温馨的家庭旅行回忆，配合轻松愉快的音乐，展现大自然的美景和家人的笑容..."
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-[#111111]/80 px-4 py-3 text-sm text-white placeholder:text-muted-foreground/40 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all resize-none shadow-inner"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-widest pl-1">AI 配置</label>
          {aiConfigs.length === 0 ? (
            <p className="text-sm text-red-400 font-medium pl-1">
              请先在设置中添加 AI 配置
            </p>
          ) : (
            <select
              value={selectedConfigId}
              onChange={(e) => setSelectedConfigId(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#111111]/80 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all appearance-none"
            >
              <option value="" className="bg-[#111] text-white">选择 AI 配置...</option>
              {aiConfigs.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111] text-white">
                  {c.name} ({c.provider}
                  {c.model ? ` - ${c.model}` : ''})
                </option>
              ))}
            </select>
          )}
        </div>

        {photos.length > 0 && (
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-light text-white/80 cursor-pointer pl-1 mt-4">
              <input
                type="checkbox"
                checked={useAllPhotos}
                onChange={(e) => setUseAllPhotos(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-[#111111] w-4 h-4 transition-all flex-shrink-0 cursor-pointer"
              />
              使用项目中的所有照片 ({photos.length} 张)
            </label>

            {!useAllPhotos && (
              <div className="mt-2 grid grid-cols-6 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className={`cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${selectedPhotoIds.includes(photo.id)
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent'
                      }`}
                  >
                    <img
                      src={`/uploads/${photo.thumbnail_path ?? photo.file_path}`}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {generateMut.isError && (
          <p className="text-sm text-destructive">
            生成失败，请检查 AI 配置是否正确
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              !description.trim() ||
              !selectedConfigId ||
              generateMut.isPending
            }
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {generateMut.isPending ? '生成中...' : 'AI 生成'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
