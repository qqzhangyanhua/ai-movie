import { Plus, ImageIcon } from 'lucide-react'
import type { Photo } from '@/types'

interface PhotoPoolProps {
  photos: Photo[]
  onAddToTimeline: (photoId: string) => void
}

export function PhotoPool({ photos, onAddToTimeline }: PhotoPoolProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          请先在"照片"标签页中上传照片
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        照片素材
      </h3>
      <div className="space-y-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-border"
            onClick={() => onAddToTimeline(photo.id)}
          >
            <img
              src={`/uploads/${photo.thumbnail_path ?? photo.file_path}`}
              alt=""
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
