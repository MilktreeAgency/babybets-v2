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
  console.log('[G2Pay] Starting payment processing...')

  // Get current session
  const {
    data: { session: currentSession },
  } = await supabase.auth.getSession()

  console.log('[G2Pay] Current session:', {
    hasSession: !!currentSession,
    userId: currentSession?.user?.id,
  })

  if (!currentSession) {
    throw new Error('Not authenticated')
  }

  // Check if token is about to expire (within 5 minutes)
  const expiresAt = currentSession.expires_at
  const now = Math.floor(Date.now() / 1000)
  const shouldRefresh = expiresAt && expiresAt - now < 300

  // Refresh if needed
  if (shouldRefresh) {
    console.log('[G2Pay] Refreshing session...')
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession()

    if (refreshError || !refreshedSession) {
      console.error('[G2Pay] Session refresh failed:', refreshError)
      throw new Error('Session expired. Please log in again.')
    }

    console.log('[G2Pay] Session refreshed successfully')
  }

  console.log('[G2Pay] Making payment request:', {
    url: `${G2PAY_CONFIG.edgeFunctionUrl}/create-g2pay-session`,
    amount: paymentRequest.amount,
    currencyCode: paymentRequest.currencyCode,
    orderRef: paymentRequest.orderRef,
  })

  // TEMPORARY: Use anon key instead of user JWT for debugging
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const response = await fetch(`${G2PAY_CONFIG.edgeFunctionUrl}/create-g2pay-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(paymentRequest),
  })

  console.log('[G2Pay] Response status:', response.status)

  if (!response.ok) {
    const error = await response.json()
    console.error('[G2Pay] Edge function error:', error)
    throw new Error(error.error || error.message || 'Failed to process payment')
  }

  const data = await response.json()
  console.log('[G2Pay] Payment response:', {
    success: data.success,
    transactionID: data.transactionID,
    message: data.message,
  })

  return data
}

// Backward compatibility - for older code that might still use this
export const createG2PaySession = async (
  _clientRequestId: string
): Promise<{ sessionToken: string; sessionId: string }> => {
  throw new Error('createG2PaySession is deprecated. Use processG2PayPayment instead.')
}
