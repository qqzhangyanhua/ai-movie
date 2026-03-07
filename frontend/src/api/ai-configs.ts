import apiClient from '@/lib/axios'
import type { UserAiConfig } from '@/types'

export async function getAiConfigs(): Promise<UserAiConfig[]> {
  const { data } = await apiClient.get<UserAiConfig[]>('/ai-configs')
  return data
}

export async function createAiConfig(payload: {
  name: string
  provider: string
  base_url?: string
  api_key: string
  model?: string
  is_default?: boolean
}): Promise<UserAiConfig> {
  const { data } = await apiClient.post<UserAiConfig>('/ai-configs', payload)
  return data
}

export async function updateAiConfig(
  id: string,
  payload: {
    name?: string
    provider?: string
    base_url?: string
    api_key?: string
    model?: string
    is_default?: boolean
  }
): Promise<UserAiConfig> {
  const { data } = await apiClient.put<UserAiConfig>(
    `/ai-configs/${id}`,
    payload
  )
  return data
}

export async function deleteAiConfig(id: string): Promise<void> {
  await apiClient.delete(`/ai-configs/${id}`)
}
