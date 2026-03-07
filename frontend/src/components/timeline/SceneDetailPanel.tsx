import { ImageIcon } from 'lucide-react'
import type { Scene, Photo } from '@/types'

interface SceneDetailPanelProps {
  scene: Scene
  photos: Photo[]
  onChange: (updates: Partial<Scene>) => void
}

const TRANSITIONS = [
  { value: 'fade', label: '淡入淡出' },
  { value: 'slide', label: '滑动' },
  { value: 'zoom', label: '缩放' },
  { value: 'dissolve', label: '溶解' },
  { value: 'none', label: '无' },
]

export function SceneDetailPanel({ scene, photos, onChange }: SceneDetailPanelProps) {
  const selectedPhoto = photos.find((p) => p.id === scene.photo_id)

  return (
    <div className="p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        场景编辑
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div>
          <label className="mb-2 block text-sm font-medium">预览</label>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
            {selectedPhoto ? (
              <>
                <img
                  src={`/uploads/${selectedPhoto.file_path}`}
                  alt=""
                  className="h-full w-full object-contain"
                />
                {scene.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-sm text-white">{scene.caption}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">照片</label>
            <select
              value={scene.photo_id}
              onChange={(e) => onChange({ photo_id: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">选择照片...</option>
              {photos.map((p) => (
                <option key={p.id} value={p.id}>
                  照片 {p.order_index + 1} ({p.width}x{p.height})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              时长: {scene.duration}s
            </label>
            <input
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={scene.duration}
              onChange={(e) => onChange({ duration: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5s</span>
              <span>30s</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">场景文案</label>
            <textarea
              value={scene.caption}
              onChange={(e) => onChange({ caption: e.target.value })}
              placeholder="输入场景描述文案，将显示在视频画面上..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">转场效果</label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSITIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => onChange({ transition: t.value })}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    scene.transition === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
