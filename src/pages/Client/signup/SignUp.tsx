import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { showErrorToast } from '@/lib/toast'

export default function SignUp() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle()
    } catch (error) {
      console.error('Sign-in failed:', error)
      showErrorToast('Failed to sign in with Google')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword) {
      showErrorToast('Please fill in all required fields')
      return
    }

    if (password.length < 6) {
      showErrorToast('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      showErrorToast('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      await authService.signUpWithEmail(email, password, firstName, lastName)
      setSuccess(true)
      // Wait 2 seconds before redirecting to show success message
      setTimeout(() => {
        const user = useAuthStore.getState().user
        // Redirect based on user role
        if (user?.isAdmin) {
          navigate('/admin/dashboard')
        } else {
          navigate('/')
        }
      }, 2000)
    } catch (error) {
      console.error('Sign-up failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="antialiased relative min-h-screen" style={{ color: '#151e20', backgroundColor: '#fffbf7' }}>
        {/* Background decorative elements */}
        <div
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full blur-3xl -z-10"
          style={{ backgroundColor: 'rgba(254, 208, 185, 0.3)' }}
        />
        <div
          className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] rounded-full blur-3xl -z-10"
          style={{ backgroundColor: 'rgba(225, 234, 236, 0.3)' }}
        />

        <div className="flex min-h-screen items-center justify-center px-6 py-12">
          <div
            className="w-full max-w-md rounded-2xl p-10 text-center"
            style={{
              backgroundColor: '#fffbf7',
              borderWidth: '2px',
              borderColor: '#e7e5e4'
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            >
              <svg className="w-10 h-10" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Account Created!
            </h2>
            <p className="text-base" style={{ color: '#78716c' }}>
              Your account has been successfully created. Redirecting you to the homepage...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#151e20', backgroundColor: '#fffbf7' }}>
      {/* Background decorative elements */}
      <div
        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(254, 208, 185, 0.3)' }}
      />
      <div
        className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(225, 234, 236, 0.3)' }}
      />

      {/* Back button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => navigate('/login')}
          className="p-2.5 rounded-xl hover:bg-white/80 flex items-center justify-center transition-all cursor-pointer"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', color: '#151e20', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-md rounded-2xl p-8 md:p-10"
          style={{
            backgroundColor: '#fffbf7',
            borderWidth: '2px',
            borderColor: '#e7e5e4'
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/babybets-logo.png"
                alt="BabyBets Logo"
                className="h-12"
              />
            </div>
            <h1
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Create account
            </h1>
            <p className="text-base" style={{ color: '#78716c' }}>
              Join babybets and start winning today
            </p>
          </div>

          {/* Sign-up form */}
          <div className="space-y-5">
            {/* Google Sign-in button */}
            <button
              className="w-full px-6 py-4 rounded-xl font-bold text-base transition-all cursor-pointer flex items-center justify-center gap-3"
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
              <span>Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid #e7e5e4' }}></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold">
                <span className="px-3 text-sm" style={{ backgroundColor: '#fffbf7', color: '#78716c' }}>
                  Or sign up with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-xl text-base transition-all cursor-pointer"
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
                  <label htmlFor="lastName" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-xl text-base transition-all cursor-pointer"
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
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl text-base transition-all cursor-pointer"
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
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-base transition-all cursor-pointer"
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
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: '#78716c' }}
                    tabIndex={-1}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#151e20'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#78716c'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Confirm password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-base transition-all cursor-pointer"
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
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: '#78716c' }}
                    tabIndex={-1}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#151e20'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#78716c'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 rounded-xl font-bold text-base transition-all"
                style={{
                  backgroundColor: !email || !password || !confirmPassword ? '#d1d5db' : '#496B71',
                  color: 'white',
                  cursor: !email || !password || !confirmPassword || loading ? 'not-allowed' : 'pointer',
                  opacity: !email || !password || !confirmPassword ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (email && password && confirmPassword && !loading) {
                    e.currentTarget.style.backgroundColor = '#3a565a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (email && password && confirmPassword) {
                    e.currentTarget.style.backgroundColor = '#496B71'
                  }
                }}
                disabled={loading || !email || !password || !confirmPassword}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <div className="text-center text-base pt-2">
                <span style={{ color: '#78716c' }}>Already have an account? </span>
                <Link
                  to="/login"
                  className="font-bold cursor-pointer"
                  style={{ color: '#496B71' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign in
                </Link>
              </div>
            </form>

            {/* Terms and Privacy */}
            <p className="text-xs text-center mt-6" style={{ color: '#78716c' }}>
              By creating an account, you agree to our{' '}
              <a
                href="/terms"
                className="font-bold underline cursor-pointer"
                style={{ color: '#496B71' }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="font-bold underline cursor-pointer"
                style={{ color: '#496B71' }}
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
