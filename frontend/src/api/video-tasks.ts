import apiClient from '@/lib/axios'
import type { VideoTask } from '@/types'

export async function createVideoTask(payload: {
  project_id: string
  script_id: string
  ai_config_id: string
}): Promise<VideoTask> {
  const { data } = await apiClient.post<VideoTask>('/video-tasks', payload)
  return data
}

export async function getVideoTask(id: string): Promise<VideoTask> {
  const { data } = await apiClient.get<VideoTask>(`/video-tasks/${id}`)
  return data
}

export async function getVideoTasks(projectId: string): Promise<VideoTask[]> {
  const { data } = await apiClient.get<VideoTask[]>('/video-tasks', {
    params: { project_id: projectId },
  })
  return data
}

export async function cancelVideoTask(id: string): Promise<void> {
  await apiClient.post(`/video-tasks/${id}/cancel`)
}

export async function retryVideoTask(id: string): Promise<VideoTask> {
  const { data } = await apiClient.post<VideoTask>(`/video-tasks/${id}/retry`)
  return data
}

