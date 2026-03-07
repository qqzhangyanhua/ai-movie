import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  postLoginAction?: () => void
  setUser: (user: User | null) => void
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  setAuthModalOpen: (open: boolean) => void
  setPostLoginAction: (action?: () => void) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isAuthModalOpen: false,
  postLoginAction: undefined,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  setPostLoginAction: (action) => set({ postLoginAction: action }),
}))
