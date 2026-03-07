import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { getMeApi } from '@/api/auth'

export function useAuth() {
  const { isAuthenticated, setUser } = useAuthStore()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const userData = await getMeApi()
      setUser(userData)
      return userData
    },
    enabled: isAuthenticated,
    retry: false,
  })

  return { user, isLoading, isAuthenticated }
}
