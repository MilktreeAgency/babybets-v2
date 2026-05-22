import type { AuthError } from '@supabase/supabase-js'

type AuthErrorContext = 'signIn' | 'signUp' | 'resetPassword'

function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AuthError).message === 'string'
  )
}

function getErrorCode(error: unknown): string | undefined {
  if (!isAuthError(error)) return undefined
  return error.code
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (isAuthError(error)) return error.message
  return ''
}

/**
 * Maps Supabase auth errors to user-friendly messages for sign-in/sign-up flows.
 */
export function getAuthErrorMessage(error: unknown, context: AuthErrorContext = 'signIn'): string {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)
  const lowerMessage = message.toLowerCase()

  if (
    code === 'email_not_confirmed' ||
    lowerMessage.includes('email not confirmed') ||
    lowerMessage.includes('email_not_confirmed')
  ) {
    return 'Please verify your email before signing in. Check your inbox for the confirmation link.'
  }

  if (code === 'invalid_credentials' || lowerMessage.includes('invalid login credentials')) {
    return context === 'signIn' ? 'Invalid email or password' : 'Failed to create account. Please check your details.'
  }

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    lowerMessage.includes('already registered') ||
    lowerMessage.includes('user already registered')
  ) {
    return 'An account with this email already exists. Sign in, or check your inbox to verify your email if you have not yet.'
  }

  if (code === 'weak_password' && context === 'signUp') {
    return 'Password does not meet security requirements. Use at least 12 characters.'
  }

  if (code === 'over_email_send_rate_limit') {
    return 'Too many emails sent. Please wait a few minutes and try again.'
  }

  if (code === 'signup_disabled') {
    return 'Sign up is currently unavailable. Please try again later.'
  }

  if (message) {
    return message
  }

  switch (context) {
    case 'signUp':
      return 'Failed to create account. Please try again.'
    case 'resetPassword':
      return 'Failed to send reset email. Please try again.'
    default:
      return 'Unable to sign in. Please try again.'
  }
}
