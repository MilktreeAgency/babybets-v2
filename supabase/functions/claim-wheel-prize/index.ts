import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface ClaimWheelPrizeRequest {
  email: string
  prizeLabel: string
  prizeValue: string
  prizeType: 'credit' | 'discount' | 'free_entry'
  prizeAmount?: number
}

const ALLOWED_WHEEL_PRIZES = {
  credit: [0.5, 1, 2, 5, 10, 20],
  discount: [5, 10, 15, 20, 25, 50],
  free_entry: [1],
}

const DISCOUNT_EXPIRY_HOURS = 48
const PROMO_EXPIRY_DAYS = 30

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createPromoExpiry(days: number) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin') || undefined
  const corsHeaders = getCorsHeaders(false, requestOrigin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405, corsHeaders)
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { data: webhookConfig } = await supabaseAdmin
      .from('webhook_config')
      .select('webhook_secret, supabase_url')
      .limit(1)
      .single()

    const { email, prizeLabel, prizeValue, prizeType, prizeAmount }: ClaimWheelPrizeRequest =
      await req.json()

    const normalizedEmail = email?.toLowerCase().trim()

    if (!normalizedEmail || !prizeLabel || !prizeValue || !prizeType) {
      return jsonResponse({ success: false, message: 'Missing required fields' }, 400, corsHeaders)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return jsonResponse({ success: false, message: 'Invalid email format' }, 400, corsHeaders)
    }

    if (prizeType === 'credit' && prizeAmount != null) {
      if (!ALLOWED_WHEEL_PRIZES.credit.includes(prizeAmount)) {
        return jsonResponse({ success: false, message: 'Invalid prize amount' }, 400, corsHeaders)
      }
    } else if (prizeType === 'discount' && prizeAmount != null) {
      if (!ALLOWED_WHEEL_PRIZES.discount.includes(prizeAmount)) {
        return jsonResponse({ success: false, message: 'Invalid prize amount' }, 400, corsHeaders)
      }
    } else if (prizeType === 'free_entry' && prizeAmount != null && prizeAmount !== 1) {
      return jsonResponse({ success: false, message: 'Invalid prize amount' }, 400, corsHeaders)
    }

    const { data: existingClaim, error: checkError } = await supabaseAdmin
      .from('wheel_claims')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing claim:', checkError)
      return jsonResponse({ success: false, message: 'Error checking claim eligibility' }, 500, corsHeaders)
    }

    if (existingClaim) {
      return jsonResponse(
        {
          success: false,
          message:
            'Looks like this email has already claimed a spin prize. This offer is for new customers only.',
          alreadyClaimed: true,
        },
        409,
        corsHeaders
      )
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (existingProfile?.id) {
      const { data: existingOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', existingProfile.id)
        .limit(1)

      if (existingOrders && existingOrders.length > 0) {
        return jsonResponse(
          {
            success: false,
            message: 'This offer is for new customers only.',
            alreadyClaimed: false,
          },
          409,
          corsHeaders
        )
      }
    }

    let userId: string | null = existingProfile?.id ?? null
    const authHeader = req.headers.get('Authorization')

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (!authError && user) {
          userId = user.id
        }
      } catch {
        console.log('No valid user session, proceeding as anonymous')
      }
    }

    let promoCodeId: string | null = null
    let generatedPromoCode: string | null = null
    let creditAppliedToWallet = false
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()

    async function insertPromoCode(
      code: string,
      type: 'percentage' | 'fixed_value' | 'free_tickets',
      value: number,
      validUntil: Date
    ) {
      const { data: promoData, error: promoError } = await supabaseAdmin
        .from('promo_codes')
        .insert({
          code,
          type,
          value,
          max_uses: 1,
          current_uses: 0,
          max_uses_per_user: 1,
          min_order_pence: 0,
          valid_from: new Date().toISOString(),
          valid_until: validUntil.toISOString(),
          is_active: true,
          competition_ids: [],
          new_customers_only: true,
        })
        .select('id')
        .single()

      if (promoError) {
        console.error('Error creating promo code:', promoError)
        throw new Error('Error creating promo code')
      }

      promoCodeId = promoData.id
      generatedPromoCode = code
    }

    if (prizeType === 'discount') {
      const promoCode = `${prizeValue.toUpperCase()}-${randomSuffix}`
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + DISCOUNT_EXPIRY_HOURS)

      await insertPromoCode(promoCode, 'percentage', prizeAmount || 0, expiresAt)
    } else if (prizeType === 'free_entry') {
      const promoCode = `FREE-${randomSuffix}`
      await insertPromoCode(promoCode, 'free_tickets', 1, createPromoExpiry(PROMO_EXPIRY_DAYS))
    } else if (prizeType === 'credit') {
      const amountPence = Math.round((prizeAmount || 0) * 100)

      if (userId) {
        const expiryDate = new Date()
        expiryDate.setFullYear(expiryDate.getFullYear() + 1)

        const { error: creditError } = await supabaseAdmin.from('wallet_credits').insert({
          user_id: userId,
          amount_pence: amountPence,
          remaining_pence: amountPence,
          source_type: 'wheel_spin',
          description: `Spin the wheel prize: ${prizeLabel}`,
          expires_at: expiryDate.toISOString(),
          status: 'active',
        })

        if (!creditError) {
          creditAppliedToWallet = true
        } else {
          console.error('Error creating wallet credit:', creditError)
        }
      }

      if (!creditAppliedToWallet) {
        const promoCode = `CREDIT-${randomSuffix}`
        await insertPromoCode(promoCode, 'fixed_value', amountPence, createPromoExpiry(PROMO_EXPIRY_DAYS))
      }
    }

    const { error: claimError } = await supabaseAdmin.from('wheel_claims').insert({
      email: normalizedEmail,
      prize_type: prizeType,
      prize_label: prizeLabel,
      prize_value: prizeValue,
      prize_amount: prizeAmount,
      user_id: userId,
      promo_code_id: promoCodeId,
      email_sent: false,
    })

    if (claimError) {
      console.error('Error recording claim:', claimError)
      return jsonResponse({ success: false, message: 'Error recording claim' }, 500, corsHeaders)
    }

    const emailData: Record<string, unknown> = {
      prizeLabel,
      prizeValue,
      prizeType,
      prizeAmount,
      creditAppliedToWallet,
    }

    if (generatedPromoCode) {
      emailData.promoCode = generatedPromoCode
      emailData.expiryMinutes =
        prizeType === 'discount' ? DISCOUNT_EXPIRY_HOURS * 60 : PROMO_EXPIRY_DAYS * 24 * 60
    }

    let emailSent = false

    if (webhookConfig?.webhook_secret) {
      const emailResponse = await fetch(
        `${webhookConfig.supabase_url}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhookConfig.webhook_secret,
          },
          body: JSON.stringify({
            type: 'wheel_prize',
            recipientEmail: normalizedEmail,
            recipientName: userId ? undefined : 'there',
            data: emailData,
          }),
        }
      )

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Error sending email:', errorText)
      } else {
        emailSent = true
        await supabaseAdmin
          .from('wheel_claims')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail)
          .eq('prize_value', prizeValue)
      }
    } else {
      console.error('Webhook config not available - cannot send email')
    }

    if (!emailSent) {
      return jsonResponse(
        {
          success: false,
          message: 'Prize was recorded but we could not send your email. Please contact support.',
        },
        500,
        corsHeaders
      )
    }

    return jsonResponse(
      {
        success: true,
        message: 'Prize claimed successfully! Check your inbox (and junk folder).',
        alreadyClaimed: false,
      },
      200,
      corsHeaders
    )
  } catch (error) {
    console.error('Error in claim-wheel-prize function:', error)
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      500,
      corsHeaders
    )
  }
})
