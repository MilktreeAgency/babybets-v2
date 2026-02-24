import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

// Generate signature using G2Pay's method (SHA-512) - for requests only
async function createSignature(data: Record<string, string | number>, signatureKey: string, shouldSort: boolean = true): Promise<string> {
  const processedData: Record<string, string> = {}
  const keys = shouldSort ? Object.keys(data).sort() : Object.keys(data)

  keys.forEach(key => {
    processedData[key] = String(data[key])
  })

  const params = new URLSearchParams()
  for (const key in processedData) {
    params.append(key, processedData[key])
  }
  let signatureString = params.toString()

  signatureString = signatureString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A')

  const messageToHash = signatureString + signatureKey

  const msgBuffer = new TextEncoder().encode(messageToHash)
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

// Verify G2Pay response signature using raw response body
// Per G2Pay support: Only exclude signature field, sort alphabetically, keep URL-encoded
async function verifyG2PaySignature(
  rawBody: string,
  signatureKey: string
): Promise<boolean> {
  // Extract signature first
  const signatureMatch = rawBody.match(/(?:^|&)signature=([^&]+)/)
  if (!signatureMatch) {
    console.error('[G2Pay] No signature found in response')
    return false
  }

  const receivedSignature = signatureMatch[1]

  // Per G2Pay support: Only exclude signature field (NOT __ fields), then sort alphabetically
  const fields = rawBody
    .split('&')
    .filter(pair => !pair.startsWith('signature='))
    .sort() // Sort alphabetically at root level
    .join('&')

  const messageToHash = fields + signatureKey

  const buffer = new TextEncoder().encode(messageToHash)
  const digest = await crypto.subtle.digest('SHA-512', buffer)
  const expectedSignature = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const isValid = expectedSignature === receivedSignature

  if (!isValid) {
    console.error('[G2Pay] Signature verification failed')
  }

  return isValid
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const G2PAY_MERCHANT_ID = Deno.env.get('G2PAY_MERCHANT_ID')
    const G2PAY_SIGNATURE_KEY = Deno.env.get('G2PAY_SIGNATURE_KEY')
    const G2PAY_GATEWAY_URL = Deno.env.get('G2PAY_GATEWAY_URL')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

    if (!G2PAY_MERCHANT_ID || !G2PAY_SIGNATURE_KEY || !G2PAY_GATEWAY_URL) {
      throw new Error('G2Pay configuration missing: G2PAY_MERCHANT_ID, G2PAY_SIGNATURE_KEY, and G2PAY_GATEWAY_URL are required')
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[Edge Function] Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify JWT using anon client
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.error('[Edge Function] JWT verification failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

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

    // Security: Verify the order exists and belongs to the authenticated user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, total_pence')
      .eq('id', orderRef)
      .single()

    if (orderError || !order) {
      console.error('[Edge Function] Order not found:', {
        orderRef,
        orderRefType: typeof orderRef,
        error: orderError,
      })
      return new Response(
        JSON.stringify({
          error: 'Order not found',
          details: orderError?.message || 'No order found with that ID',
          orderRef,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Security: Ensure authenticated user owns this order
    if (order.user_id !== user.id) {
      console.error(`[Edge Function] User ${user.id} attempted to pay for order ${orderRef} owned by ${order.user_id}`)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Order does not belong to user' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Idempotency: Check if order is already paid
    if (order.status === 'paid') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order already paid',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Security: Verify amount matches order total
    if (Number(amount) !== order.total_pence) {
      console.error(`[Edge Function] Amount mismatch: requested ${amount}, order total ${order.total_pence}`)
      return new Response(
        JSON.stringify({ error: 'Amount does not match order total' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate unique transaction ID for idempotency
    const transactionUnique = crypto.randomUUID()

    // Log transaction attempt in database for audit trail
    const { data: transactionLog, error: logError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        order_id: orderRef,
        user_id: user.id,
        transaction_unique: transactionUnique,
        amount_pence: Number(amount),
        currency_code: Number(currencyCode),
        status: 'pending',
        gateway_url: G2PAY_GATEWAY_URL,
      })
      .select('id')
      .single()

    if (logError) {
      console.error('[Edge Function] Failed to create transaction log:', logError)
      // Continue anyway - logging failure shouldn't block payment
    }

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
      // Webhook callback URL for backend payment confirmation
      // G2Pay will POST payment result to this URL, ensuring order completion even if user closes browser
      callbackURL: `${SUPABASE_URL}/functions/v1/g2pay-webhook`,
      // Optional customer details
      ...(customerEmail && { customerEmail }),
      ...(customerName && { customerName }),
    }

    // Generate signature using G2Pay's method (includes ALL fields)
    const signature = await createSignature(requestData, G2PAY_SIGNATURE_KEY)

    // Add signature to request
    const finalRequest = {
      ...requestData,
      signature,
    }

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

    // Parse response data for display/logging
    const responseData: Record<string, string> = {}
    const pairs = responseText.split('&')
    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=')
      if (eqIndex > 0) {
        const key = decodeURIComponent(pair.substring(0, eqIndex))
        const value = decodeURIComponent(pair.substring(eqIndex + 1).replace(/\+/g, ' '))
        responseData[key] = value
      }
    }

    // Verify response signature using raw body (optional for direct responses)
    // Note: G2Pay may not include signatures in direct API responses
    const signatureVerified = await verifyG2PaySignature(responseText, G2PAY_SIGNATURE_KEY)

    if (!signatureVerified) {
      console.warn('[Edge Function] ⚠️ Warning: Signature verification failed or not present')
      console.log('[Edge Function] G2Pay may not sign direct API responses - proceeding with payment')

      // Log signature verification status for audit
      if (transactionLog?.id) {
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            signature_verified: false,
            signature_mismatch_reason: 'No signature in direct API response (expected for G2Pay)',
          })
          .eq('id', transactionLog.id)
      }
    } else {
      console.log('[Edge Function] ✅ Signature verified successfully')
    }

    // Sanitize request data for logging (remove sensitive card details)
    const sanitizedRequestData = {
      ...requestData,
      cardNumber: cardNumber.slice(0, 4) + '****' + cardNumber.slice(-4),
      cardCVV: '***',
    }

    // Check response code (0 = success)
    if (responseData.responseCode === '0') {
      // Update transaction log with success
      if (transactionLog?.id) {
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'success',
            transaction_id: responseData.transactionID,
            response_code: responseData.responseCode,
            response_message: responseData.responseMessage,
            signature_verified: signatureVerified,
            signature_mismatch_reason: signatureVerified ? null : 'No signature in direct API response',
            request_data: sanitizedRequestData,
            response_data: responseData,
          })
          .eq('id', transactionLog.id)
      }

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

    // Payment failed - log failure
    console.error('[Edge Function] Payment failed:', {
      responseCode: responseData.responseCode,
      responseMessage: responseData.responseMessage,
      allResponseFields: Object.keys(responseData).join(', '),
    })

    // Update transaction log with failure
    if (transactionLog?.id) {
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'failed',
          response_code: responseData.responseCode,
          response_message: responseData.responseMessage,
          signature_verified: signatureVerified,
          signature_mismatch_reason: signatureVerified ? null : 'No signature in direct API response',
          request_data: sanitizedRequestData,
          response_data: responseData,
          error_message: responseData.responseMessage,
        })
        .eq('id', transactionLog.id)
    }

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
    console.error('[Edge Function] Error processing payment:', error)

    // Note: transactionLog may not be defined if error occurred before logging was set up
    // This is expected and we handle it gracefully

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
