import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, Trash2, ImageIcon } from 'lucide-react'
import { getPhotos, uploadPhotos, deletePhoto } from '@/api/photos'
import { Button } from '@/components/ui/Button'

interface PhotosPanelProps {
  projectId: string
}

export function PhotosPanel({ projectId }: PhotosPanelProps) {
  const queryClient = useQueryClient()

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', projectId],
    queryFn: () => getPhotos(projectId),
  })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadPhotos(projectId, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos', projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deletePhoto(projectId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos', projectId] }),
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      uploadMutation.mutate(acceptedFiles)
    },
    [uploadMutation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">照片管理</h2>
        <span className="text-sm text-muted-foreground">
          {photos.length} / 50 张
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`mb-6 cursor-pointer rounded-3xl border border-dashed p-8 text-center transition-all duration-300 ${isDragActive
            ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
            : 'border-white/10 bg-[#111111]/30 hover:border-white/30 hover:bg-[#111111]/50'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        {uploadMutation.isPending ? (
          <p className="text-sm text-muted-foreground">上传中...</p>
        ) : isDragActive ? (
          <p className="text-sm text-primary">拖放照片到这里</p>
        ) : (
          <>
            <p className="text-sm font-medium">拖放照片或点击上传</p>
            <p className="mt-1 text-xs text-muted-foreground">
              支持 JPG、PNG、WebP，单文件最大 10MB
            </p>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">加载中...</div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 border-dashed bg-[#111111]/30 py-16">
          <ImageIcon className="mb-4 h-10 w-10 text-white/20" />
          <p className="text-sm text-muted-foreground font-light">还没有上传照片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-2xl border border-white/10 shadow-lg">
              <img
                src={photo.thumb_url || photo.file_url || `/uploads/${photo.thumbnail_path ?? photo.file_path}`}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex w-full items-center justify-between p-2">
                  <span className="text-xs text-white">
                    {photo.width}x{photo.height}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (confirm('确定删除这张照片？'))
                        deleteMutation.mutate(photo.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
