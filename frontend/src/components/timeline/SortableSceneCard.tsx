import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Scene, Photo } from '@/types'

interface SortableSceneCardProps {
  scene: Scene
  photo: Photo | undefined
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
}

export function SortableSceneCard({
  scene,
  photo,
  isSelected,
  onClick,
  onRemove,
}: SortableSceneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex h-24 w-28 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary shadow-md'
          : 'border-border hover:border-primary/50',
        isDragging && 'z-50 opacity-80 shadow-xl'
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0.5 top-0.5 z-10 rounded p-0.5 text-white/70 opacity-0 hover:text-white group-hover:opacity-100"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute right-0.5 top-0.5 z-10 rounded-full bg-black/50 p-0.5 text-white opacity-0 hover:bg-destructive group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Thumbnail */}
      <div className="flex-1 overflow-hidden bg-muted">
        {photo ? (
          <img
            src={`/uploads/${photo.thumbnail_path ?? photo.file_path}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            无照片
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between bg-card px-1.5 py-1">
        <span className="text-[10px] font-medium text-muted-foreground">
          {scene.duration}s
        </span>
        <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
          {scene.transition}
        </span>
      </div>
    </div>
  )
}
