import apiClient from '@/lib/axios'
import type { Project } from '@/types'

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>('/projects')
  return data
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${id}`)
  return data
}

export async function createProject(payload: {
  name: string
  description?: string
}): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects', payload)
  return data
}

export async function updateProject(
  id: string,
  payload: { name?: string; description?: string }
): Promise<Project> {
  const { data } = await apiClient.put<Project>(`/projects/${id}`, payload)
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`)
}
