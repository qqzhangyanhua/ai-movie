import apiClient from '@/lib/axios'
import type { Script, ScriptContent } from '@/types'

export async function getScripts(projectId?: string): Promise<Script[]> {
  const params = projectId ? { project_id: projectId } : {}
  const { data } = await apiClient.get<Script[]>('/scripts', { params })
  return data
}

export async function getScript(id: string): Promise<Script> {
  const { data } = await apiClient.get<Script>(`/scripts/${id}`)
  return data
}

export async function createScript(payload: {
  project_id?: string
  title: string
  content: ScriptContent
  description?: string
}): Promise<Script> {
  const { data } = await apiClient.post<Script>('/scripts', payload)
  return data
}

export async function updateScript(
  id: string,
  payload: {
    title?: string
    content?: ScriptContent
    description?: string
  }
): Promise<Script> {
  const { data } = await apiClient.put<Script>(`/scripts/${id}`, payload)
  return data
}

export async function deleteScript(id: string): Promise<void> {
  await apiClient.delete(`/scripts/${id}`)
}

export async function saveAsTemplate(id: string): Promise<Script> {
  const { data } = await apiClient.post<Script>(`/scripts/${id}/save-template`)
  return data
}

export async function publishToCommmunity(id: string): Promise<Script> {
  const { data } = await apiClient.post<Script>(`/scripts/${id}/publish`)
  return data
}

export async function getTemplates(params?: {
  source_type?: string
  search?: string
}): Promise<Script[]> {
  const { data } = await apiClient.get<Script[]>('/scripts/templates', {
    params,
  })
  return data
}

export async function getCommunityTemplates(params?: {
  search?: string
  category?: string
  sort_by?: string
}): Promise<Script[]> {
  const { data } = await apiClient.get<Script[]>('/scripts/community', {
    params,
  })
  return data
}

export async function cloneTemplate(
  templateId: string,
  projectId: string
): Promise<Script> {
  const { data } = await apiClient.post<Script>(
    `/scripts/${templateId}/clone`,
    { project_id: projectId }
  )
  return data
}

export async function generateScript(payload: {
  project_id: string
  description: string
  photo_ids?: string[]
  ai_config_id: string
}): Promise<Script> {
  const { data } = await apiClient.post<Script>('/scripts/generate', payload)
  return data
}
