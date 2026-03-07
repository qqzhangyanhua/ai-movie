import apiClient from '@/lib/axios'
import type { Photo } from '@/types'

export async function getPhotos(projectId: string): Promise<Photo[]> {
  const { data } = await apiClient.get<Photo[]>(
    `/projects/${projectId}/photos`
  )
  return data
}

export async function uploadPhotos(
  projectId: string,
  files: File[]
): Promise<Photo[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const { data } = await apiClient.post<Photo[]>(
    `/projects/${projectId}/photos`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function deletePhoto(
  projectId: string,
  photoId: string
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/photos/${photoId}`)
}

export async function reorderPhotos(
  projectId: string,
  photoIds: string[]
): Promise<void> {
  await apiClient.put(`/projects/${projectId}/photos/reorder`, {
    photo_ids: photoIds,
  })
}
