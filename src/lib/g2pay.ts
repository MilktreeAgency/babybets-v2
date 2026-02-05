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
    amount: paymentRequest.amount,
    currencyCode: paymentRequest.currencyCode,
    orderRef: paymentRequest.orderRef,
  })

  // Use Supabase client's invoke method which handles JWT authentication automatically
  const { data, error } = await supabase.functions.invoke('create-g2pay-session', {
    body: paymentRequest,
  })

  if (error) {
    console.error('[G2Pay] Edge function error:', error)
    throw new Error(error.message || 'Failed to process payment')
  }

  console.log('[G2Pay] Payment response:', {
    success: data.success,
    transactionID: data.transactionID,
    message: data.message,
  })

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
