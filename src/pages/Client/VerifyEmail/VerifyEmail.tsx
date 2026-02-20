import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // The token is automatically handled by Supabase in the URL
        // When user clicks the verification link, Supabase handles the verification
        // We just need to check if the session is now active

        // Wait a moment for Supabase to process the verification
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if auth session is valid
        await authService.checkAuth()

        showSuccessToast('Email verified successfully!')

        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } catch (err) {
        console.error('Email verification failed:', err)
        setError(true)
        showErrorToast('Email verification failed. The link may have expired.')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [])

  if (loading) {
    return (
      <div className="antialiased relative min-h-screen overflow-hidden" style={{ color: '#151e20', backgroundColor: '#fffbf7' }}>
        {/* Background decorative elements */}
        <div
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl -z-10"
          style={{ backgroundColor: 'rgba(254, 208, 185, 0.3)' }}
        />
        <div
          className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl -z-10"
          style={{ backgroundColor: 'rgba(225, 234, 236, 0.3)' }}
        />

        <div className="flex h-screen items-center justify-center px-4 sm:px-6">
          <div
            className="w-full max-w-md rounded-2xl p-8 sm:p-10 text-center border-0 lg:border-2"
            style={{
              backgroundColor: '#fffbf7',
              borderColor: '#e7e5e4'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: '#496B71' }}></div>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Verifying your email
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="antialiased relative min-h-screen overflow-hidden" style={{ color: '#151e20', backgroundColor: '#fffbf7' }}>
        {/* Background decorative elements */}
        <div
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl -z-10"
          style={{ backgroundColor: 'rgba(254, 208, 185, 0.3)' }}
        />
        <div
          className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl -z-10"
          style={{ backgroundColor: 'rgba(225, 234, 236, 0.3)' }}
        />

        <div className="flex h-screen items-center justify-center px-4 sm:px-6">
          <div
            className="w-full max-w-md rounded-2xl p-8 sm:p-10 text-center border-0 lg:border-2"
            style={{
              backgroundColor: '#fffbf7',
              borderColor: '#e7e5e4'
            }}
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Verification Failed
            </h2>
            <p className="text-sm sm:text-base mb-6" style={{ color: '#78716c' }}>
              The verification link may have expired or is invalid. Please try signing up again or contact support.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer"
              style={{
                backgroundColor: '#496B71',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3a565a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#496B71'
              }}
            >
              Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="antialiased relative min-h-screen overflow-hidden" style={{ color: '#151e20', backgroundColor: '#fffbf7' }}>
      {/* Background decorative elements */}
      <div
        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(254, 208, 185, 0.3)' }}
      />
      <div
        className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(225, 234, 236, 0.3)' }}
      />

      <div className="flex h-screen items-center justify-center px-4 sm:px-6">
        <div
          className="w-full max-w-md rounded-2xl p-8 sm:p-10 text-center border-0 lg:border-2"
          style={{
            backgroundColor: '#fffbf7',
            borderColor: '#e7e5e4'
          }}
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3"
            style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
          >
            Email Verified!
          </h2>
          <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
            Your email has been successfully verified. Redirecting you to the homepage...
          </p>
        </div>
      </div>
    </div>
  )
}
