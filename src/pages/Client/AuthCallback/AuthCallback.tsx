import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import { emailService } from '@/services/email.service'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const handleCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data: sessionData, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login', { replace: true })
          return
        }

        const session = sessionData.session
        const supabaseUser = session?.user

        // Check if this is a new user (account created in last 10 seconds)
        const isNewUser = supabaseUser && supabaseUser.created_at &&
          (new Date().getTime() - new Date(supabaseUser.created_at).getTime()) < 10000

        // Refresh authentication status
        await authService.refreshAuth()

        // Send welcome email for new OAuth users (non-blocking)
        if (isNewUser && supabaseUser?.email) {
          const userName = supabaseUser.user_metadata?.full_name ||
                          supabaseUser.user_metadata?.name ||
                          supabaseUser.email.split('@')[0]

          emailService.sendWelcomeEmail(supabaseUser.email, userName, {
            competitionsUrl: `${window.location.origin}/competitions`
          }).catch(err => {
            console.error('Failed to send welcome email:', err)
          })
        }

        // Get the updated user from the store
        const { user } = useAuthStore.getState()

        // Redirect based on admin status
        if (user?.isAdmin) {
          navigate('/admin/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
