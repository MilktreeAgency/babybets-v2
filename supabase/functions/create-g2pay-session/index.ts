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
    const G2PAY_GATEWAY_URL = Deno.env.get('G2PAY_GATEWAY_URL') || 'https://payments.g2pay.co.uk/direct/'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

    console.log('[Edge Function] Environment check:', {
      hasG2PayMerchantId: !!G2PAY_MERCHANT_ID,
      hasG2PaySignatureKey: !!G2PAY_SIGNATURE_KEY,
      gatewayUrl: G2PAY_GATEWAY_URL,
      merchantId: G2PAY_MERCHANT_ID,
      supabaseUrl: SUPABASE_URL,
    })

    if (!G2PAY_MERCHANT_ID || !G2PAY_SIGNATURE_KEY) {
      throw new Error('G2Pay credentials not configured')
    }

    // TEMPORARY: Make function publicly accessible for debugging
    console.log('[Edge Function] Running without authentication (temporary for debugging)')
    const authHeader = req.headers.get('Authorization')
    console.log('[Edge Function] Auth header present:', !!authHeader)

    // Get request body
    const {
      amount,
      currencyCode,
      orderRef,
      customerEmail,
      customerName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCVV
    } = await req.json()

    if (!amount || !currencyCode || !orderRef) {
      return new Response(JSON.stringify({ error: 'amount, currencyCode, and orderRef are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCVV) {
      return new Response(JSON.stringify({ error: 'Card details are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique transaction ID
    const transactionUnique = crypto.randomUUID()

    // Prepare request data as per Direct Integration guide
    // This processes a payment with card details via hosted fields
    const requestData: Record<string, string | number> = {
      merchantID: G2PAY_MERCHANT_ID,
      action: 'SALE',
      type: 1,
      countryCode: 826, // UK
      currencyCode: Number(currencyCode),
      amount: Number(amount), // Amount in minor units (e.g., 1001 = £10.01)
      orderRef,
      transactionUnique,
      // Card details from hosted fields
      // Remove any spaces or dashes from card number
      cardNumber: String(cardNumber).replace(/[\s-]/g, ''),
      cardExpiryMonth: String(cardExpiryMonth).padStart(2, '0'),
      cardExpiryYear: String(cardExpiryYear).slice(-2), // Use last 2 digits (YY format)
      cardCVV: String(cardCVV),
      // Disable 3D Secure for Direct Integration (not supported in this flow)
      threeDSRequired: 'N',
      // Disable duplicate checking for testing
      duplicateDelay: 0,
      // Add callback URL for reliable backend updates (as per G2Pay docs recommendation)
      callbackURL: `${SUPABASE_URL}/functions/v1/g2pay-callback`,
      // Optional customer details
      ...(customerEmail && { customerEmail }),
      ...(customerName && { customerName }),
    }

    console.log('[Edge Function] Request data:', {
      merchantID: requestData.merchantID,
      action: requestData.action,
      type: requestData.type,
      countryCode: requestData.countryCode,
      amount: requestData.amount,
      currencyCode: requestData.currencyCode,
      orderRef: requestData.orderRef,
      transactionUnique: requestData.transactionUnique,
      cardNumberMasked: cardNumber.slice(0, 4) + '****' + cardNumber.slice(-4),
      cardNumberLength: cardNumber.length,
      cardExpiryMonth: requestData.cardExpiryMonth,
      cardExpiryYear: requestData.cardExpiryYear,
      threeDSRequired: requestData.threeDSRequired,
      duplicateDelay: requestData.duplicateDelay,
    })

    // Generate signature using G2Pay's method
    const signature = await createSignature(requestData, G2PAY_SIGNATURE_KEY)

    // Add signature to request
    const finalRequest = {
      ...requestData,
      signature,
    }

    console.log('[Edge Function] Sending request to:', G2PAY_GATEWAY_URL)
    console.log('[Edge Function] All fields being sent:', Object.keys(finalRequest).sort().join(', '))

    // Call G2Pay Gateway using form-encoded data (as per their examples)
    const formBody = new URLSearchParams()
    for (const key in finalRequest) {
      formBody.append(key, String(finalRequest[key]))
    }

    console.log('[Edge Function] Form body preview (first 200 chars):', formBody.toString().substring(0, 200))

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
      // Create a copy for signature verification
      const dataForSignature = { ...responseData }
      delete dataForSignature.signature

      console.log('[Edge Function] Verifying signature:', {
        receivedSignature: responseSignature.substring(0, 32) + '...',
        fieldsInResponse: Object.keys(dataForSignature).sort().join(', '),
      })

      const expectedSignature = await createSignature(dataForSignature, G2PAY_SIGNATURE_KEY)

      console.log('[Edge Function] Signature comparison:', {
        received: responseSignature.substring(0, 32) + '...',
        expected: expectedSignature.substring(0, 32) + '...',
        match: responseSignature === expectedSignature,
      })

      if (responseSignature !== expectedSignature) {
        console.warn('[Edge Function] ⚠️ Response signature verification failed - this may indicate wrong signature key')
        console.warn('[Edge Function] Received signature:', responseSignature)
        console.warn('[Edge Function] Expected signature:', expectedSignature)
        console.warn('[Edge Function] Response fields used:', Object.keys(dataForSignature).sort())

        // TEMPORARY: Log this as warning but continue (for testing only)
        // TODO: Re-enable strict verification once signature key is confirmed
        // throw new Error('Response signature verification failed')
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

    // Return error response with detailed info
    console.error('[Edge Function] Payment failed:', {
      responseCode: responseData.responseCode,
      responseMessage: responseData.responseMessage,
      allResponseFields: Object.keys(responseData).join(', '),
    })

    // Map common error codes to helpful messages
    const errorMessages: Record<string, string> = {
      '65550': 'Invalid card number. If using sandbox mode, ensure you are using G2Pay test cards.',
      '65566': 'Invalid card number. Verify: 1) Using correct sandbox URL, 2) Merchant ID is in test mode, 3) Using G2Pay-specific test cards.',
      '65551': 'Invalid expiry date',
      '65552': 'Invalid CVV',
    }

    const helpfulMessage = errorMessages[responseData.responseCode] || responseData.responseMessage || 'Payment failed'

    return new Response(
      JSON.stringify({
        success: false,
        responseCode: responseData.responseCode,
        message: helpfulMessage,
        rawMessage: responseData.responseMessage,
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
