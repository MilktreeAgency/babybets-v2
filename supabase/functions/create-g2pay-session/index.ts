import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate SHA-256 checksum
async function generateChecksum(params: Record<string, string>, signatureKey: string): Promise<string> {
  const concatenated = Object.values(params).join('') + signatureKey
  const msgBuffer = new TextEncoder().encode(concatenated)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
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
    // Get environment variables
    const G2PAY_MERCHANT_ID = Deno.env.get('G2PAY_MERCHANT_ID')
    const G2PAY_SIGNATURE_KEY = Deno.env.get('G2PAY_SIGNATURE_KEY')
    const G2PAY_API_URL = Deno.env.get('G2PAY_API_URL') || 'https://ppp-test.safecharge.com/ppp/api/v1'

    if (!G2PAY_MERCHANT_ID || !G2PAY_SIGNATURE_KEY) {
      throw new Error('G2Pay credentials not configured')
    }

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { clientRequestId } = await req.json()

    if (!clientRequestId) {
      return new Response(JSON.stringify({ error: 'clientRequestId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate timestamp
    const timeStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]

    // Prepare params for checksum
    const params = {
      merchantId: G2PAY_MERCHANT_ID,
      merchantSiteId: G2PAY_MERCHANT_ID,
      clientRequestId,
      timeStamp,
    }

    // Generate checksum
    const checksum = await generateChecksum(params, G2PAY_SIGNATURE_KEY)

    // Call G2Pay API
    const response = await fetch(`${G2PAY_API_URL}/getSessionToken.do`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        checksum,
      }),
    })

    const data = await response.json()

    if (data.status === 'SUCCESS') {
      return new Response(
        JSON.stringify({
          sessionToken: data.sessionToken,
          sessionId: data.internalRequestId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    throw new Error(data.reason || 'Failed to create G2Pay session')
  } catch (error) {
    console.error('Error creating G2Pay session:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create payment session',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
