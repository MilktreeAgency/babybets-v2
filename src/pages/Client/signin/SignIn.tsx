import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { showErrorToast } from '@/lib/toast'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle()
    } catch (error) {
      console.error('Sign-in failed:', error)
      showErrorToast('Failed to sign in with Google')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetEmail) {
      showErrorToast('Please enter your email address')
      return
    }

    try {
      setResetLoading(true)
      await authService.resetPassword(resetEmail)
      setResetSuccess(true)
    } catch (error) {
      console.error('Password reset failed:', error)
      showErrorToast('Failed to send reset email. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      showErrorToast('Please enter your email and password')
      return
    }

    try {
      setLoading(true)
      await authService.signInWithEmail(email, password)

      // Redirect based on user role using hard navigation
      const user = useAuthStore.getState().user
      if (user?.isAdmin) {
        window.location.href = '/admin/dashboard'
      } else if (user?.isInfluencer) {
        window.location.href = '/account'
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign-in failed:', error)
      showErrorToast('Invalid email or password')
    } finally {
      setLoading(false)
    }
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

      {/* Back button */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
        <button
          onClick={() => navigate('/')}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-white/80 flex items-center justify-center transition-all cursor-pointer"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', color: '#151e20', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex h-screen items-center justify-center px-4 sm:px-6">
        <div
          className="w-full max-w-md rounded-2xl p-6 sm:p-8 md:p-10 border-0 lg:border-2"
          style={{
            backgroundColor: '#fffbf7',
            borderColor: '#e7e5e4'
          }}
        >
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <img
                src="/babybets-logo.png"
                alt="BabyBets Logo"
                className="h-10 sm:h-12"
              />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Welcome back
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
              Sign in to continue to your account
            </p>
          </div>

          {/* Sign-in form */}
          <div className="space-y-4 sm:space-y-5">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base transition-all cursor-pointer"
                  style={{
                    borderWidth: '2px',
                    borderColor: '#e7e5e4',
                    backgroundColor: '#fffbf7',
                    color: '#151e20'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#496B71'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e7e5e4'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 rounded-xl text-sm sm:text-base transition-all cursor-pointer"
                    style={{
                      borderWidth: '2px',
                      borderColor: '#e7e5e4',
                      backgroundColor: '#fffbf7',
                      color: '#151e20'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#496B71'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e7e5e4'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: '#78716c' }}
                    tabIndex={-1}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#151e20'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#78716c'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm pt-1">
                <Link
                  to="/signup"
                  className="font-bold cursor-pointer"
                  style={{ color: '#496B71' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Create account
                </Link>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-medium cursor-pointer"
                  style={{ color: '#78716c' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#151e20'
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#78716c'
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: !email || !password ? '#d1d5db' : '#496B71',
                  color: 'white',
                  cursor: !email || !password || loading ? 'not-allowed' : 'pointer',
                  opacity: !email || !password ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (email && password && !loading) {
                    e.currentTarget.style.backgroundColor = '#3a565a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (email && password) {
                    e.currentTarget.style.backgroundColor = '#496B71'
                  }
                }}
                disabled={loading || !email || !password}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid #e7e5e4' }}></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold">
                <span className="px-3 text-xs sm:text-sm" style={{ backgroundColor: '#fffbf7', color: '#78716c' }}>
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-in button */}
            <button
              className="w-full px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-3"
              style={{
                backgroundColor: 'transparent',
                color: '#151e20',
                borderWidth: '2px',
                borderColor: '#e7e5e4'
              }}
              onClick={handleGoogleSignIn}
              disabled={loading}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Terms and Privacy */}
            <p className="text-[10px] sm:text-xs text-center mt-5 sm:mt-6 leading-relaxed" style={{ color: '#78716c' }}>
              By continuing, you agree to our{' '}
              <Link
                to="/legal/terms"
                className="font-bold underline cursor-pointer"
                style={{ color: '#496B71' }}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/legal/privacy"
                className="font-bold underline cursor-pointer"
                style={{ color: '#496B71' }}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => {
            setShowForgotPassword(false)
            setResetSuccess(false)
            setResetEmail('')
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 sm:p-8"
            style={{
              backgroundColor: '#fffbf7',
              borderWidth: '2px',
              borderColor: '#e7e5e4'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {resetSuccess ? (
              <div className="text-center">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold mb-3"
                  style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                >
                  Check your email
                </h2>
                <p className="text-sm sm:text-base mb-6" style={{ color: '#78716c' }}>
                  We've sent password reset instructions to <span className="font-bold" style={{ color: '#151e20' }}>{resetEmail}</span>
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetSuccess(false)
                    setResetEmail('')
                  }}
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
                  Got it
                </button>
              </div>
            ) : (
              <>
                <h2
                  className="text-xl sm:text-2xl font-bold mb-2"
                  style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                >
                  Reset your password
                </h2>
                <p className="text-sm sm:text-base mb-6" style={{ color: '#78716c' }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                      Email address
                    </label>
                    <input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base transition-all cursor-pointer"
                      style={{
                        borderWidth: '2px',
                        borderColor: '#e7e5e4',
                        backgroundColor: '#fffbf7',
                        color: '#151e20'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#496B71'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e7e5e4'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      disabled={resetLoading}
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setResetEmail('')
                      }}
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#151e20',
                        borderWidth: '2px',
                        borderColor: '#e7e5e4'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      disabled={resetLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: !resetEmail ? '#d1d5db' : '#496B71',
                        color: 'white',
                        cursor: !resetEmail || resetLoading ? 'not-allowed' : 'pointer',
                        opacity: !resetEmail ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (resetEmail && !resetLoading) {
                          e.currentTarget.style.backgroundColor = '#3a565a'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (resetEmail) {
                          e.currentTarget.style.backgroundColor = '#496B71'
                        }
                      }}
                      disabled={resetLoading || !resetEmail}
                    >
                      {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {resetLoading ? 'Sending...' : 'Send reset link'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
