import { supabase } from './supabase'

// G2Pay Payment Gateway Configuration
export const G2PAY_CONFIG = {
  merchantId: import.meta.env.VITE_G2PAY_MERCHANT_ID,
  // Use sandbox for development, production for live
  environment: import.meta.env.MODE === 'production' ? 'production' : 'sandbox',
  edgeFunctionUrl: import.meta.env.VITE_SUPABASE_URL + '/functions/v1',
}

// Create a G2Pay session via Edge Function
export const createG2PaySession = async (
  clientRequestId: string
): Promise<{ sessionToken: string; sessionId: string }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${G2PAY_CONFIG.edgeFunctionUrl}/create-g2pay-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      clientRequestId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create payment session')
  }

  const data = await response.json()
  return {
    sessionToken: data.sessionToken,
    sessionId: data.sessionId,
  }
}
