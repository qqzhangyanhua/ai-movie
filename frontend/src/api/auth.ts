import apiClient from '@/lib/axios'
import type { AuthTokens, User } from '@/types'

export async function loginApi(email: string, password: string): Promise<AuthTokens> {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)
  const { data } = await apiClient.post<AuthTokens>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function registerApi(
  email: string,
  username: string,
  password: string
): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', {
    email,
    username,
    password,
  })
  return data
}

export async function getMeApi(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me')
  return data
}

export async function refreshTokenApi(refreshToken: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  return data
}
