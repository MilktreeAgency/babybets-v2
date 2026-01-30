import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      await authService.signInWithGoogle()
    } catch (error) {
      console.error('Sign-in failed:', error)
      setError('Failed to sign in with Google')
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    try {
      setLoading(true)
      setError('')
      await authService.signInWithEmail(email, password)

      // Redirect based on user role
      const user = useAuthStore.getState().user
      if (user?.isAdmin) {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Sign-in failed:', error)
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#FFFCF9' }}>
      {/* Back button */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={() => navigate('/')}
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
            <h1 className="text-lg font-semibold text-left">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Sign-in form */}
          <div className="space-y-4">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-9 px-3 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-9 px-3 pr-10 border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f25100] focus:border-transparent text-[14px]"
                    disabled={loading}
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

              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/signup"
                  className="text-[#f25100] hover:underline font-medium"
                >
                  Create account
                </Link>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-9 bg-[#f25100] hover:bg-[#d94600] text-white text-[14px] cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2D9CE]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FFFCF9] px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

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
              <span className="font-medium">Google</span>
            </Button>

            {/* Terms and Privacy */}
            <p className="text-[11px] text-muted-foreground text-center mt-4 max-w-[280px] mx-auto">
              By continuing, you agree to our{' '}
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
