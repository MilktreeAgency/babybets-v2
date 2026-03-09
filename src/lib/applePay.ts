import { supabase } from './supabase'

// Apple Pay configuration
export const APPLE_PAY_CONFIG = {
  merchantIdentifier: 'merchant.g2pay.co.uk', // G2Pay's Apple Pay Merchant ID
  merchantCapabilities: ['supports3DS', 'supportsCredit', 'supportsDebit'] as ApplePayJS.ApplePayMerchantCapability[],
  supportedNetworks: ['visa', 'masterCard', 'amex'] as ApplePayJS.ApplePayPaymentNetwork[],
  countryCode: 'GB',
  currencyCode: 'GBP',
}

interface ApplePaySessionData {
  merchantSession: ApplePayJS.ApplePayPaymentRequest
  displayName: string
  domainName: string
}

interface ValidateMerchantResponse {
  success: boolean
  merchantSession?: Record<string, unknown>
  error?: string
}

/**
 * Check if Apple Pay is available in the current browser
 */
export function isApplePayAvailable(): boolean {
  // Check if ApplePaySession is defined and device supports Apple Pay
  if (typeof window === 'undefined') return false

  return (
    typeof (window as Window & { ApplePaySession?: typeof ApplePayJS.ApplePaySession }).ApplePaySession !== 'undefined' &&
    (window as Window & { ApplePaySession?: typeof ApplePayJS.ApplePaySession }).ApplePaySession?.canMakePayments() === true
  )
}

/**
 * Validate merchant with G2Pay (instead of directly with Apple)
 * This uses G2Pay's credentials to authenticate with Apple Pay
 */
export async function validateMerchantWithG2Pay(
  validationURL: string,
  displayName: string,
  domainName: string
): Promise<Record<string, unknown>> {
  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    // Call edge function to validate merchant via G2Pay
    const { data, error } = await supabase.functions.invoke('validate-apple-pay-merchant', {
      body: {
        validationURL,
        displayName,
        domainName,
      },
    })

    if (error) {
      console.error('[Apple Pay] Merchant validation error:', error)
      throw new Error(error.message || 'Failed to validate merchant')
    }

    if (!data?.success || !data?.merchantSession) {
      throw new Error(data?.error || 'Invalid merchant session response')
    }

    return data.merchantSession
  } catch (error) {
    console.error('[Apple Pay] Error validating merchant:', error)
    throw error
  }
}

/**
 * Create an Apple Pay payment session
 */
export function createApplePaySession(
  totalAmount: number,
  onPaymentAuthorized: (payment: ApplePayJS.ApplePayPayment) => Promise<boolean>,
  onCancel?: () => void
): ApplePayJS.ApplePaySession | null {
  if (!isApplePayAvailable()) {
    console.error('[Apple Pay] Apple Pay is not available')
    return null
  }

  // Create payment request
  const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
    countryCode: APPLE_PAY_CONFIG.countryCode,
    currencyCode: APPLE_PAY_CONFIG.currencyCode,
    merchantCapabilities: APPLE_PAY_CONFIG.merchantCapabilities,
    supportedNetworks: APPLE_PAY_CONFIG.supportedNetworks,
    total: {
      label: 'Baby Bets',
      amount: totalAmount.toFixed(2),
      type: 'final',
    },
  }

  // Create Apple Pay session (version 3)
  const session = new (window as Window & { ApplePaySession: typeof ApplePayJS.ApplePaySession }).ApplePaySession(
    3,
    paymentRequest
  )

  // Handle merchant validation
  session.onvalidatemerchant = async (event: ApplePayJS.ApplePayValidateMerchantEvent) => {
    try {
      console.log('[Apple Pay] Validating merchant...')

      const merchantSession = await validateMerchantWithG2Pay(
        event.validationURL,
        'Baby Bets',
        window.location.hostname
      )

      session.completeMerchantValidation(merchantSession)
    } catch (error) {
      console.error('[Apple Pay] Merchant validation failed:', error)
      session.abort()
    }
  }

  // Handle payment authorization
  session.onpaymentauthorized = async (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => {
    try {
      console.log('[Apple Pay] Payment authorized:', event.payment)

      const success = await onPaymentAuthorized(event.payment)

      if (success) {
        session.completePayment(
          (window as Window & { ApplePaySession: typeof ApplePayJS.ApplePaySession }).ApplePaySession.STATUS_SUCCESS
        )
      } else {
        session.completePayment(
          (window as Window & { ApplePaySession: typeof ApplePayJS.ApplePaySession }).ApplePaySession.STATUS_FAILURE
        )
      }
    } catch (error) {
      console.error('[Apple Pay] Payment authorization failed:', error)
      session.completePayment(
        (window as Window & { ApplePaySession: typeof ApplePayJS.ApplePaySession }).ApplePaySession.STATUS_FAILURE
      )
    }
  }

  // Handle cancellation
  session.oncancel = () => {
    console.log('[Apple Pay] Payment cancelled by user')
    onCancel?.()
  }

  return session
}

/**
 * Process Apple Pay payment token with G2Pay
 */
export async function processApplePayPayment(
  orderId: string,
  paymentToken: ApplePayJS.ApplePayPaymentToken,
  customerEmail?: string,
  customerPhone?: string
): Promise<{ success: boolean; transactionID?: string; error?: string }> {
  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    // Call edge function to process Apple Pay payment
    const { data, error } = await supabase.functions.invoke('process-apple-pay-payment', {
      body: {
        orderId,
        paymentToken,
        customerEmail,
        customerPhone,
      },
    })

    if (error) {
      console.error('[Apple Pay] Payment processing error:', error)
      throw new Error(error.message || 'Failed to process payment')
    }

    return data
  } catch (error) {
    console.error('[Apple Pay] Error processing payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    }
  }
}
