import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { useAuthStore } from '@/store/authStore'
import { showErrorToast } from '@/lib/toast'
import {
  clearOAuthFlow,
  clearSignupConsentFromStorage,
  consumeLoginOAuthIntent,
  getPendingSignupMarketingConsent,
  hasSignupTermsAcceptance,
  isOAuthSignupFlow,
  isRecentlyCreatedAuthUser,
} from '@/lib/signupConsent'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const handleCallback = async () => {
      const isSignupFlow = isOAuthSignupFlow(searchParams)
      clearOAuthFlow()

      try {
        // PKCE: exchange ?code= for a session (getSession alone can miss it on first load)
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('OAuth code exchange error:', exchangeError)
            clearSignupConsentFromStorage()
            navigate('/login', { replace: true })
            return
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session?.user) {
          console.error('Auth callback error:', error)
          clearSignupConsentFromStorage()
          navigate('/login', { replace: true })
          return
        }

        const isNewUser = isRecentlyCreatedAuthUser(session.user.created_at)
        const fromLoginPage = consumeLoginOAuthIntent()

        // Sign-up only: require terms for new Google accounts
        if (isSignupFlow && isNewUser && !hasSignupTermsAcceptance(searchParams)) {
          clearSignupConsentFromStorage()
          await authService.cancelRecentOAuthSignup()
          showErrorToast('Please accept the Terms & Conditions and Privacy Policy to create an account.')
          navigate('/signup', { replace: true })
          return
        }

        await authService.refreshAuth()

        const { user } = useAuthStore.getState()

        if (user?.id) {
          try {
            if (isSignupFlow) {
              const pendingMarketingConsent = getPendingSignupMarketingConsent()
              if (pendingMarketingConsent !== null) {
                await profileService.updateProfile(user.id, {
                  marketing_email: pendingMarketingConsent,
                  marketing_sms: pendingMarketingConsent,
                })
              }
            } else if (fromLoginPage && isNewUser) {
              await profileService.ensureLoginOAuthMarketingDefaults(user.id)
            }
          } catch (consentError) {
            console.error('Failed to save communication preferences:', consentError)
          }
        }

        clearSignupConsentFromStorage()

        if (user?.isAdmin) {
          navigate('/admin/dashboard', { replace: true })
        } else if (user?.isInfluencer) {
          navigate('/account', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        clearSignupConsentFromStorage()
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
