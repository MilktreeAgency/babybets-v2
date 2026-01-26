import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

class AuthService {
  private isChecking = false

  async checkAuth(): Promise<void> {
    if (this.isChecking) {
      return
    }

    const { isInitialized } = useAuthStore.getState()

    if (isInitialized) {
      return
    }

    try {
      this.isChecking = true
      useAuthStore.getState().setLoading(true)

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth check error:', error)
        useAuthStore.getState().setUser(null)
      } else if (session?.user) {
        const userRole = session.user.user_metadata?.role
        console.log('🔍 User metadata:', session.user.user_metadata)
        console.log('🔍 User role:', userRole)
        console.log('🔍 Is admin?', userRole === 'admin' || userRole === 'super_admin')

        const user = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          avatar: session.user.user_metadata?.avatar_url || null,
          googleId: session.user.user_metadata?.sub || '',
          isAdmin: userRole === 'admin' || userRole === 'super_admin',
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || session.user.created_at,
        }

        console.log('✅ Final user object:', user)
        useAuthStore.getState().setUser(user)
      } else {
        useAuthStore.getState().setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      useAuthStore.getState().setUser(null)
    } finally {
      useAuthStore.getState().setLoading(false)
      useAuthStore.getState().setInitialized(true)
      this.isChecking = false
    }
  }

  async refreshAuth(): Promise<void> {
    try {
      useAuthStore.getState().setLoading(true)

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth refresh error:', error)
        useAuthStore.getState().setUser(null)
      } else if (session?.user) {
        const userRole = session.user.user_metadata?.role
        console.log('🔍 User metadata:', session.user.user_metadata)
        console.log('🔍 User role:', userRole)
        console.log('🔍 Is admin?', userRole === 'admin' || userRole === 'super_admin')

        const user = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          avatar: session.user.user_metadata?.avatar_url || null,
          googleId: session.user.user_metadata?.sub || '',
          isAdmin: userRole === 'admin' || userRole === 'super_admin',
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || session.user.created_at,
        }

        console.log('✅ Final user object:', user)
        useAuthStore.getState().setUser(user)
      } else {
        useAuthStore.getState().setUser(null)
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      useAuthStore.getState().setUser(null)
    } finally {
      useAuthStore.getState().setLoading(false)
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Google sign-in error:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign-in error:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
      useAuthStore.getState().signOut()
    } catch (error) {
      console.error('Logout error:', error)
      useAuthStore.getState().signOut()
    }
  }
}

export const authService = new AuthService()
