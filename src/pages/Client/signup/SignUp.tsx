import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      await authService.signInWithGoogle()
    } catch (error) {
      console.error('Sign-in failed:', error)
      setError('Failed to sign in with Google')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError('')
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
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#FFFCF9' }}>
        <div className="flex min-h-screen items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm border border-[#E2D9CE] rounded-lg p-6 text-center" style={{ backgroundColor: '#FFFCF9' }}>
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="size-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
            <p className="text-muted-foreground">
              Your account has been successfully created. Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#FFFCF9' }}>
      {/* Back button */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={() => navigate('/login')}
          className="size-8 rounded-full hover:bg-black/4 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex min-h-screen items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm border border-[#E2D9CE] rounded-lg p-6" style={{ backgroundColor: '#FFFCF9' }}>
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className="size-6 rounded-md"
                style={{ backgroundColor: '#f25100' }}
                aria-hidden="true"
              />
              <span className="font-semibold text-[17px] tracking-tight">
                babybets
              </span>
            </div>
            <h1 className="text-lg font-semibold text-left">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Join babybets and start winning today!
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Sign-up form */}
          <div className="space-y-4">
            {/* Google Sign-in button */}
            <Button
              variant="outline"
              className="w-full h-9 gap-2.5 border-[#E2D9CE] hover:bg-black/[0.02] text-[14px] cursor-pointer"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="size-4" viewBox="0 0 24 24">
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
              <span className="font-medium">Sign up with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2D9CE]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FFFCF9] px-2 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full h-9 px-3 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full h-9 px-3 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full h-9 px-3 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-9 px-3 pr-10 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full h-9 px-3 pr-10 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-9 bg-[#f25100] hover:bg-[#d94600] text-white text-[14px] cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link
                  to="/login"
                  className="text-[#f25100] hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </form>

            {/* Terms and Privacy */}
            <p className="text-[11px] text-muted-foreground text-center mt-4 max-w-[280px] mx-auto">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="underline hover:text-foreground transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">
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
