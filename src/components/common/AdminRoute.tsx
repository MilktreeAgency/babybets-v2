import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuthStore()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to homepage if authenticated but not an admin
  if (!user.isAdmin) {
    return <Navigate to="/" replace />
  }

  // Render children if authenticated and admin
  return <>{children}</>
}
