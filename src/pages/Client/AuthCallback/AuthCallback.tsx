import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { useAuthStore } from '@/store/authStore'
import { showErrorToast } from '@/lib/toast'
import {
  clearOAuthFlow,
  clearSignupConsentFromStorage,
  getOAuthFlow,
  getPendingSignupMarketingConsent,
  hasPendingSignupTermsAcceptance,
  isRecentlyCreatedAuthUser,
} from '@/lib/signupConsent'

export default function AuthCallback() {
  const navigate = useNavigate()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const handleCallback = async () => {
      const oauthFlow = getOAuthFlow()
      clearOAuthFlow()

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session?.user) {
          console.error('Auth callback error:', error)
          clearSignupConsentFromStorage()
          navigate('/login', { replace: true })
          return
        }

        const isNewUser = isRecentlyCreatedAuthUser(session.user.created_at)
        const isSignupFlow = oauthFlow === 'signup'

        // Login page: do not allow Google to auto-register new users
        if (!isSignupFlow && isNewUser) {
          clearSignupConsentFromStorage()
          await authService.cancelRecentOAuthSignup()
          navigate('/login?error=no_account', { replace: true })
          return
        }

        // Sign-up page: require terms consent for new Google accounts
        if (isSignupFlow && isNewUser && !hasPendingSignupTermsAcceptance()) {
          clearSignupConsentFromStorage()
          await authService.cancelRecentOAuthSignup()
          showErrorToast('Please accept the Terms & Conditions and Privacy Policy to create an account.')
          navigate('/signup', { replace: true })
          return
        }

        await authService.refreshAuth()

        const { user } = useAuthStore.getState()

        const pendingMarketingConsent = getPendingSignupMarketingConsent()
        if (user?.id && pendingMarketingConsent !== null) {
          try {
            await profileService.updateProfile(user.id, {
              marketing_email: pendingMarketingConsent,
              marketing_sms: pendingMarketingConsent,
            })
          } catch (consentError) {
            console.error('Failed to save signup marketing preferences:', consentError)
          } finally {
            clearSignupConsentFromStorage()
          }
        } else if (!isSignupFlow) {
          clearSignupConsentFromStorage()
        }

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
