import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('should initialize with no user', () => {
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('should login user', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date().toISOString(),
    }

    useAuthStore.getState().login(mockUser, 'access_token', 'refresh_token')

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
    expect(isAuthenticated).toBe(true)
    expect(localStorage.getItem('access_token')).toBe('access_token')
  })

  it('should logout user', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date().toISOString(),
    }

    useAuthStore.getState().login(mockUser, 'access_token', 'refresh_token')
    useAuthStore.getState().logout()

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})
