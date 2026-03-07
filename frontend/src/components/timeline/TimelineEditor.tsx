import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Save, Clock, ArrowLeft } from 'lucide-react'
import { SortableSceneCard } from './SortableSceneCard'
import { SceneDetailPanel } from './SceneDetailPanel'
import { PhotoPool } from './PhotoPool'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Scene, ScriptContent, Photo } from '@/types'

interface TimelineEditorProps {
  initialTitle: string
  initialScenes: Scene[]
  photos: Photo[]
  onSave: (title: string, content: ScriptContent) => void
  onBack: () => void
  isSaving: boolean
}

export function TimelineEditor({
  initialTitle,
  initialScenes,
  photos,
  onSave,
  onBack,
  isSaving,
}: TimelineEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)
  const selectedScene = scenes.find((s) => s.id === selectedSceneId)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setScenes((items) => {
        const oldIndex = items.findIndex((s) => s.id === active.id)
        const newIndex = items.findIndex((s) => s.id === over.id)
        return arrayMove(items, oldIndex, newIndex).map((s, i) => ({
          ...s,
          order: i,
        }))
      })
    }
  }, [])

  const addScene = (photoId?: string) => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      photo_id: photoId ?? '',
      duration: 3.0,
      caption: '',
      transition: 'fade',
      order: scenes.length,
    }
    setScenes((prev) => [...prev, newScene])
    setSelectedSceneId(newScene.id)
  }

  const removeScene = (id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id))
    if (selectedSceneId === id) setSelectedSceneId(null)
  }

  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const handleSave = () => {
    const content: ScriptContent = {
      scenes: scenes.map((s, i) => ({ ...s, order: i })),
      metadata: { total_duration: totalDuration, bgm: null },
    }
    onSave(title, content)
  }

  const getPhotoForScene = (scene: Scene): Photo | undefined =>
    photos.find((p) => p.id === scene.photo_id)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Input
            id="timeline-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 w-60 border-0 bg-transparent text-base font-semibold focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {totalDuration.toFixed(1)}s · {scenes.length} 场景
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Photo pool sidebar */}
        <div className="w-48 flex-shrink-0 overflow-y-auto border-r border-border bg-muted/30 p-3">
          <PhotoPool photos={photos} onAddToTimeline={addScene} />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          {/* Timeline strip */}
          <div className="flex-shrink-0 border-b border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={scenes.map((s) => s.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {scenes.map((scene) => (
                    <SortableSceneCard
                      key={scene.id}
                      scene={scene}
                      photo={getPhotoForScene(scene)}
                      isSelected={selectedSceneId === scene.id}
                      onClick={() => setSelectedSceneId(scene.id)}
                      onRemove={() => removeScene(scene.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <button
                onClick={() => addScene()}
                className="flex h-24 w-20 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scene detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedScene ? (
              <SceneDetailPanel
                scene={selectedScene}
                photos={photos}
                onChange={(updates) => updateScene(selectedScene.id, updates)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                选择一个场景进行编辑，或从左侧照片池拖入新照片
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
