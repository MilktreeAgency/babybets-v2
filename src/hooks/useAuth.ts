import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    // Only check auth once on mount if not already initialized
    if (!isInitialized) {
      authService.checkAuth()
    }
  }, [isInitialized])

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout: () => authService.logout(),
    refreshAuth: () => authService.refreshAuth(),
  }
}
