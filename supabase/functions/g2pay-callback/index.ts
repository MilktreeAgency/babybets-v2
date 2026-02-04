import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate signature using G2Pay's method (SHA-512) - as per integration guide
async function createSignature(data: Record<string, string>, signatureKey: string): Promise<string> {
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
    console.log('[G2Pay Callback] Received callback from G2Pay')

    // Get environment variables
    const G2PAY_SIGNATURE_KEY = Deno.env.get('G2PAY_SIGNATURE_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!G2PAY_SIGNATURE_KEY) {
      throw new Error('G2Pay signature key not configured')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured')
    }

    // Parse form-encoded callback data
    const formData = await req.text()
    const params = new URLSearchParams(formData)

    const callbackData: Record<string, string> = {}
    params.forEach((value, key) => {
      callbackData[key] = value
    })

    console.log('[G2Pay Callback] Callback data received:', {
      responseCode: callbackData.responseCode,
      transactionID: callbackData.transactionID,
      orderRef: callbackData.orderRef,
      amount: callbackData.amount,
      hasSignature: !!callbackData.signature,
    })

    // Verify signature
    const receivedSignature = callbackData.signature
    if (!receivedSignature) {
      console.error('[G2Pay Callback] No signature in callback')
      return new Response('No signature', { status: 400 })
    }

    // Create a copy for signature verification
    const dataForSignature = { ...callbackData }
    delete dataForSignature.signature

    const expectedSignature = await createSignature(dataForSignature, G2PAY_SIGNATURE_KEY)

    console.log('[G2Pay Callback] Signature verification:', {
      received: receivedSignature.substring(0, 32) + '...',
      expected: expectedSignature.substring(0, 32) + '...',
      match: receivedSignature === expectedSignature,
    })

    if (receivedSignature !== expectedSignature) {
      console.error('[G2Pay Callback] Signature verification failed')
      return new Response('Invalid signature', { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Update order status in database
    const responseCode = callbackData.responseCode
    const isSuccess = responseCode === '0'

    console.log('[G2Pay Callback] Updating order:', {
      orderRef: callbackData.orderRef,
      isSuccess,
      responseCode,
    })

    // Find and update the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', callbackData.orderRef)
      .single()

    if (fetchError || !order) {
      console.error('[G2Pay Callback] Order not found:', fetchError)
      return new Response('Order not found', { status: 404 })
    }

    // Update order with payment result
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: isSuccess ? 'paid' : 'payment_failed',
        payment_provider: 'g2pay',
        payment_provider_transaction_id: callbackData.transactionID,
        payment_provider_response: callbackData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', callbackData.orderRef)

    if (updateError) {
      console.error('[G2Pay Callback] Failed to update order:', updateError)
      return new Response('Failed to update order', { status: 500 })
    }

    console.log('[G2Pay Callback] Order updated successfully')

    // Return success response
    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('[G2Pay Callback] Error processing callback:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process callback',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
