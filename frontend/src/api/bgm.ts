import apiClient from '@/lib/axios'
import type { BgmTrack } from '@/types'

export async function getBgmList(): Promise<BgmTrack[]> {
    const { data } = await apiClient.get<BgmTrack[]>('/bgm')
    return data
}

export async function uploadBgm(
    file: File,
    name: string,
    category?: string,
    duration: number = 0
): Promise<BgmTrack> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    if (category) formData.append('category', category)
    formData.append('duration', duration.toString())

    const { data } = await apiClient.post<BgmTrack>('/bgm', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
}

export async function deleteBgm(id: string): Promise<void> {
    await apiClient.delete(`/bgm/${id}`)
}
