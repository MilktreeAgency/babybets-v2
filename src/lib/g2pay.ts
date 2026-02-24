import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

// G2Pay Payment Gateway Configuration
export const G2PAY_CONFIG = {
  merchantId: import.meta.env.VITE_G2PAY_MERCHANT_ID,
  environment: import.meta.env.MODE === 'production' ? 'production' : 'sandbox',
  edgeFunctionUrl: import.meta.env.VITE_SUPABASE_URL + '/functions/v1',
}

// Hosted payment session response
interface HostedSessionResponse {
  success: boolean
  hostedURL?: string
  transactionUnique?: string
  orderRef?: string
  error?: string
}

// Create a hosted payment session via Edge Function
// This replaces direct API integration - user will be redirected to G2Pay's hosted page
export const createHostedPaymentSession = async (
  orderRef: string,
  customerEmail?: string,
  customerPhone?: string
): Promise<HostedSessionResponse> => {
  // Get current session
  const {
    data: { session: currentSession },
    error: getSessionError
  } = await supabase.auth.getSession()

  if (getSessionError) {
    console.error('[G2Pay Hosted] Error getting session:', getSessionError)
    throw new Error('Failed to get authentication session')
  }

  if (!currentSession?.access_token) {
    console.error('[G2Pay Hosted] No valid session or access token')
    throw new Error('Not authenticated. Please log in.')
  }

  // Check if token is about to expire (within 5 minutes)
  const expiresAt = currentSession.expires_at
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = expiresAt ? expiresAt - now : 0
  const shouldRefresh = expiresAt && timeUntilExpiry < 300

  // Refresh if needed
  if (shouldRefresh) {
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('[G2Pay Hosted] Session refresh error:', refreshError)
      throw new Error(`Session refresh failed: ${refreshError.message}. Please log in again.`)
    }

    if (!refreshedSession?.access_token) {
      console.error('[G2Pay Hosted] No valid session after refresh')
      throw new Error('Failed to refresh session. Please log in again.')
    }
  }

  // Get the latest session to ensure we have the most current JWT token
  const {
    data: { session: latestSession },
  } = await supabase.auth.getSession()

  if (!latestSession?.access_token) {
    throw new Error('No access token available. Please log in again.')
  }

  // Create a new Supabase client instance with the specific JWT token
  const supabaseWithAuth = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${latestSession.access_token}`,
        },
      },
    }
  )

  // Call Edge Function to create hosted payment session
  const { data, error } = await supabaseWithAuth.functions.invoke('create-g2pay-hosted-session', {
    body: {
      orderRef,
      customerEmail,
      customerPhone,
    },
  })

  if (error) {
    console.error('[G2Pay Hosted] Edge function error:', error)

    // Handle JWT-specific errors
    if (error.message?.includes('JWT') || error.message?.includes('401')) {
      throw new Error('Session expired. Please refresh the page and log in again.')
    }

    throw new Error(error.message || 'Failed to create payment session')
  }

  return data
}
