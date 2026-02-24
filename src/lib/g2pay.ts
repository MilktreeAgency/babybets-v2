import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

// G2Pay Payment Gateway Configuration
export const G2PAY_CONFIG = {
  merchantId: import.meta.env.VITE_G2PAY_MERCHANT_ID,
  // Use sandbox for development, production for live
  environment: import.meta.env.MODE === 'production' ? 'production' : 'sandbox',
  edgeFunctionUrl: import.meta.env.VITE_SUPABASE_URL + '/functions/v1',
}

// Payment request parameters
interface PaymentRequest {
  amount: number // Amount in minor units (e.g., 1001 = £10.01)
  currencyCode: number // ISO 4217 numeric code (826 = GBP)
  orderRef: string // Your order reference
  customerEmail?: string
  customerName?: string
  cardNumber: string
  cardExpiryMonth: string
  cardExpiryYear: string
  cardCVV: string
}

// Payment response
interface PaymentResponse {
  success: boolean
  transactionID?: string
  transactionUnique?: string
  orderRef?: string
  message?: string
  responseCode?: string
}

// Process a payment via Edge Function (Direct Integration)
export const processG2PayPayment = async (
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> => {
  // Get current session (this gets the session from localStorage/memory)
  const {
    data: { session: currentSession },
    error: getSessionError
  } = await supabase.auth.getSession()

  if (getSessionError) {
    console.error('[G2Pay] Error getting session:', getSessionError)
    throw new Error('Failed to get authentication session')
  }

  if (!currentSession?.access_token) {
    console.error('[G2Pay] No valid session or access token')
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
      console.error('[G2Pay] Session refresh error:', refreshError)
      throw new Error(`Session refresh failed: ${refreshError.message}. Please log in again.`)
    }

    if (!refreshedSession?.access_token) {
      console.error('[G2Pay] No valid session after refresh')
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
  // This prevents race conditions when multiple tabs make concurrent requests
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

  // Call Edge Function - uses the isolated client with explicit JWT
  const { data, error } = await supabaseWithAuth.functions.invoke('create-g2pay-session', {
    body: paymentRequest,
  })

  if (error) {
    console.error('[G2Pay] Edge function error:', error)

    // Handle JWT-specific errors
    if (error.message?.includes('JWT') || error.message?.includes('401')) {
      throw new Error('Session expired. Please refresh the page and log in again.')
    }

    throw new Error(error.message || 'Failed to process payment')
  }

  return data
}

// Helper function to validate card expiry format (MM/YY or MM/YYYY)
export const parseCardExpiry = (expiry: string): { month: string; year: string } => {
  const cleaned = expiry.replace(/\s/g, '')
  const parts = cleaned.split('/')

  if (parts.length !== 2) {
    throw new Error('Invalid expiry format. Use MM/YY or MM/YYYY')
  }

  const month = parts[0].padStart(2, '0')
  let year = parts[1]

  // Convert YY to YYYY
  if (year.length === 2) {
    const currentYear = new Date().getFullYear()
    const century = Math.floor(currentYear / 100) * 100
    year = String(century + parseInt(year))
  }

  return { month, year }
}

// Validate card number (basic Luhn algorithm check)
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '')

  if (!/^\d{13,19}$/.test(cleaned)) {
    return false
  }

  // Luhn algorithm
  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Wallet payment request parameters
interface WalletPaymentRequest {
  orderId: string
  walletType: 'apple_pay' | 'google_pay'
  walletToken: string // Encrypted payment token from wallet
  amount: number // Amount in pence
}

// Process a wallet payment via Edge Function (Apple Pay / Google Pay)
export const processWalletPayment = async (
  walletRequest: WalletPaymentRequest
): Promise<PaymentResponse> => {
  // Get current session (this gets the session from localStorage/memory)
  const {
    data: { session: currentSession },
    error: getSessionError
  } = await supabase.auth.getSession()

  if (getSessionError) {
    console.error('[G2Pay Wallet] Error getting session:', getSessionError)
    throw new Error('Failed to get authentication session')
  }

  if (!currentSession?.access_token) {
    console.error('[G2Pay Wallet] No valid session or access token')
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
      console.error('[G2Pay Wallet] Session refresh error:', refreshError)
      throw new Error(`Session refresh failed: ${refreshError.message}. Please log in again.`)
    }

    if (!refreshedSession?.access_token) {
      console.error('[G2Pay Wallet] No valid session after refresh')
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
  // This prevents race conditions when multiple tabs make concurrent requests
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

  // Call Edge Function - uses the isolated client with explicit JWT
  const { data, error } = await supabaseWithAuth.functions.invoke('process-wallet-payment', {
    body: walletRequest,
  })

  if (error) {
    console.error('[G2Pay Wallet] Edge function error:', error)

    // Handle JWT-specific errors
    if (error.message?.includes('JWT') || error.message?.includes('401')) {
      throw new Error('Session expired. Please refresh the page and log in again.')
    }

    throw new Error(error.message || 'Failed to process wallet payment')
  }

  return data
}

// Validate Apple Pay merchant (for merchant validation step)
export const validateAppleMerchant = async (validationURL: string): Promise<Record<string, unknown>> => {
  // Get current session
  const {
    data: { session: currentSession },
    error: getSessionError
  } = await supabase.auth.getSession()

  if (getSessionError) {
    console.error('[Apple Pay] Error getting session:', getSessionError)
    throw new Error('Failed to get authentication session')
  }

  if (!currentSession?.access_token) {
    console.error('[Apple Pay] No valid session or access token')
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
      console.error('[Apple Pay] Session refresh error:', refreshError)
      throw new Error(`Session refresh failed: ${refreshError.message}. Please log in again.`)
    }

    if (!refreshedSession?.access_token) {
      console.error('[Apple Pay] No valid session after refresh')
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

  console.log('[Apple Pay] Calling validate-apple-merchant with token:', {
    hasToken: !!latestSession.access_token,
    tokenPrefix: latestSession.access_token.substring(0, 20)
  })

  // Use direct fetch for better control over headers
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-apple-merchant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${latestSession.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ validationURL }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[Apple Pay] Merchant validation failed:', {
      status: response.status,
      error: errorData
    })
    throw new Error(errorData.error || 'Failed to validate Apple Pay merchant')
  }

  const data = await response.json()
  return data.merchantSession
}
