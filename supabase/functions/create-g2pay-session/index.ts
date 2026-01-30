import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate signature using G2Pay's method (SHA-512) - as per integration guide
async function createSignature(data: Record<string, string | number>, signatureKey: string): Promise<string> {
  // 1. Sort by field name (alphabetically)
  const sortedData: Record<string, string> = {}
  Object.keys(data).sort().forEach(key => {
    sortedData[key] = String(data[key])
  })

  // 2. Create URL encoded signature string
  const params = new URLSearchParams()
  for (const key in sortedData) {
    params.append(key, sortedData[key])
  }
  let signatureString = params.toString()

  // 3. Normalize all line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
  signatureString = signatureString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A')

  // 4. Hash the signature string and the key together using SHA-512
  const messageToHash = signatureString + signatureKey
  console.log('[Edge Function] Signature details:', {
    fieldsCount: Object.keys(sortedData).length,
    signatureStringLength: signatureString.length,
    signaturePreview: signatureString.substring(0, 150),
    messageLength: messageToHash.length,
  })

  const msgBuffer = new TextEncoder().encode(messageToHash)
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[Edge Function] Starting request')

    // Get environment variables
    const G2PAY_MERCHANT_ID = Deno.env.get('G2PAY_MERCHANT_ID')
    const G2PAY_SIGNATURE_KEY = Deno.env.get('G2PAY_SIGNATURE_KEY')
    const G2PAY_GATEWAY_URL = Deno.env.get('G2PAY_GATEWAY_URL') || 'https://gateway.cardstream.com/direct/'

    console.log('[Edge Function] Environment check:', {
      hasG2PayMerchantId: !!G2PAY_MERCHANT_ID,
      hasG2PaySignatureKey: !!G2PAY_SIGNATURE_KEY,
      gatewayUrl: G2PAY_GATEWAY_URL,
      merchantId: G2PAY_MERCHANT_ID,
    })

    if (!G2PAY_MERCHANT_ID || !G2PAY_SIGNATURE_KEY) {
      throw new Error('G2Pay credentials not configured')
    }

    // TEMPORARY: Make function publicly accessible for debugging
    console.log('[Edge Function] Running without authentication (temporary for debugging)')
    const authHeader = req.headers.get('Authorization')
    console.log('[Edge Function] Auth header present:', !!authHeader)

    // Get request body
    const { amount, currencyCode, orderRef, customerEmail, customerName } = await req.json()

    if (!amount || !currencyCode || !orderRef) {
      return new Response(JSON.stringify({ error: 'amount, currencyCode, and orderRef are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique transaction ID
    const transactionUnique = crypto.randomUUID()

    // Prepare request data as per Direct Integration guide
    // This creates a payment session that the client will complete with card details
    const requestData: Record<string, string | number> = {
      merchantID: G2PAY_MERCHANT_ID,
      action: 'SALE',
      type: 1,
      countryCode: 826, // UK
      currencyCode: Number(currencyCode),
      amount: Number(amount), // Amount in minor units (e.g., 1001 = £10.01)
      orderRef,
      transactionUnique,
      // Optional customer details
      ...(customerEmail && { customerEmail }),
      ...(customerName && { customerName }),
      // Redirect URL for payment completion (if using hosted page flow)
      // redirectURL: 'https://yourdomain.com/payment/callback',
    }

    console.log('[Edge Function] Request data:', {
      merchantID: requestData.merchantID,
      action: requestData.action,
      amount: requestData.amount,
      currencyCode: requestData.currencyCode,
      orderRef: requestData.orderRef,
      transactionUnique: requestData.transactionUnique,
    })

    // Generate signature using G2Pay's method
    const signature = await createSignature(requestData, G2PAY_SIGNATURE_KEY)

    // Add signature to request
    const finalRequest = {
      ...requestData,
      signature,
    }

    console.log('[Edge Function] Sending request to:', G2PAY_GATEWAY_URL)

    // Call G2Pay Gateway using form-encoded data (as per their examples)
    const formBody = new URLSearchParams()
    for (const key in finalRequest) {
      formBody.append(key, String(finalRequest[key]))
    }

    const response = await fetch(G2PAY_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    })

    // Parse the response (should be form-encoded response)
    const responseText = await response.text()
    console.log('[Edge Function] Raw response:', responseText.substring(0, 500))

    // Parse form-encoded response
    const responseData: Record<string, string> = {}
    const params = new URLSearchParams(responseText)
    params.forEach((value, key) => {
      responseData[key] = value
    })

    console.log('[Edge Function] Parsed response:', {
      responseCode: responseData.responseCode,
      responseMessage: responseData.responseMessage,
      hasSignature: !!responseData.signature,
    })

    // Verify response signature
    const responseSignature = responseData.signature
    if (responseSignature) {
      delete responseData.signature
      const expectedSignature = await createSignature(responseData, G2PAY_SIGNATURE_KEY)
      if (responseSignature !== expectedSignature) {
        throw new Error('Response signature verification failed')
      }
    }

    // Check response code (0 = success)
    if (responseData.responseCode === '0') {
      return new Response(
        JSON.stringify({
          success: true,
          transactionID: responseData.transactionID,
          transactionUnique: responseData.transactionUnique,
          orderRef: responseData.orderRef,
          message: responseData.responseMessage,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        responseCode: responseData.responseCode,
        message: responseData.responseMessage || 'Payment failed',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing payment:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process payment',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
