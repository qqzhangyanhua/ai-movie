import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, Upload, Trash2, CheckCircle2, Music } from 'lucide-react'
import { getBgmList, uploadBgm, deleteBgm } from '@/api/bgm'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { BgmTrack } from '@/types'

const CATEGORIES = [
    { value: '', label: '全部' },
    { value: 'relaxed', label: '轻松' },
    { value: 'tense', label: '紧张' },
    { value: 'romantic', label: '浪漫' },
    { value: 'cheerful', label: '欢快' },
]

export function BgmPicker({
    selectedBgmId,
    onSelect,
}: {
    selectedBgmId?: string | null
    onSelect: (id: string | null) => void
}) {
    const queryClient = useQueryClient()
    const [category, setCategory] = useState('')
    const [playingId, setPlayingId] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: bgmList = [], isLoading } = useQuery({
        queryKey: ['bgm-list'],
        queryFn: getBgmList,
    })

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
                audioRef.current = null
            }
        }
    }, [])

    const uploadMut = useMutation({
        mutationFn: (file: File) => uploadBgm(file, file.name.replace(/\.[^/.]+$/, '')),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bgm-list'] })
            toast.success('上传成功')
        },
        onError: () => toast.error('上传失败，请重试'),
    })

    const deleteMut = useMutation({
        mutationFn: deleteBgm,
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['bgm-list'] })
            if (selectedBgmId === id) onSelect(null)
            if (playingId === id) {
                audioRef.current?.pause()
                setPlayingId(null)
            }
            toast.success('删除成功')
        },
    })

    const handlePlay = (e: React.MouseEvent, bgm: BgmTrack) => {
        e.stopPropagation()
        if (playingId === bgm.id) {
            audioRef.current?.pause()
            setPlayingId(null)
            return
        }

        if (audioRef.current) {
            audioRef.current.pause()
        }

        // Usually uploaded files served dynamically
        const url = `/uploads/${bgm.file_path}`
        const audio = new Audio(url)
        audio.onended = () => setPlayingId(null)
        audio.play().catch(() => toast.error('音频播放失败'))
        audioRef.current = audio
        setPlayingId(bgm.id)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('audio/')) {
            toast.error('请上传音频文件')
            return
        }
        if (file.size > 20 * 1024 * 1024) {
            toast.error('音频文件不能超过 20MB')
            return
        }
        uploadMut.mutate(file)
        e.target.value = ''
    }

    const filteredList = bgmList.filter(
        (bgm) => !category || bgm.category === category
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" />
                    背景音乐
                </h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMut.isPending}
                    >
                        <Upload className="h-3 w-3" />
                        {uploadMut.isPending ? '上传中...' : '上传音乐'}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="audio/*"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                            'px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300',
                            category === cat.value
                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                                : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                        加载中...
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="col-span-full py-12 text-center rounded-3xl border border-white/10 border-dashed bg-[#111111]/30">
                        <p className="text-sm text-muted-foreground font-light">暂无相关背景音乐</p>
                    </div>
                ) : (
                    filteredList.map((bgm) => (
                        <div
                            key={bgm.id}
                            onClick={() => onSelect(selectedBgmId === bgm.id ? null : bgm.id)}
                            className={cn(
                                'group flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm',
                                selectedBgmId === bgm.id
                                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                    : 'border-white/5 bg-[#111111]/80 hover:border-white/20 hover:bg-[#151515]'
                            )}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={(e) => handlePlay(e, bgm)}
                                    className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                                        playingId === bgm.id
                                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                                            : 'bg-white/10 text-white group-hover:bg-primary group-hover:text-primary-foreground'
                                    )}
                                >
                                    {playingId === bgm.id ? (
                                        <Pause className="h-3.5 w-3.5" />
                                    ) : (
                                        <Play className="h-3.5 w-3.5 ml-0.5" />
                                    )}
                                </button>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate pr-2">
                                        {bgm.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {bgm.duration ? `${bgm.duration}s` : '未知时长'}
                                        {bgm.is_system && ' · 系统'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {!bgm.is_system && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm('确定删除此音乐？')) {
                                                deleteMut.mutate(bgm.id)
                                            }
                                        }}
                                        className="p-2 text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-full"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                {selectedBgmId === bgm.id ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border border-white/20 group-hover:border-white/40 transition-colors" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
