import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack, X, Clock, Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Scene, Photo } from '@/types'

interface ScenePreviewProps {
    scenes: Scene[]
    photos: Photo[]
    onClose: () => void
}

export function ScenePreview({ scenes, photos, onClose }: ScenePreviewProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)

    const photoMap = new Map(photos.map((p) => [p.id, p]))
    const currentScene = scenes[currentIndex]
    const currentPhoto = currentScene ? photoMap.get(currentScene.photo_id) : undefined
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)

    const goNext = useCallback(() => {
        setCurrentIndex((i) => {
            if (i >= scenes.length - 1) {
                setIsPlaying(false)
                return i
            }
            return i + 1
        })
    }, [scenes.length])

    const goPrev = () => {
        setCurrentIndex((i) => Math.max(0, i - 1))
    }

    // Auto-play
    useEffect(() => {
        if (!isPlaying || !currentScene) return
        const timer = setTimeout(goNext, currentScene.duration * 1000)
        return () => clearTimeout(timer)
    }, [isPlaying, currentIndex, currentScene, goNext])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext()
            else if (e.key === 'ArrowLeft') goPrev()
            else if (e.key === ' ') {
                e.preventDefault()
                setIsPlaying((p) => !p)
            } else if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [goNext, onClose])

    if (scenes.length === 0) return null

    const progressPct =
        scenes.slice(0, currentIndex).reduce((s, sc) => s + sc.duration, 0) / totalDuration * 100

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white/70">
                        场景预览
                    </span>
                    <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                        {currentIndex + 1} / {scenes.length}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10 relative">
                <motion.div
                    className="absolute h-full bg-primary"
                    animate={{ width: `${progressPct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                {/* Scene markers */}
                <div className="absolute inset-0 flex">
                    {scenes.map((scene, i) => {
                        const leftPct = scenes.slice(0, i).reduce((s, sc) => s + sc.duration, 0) / totalDuration * 100
                        return (
                            <button
                                key={scene.id}
                                className="absolute top-0 h-full w-px bg-white/20 hover:bg-white/50 cursor-pointer"
                                style={{ left: `${leftPct}%` }}
                                onClick={() => setCurrentIndex(i)}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden px-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="relative max-w-4xl w-full aspect-video rounded-2xl overflow-hidden shadow-2xl"
                    >
                        {currentPhoto ? (
                            <img
                                src={`/uploads/${currentPhoto.file_path}`}
                                alt={currentScene?.caption || '场景照片'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <p className="text-white/30 text-sm">未关联照片</p>
                            </div>
                        )}

                        {/* Caption overlay */}
                        {currentScene?.caption && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-6 px-8"
                            >
                                <p className="text-white text-lg font-medium text-center drop-shadow-lg">
                                    {currentScene.caption}
                                </p>
                            </motion.div>
                        )}

                        {/* Transition badge */}
                        {currentScene?.transition && (
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/70">
                                转场: {currentScene.transition}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="px-6 py-5 bg-black/50 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-xs text-white/40 mr-4">
                    <Clock className="h-3.5 w-3.5" />
                    {currentScene?.duration}s
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                >
                    <SkipBack className="h-4 w-4" />
                </Button>

                <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goNext}
                    disabled={currentIndex >= scenes.length - 1}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                >
                    <SkipForward className="h-4 w-4" />
                </Button>

                {currentScene?.caption && (
                    <div className="flex items-center gap-1.5 text-xs text-white/40 ml-4">
                        <Type className="h-3.5 w-3.5" />
                        字幕
                    </div>
                )}
            </div>
        </motion.div>
    )
}
