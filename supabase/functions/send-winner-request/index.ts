import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { getEmailLayout } from '../send-email/templates/layout.ts'

interface SendWinnerRequestBody {
  winnerId: string
  email: string
  displayName: string
  prizeName: string
}

function getWinnerPhotoRequestHTML(
  displayName: string,
  prizeName: string,
  accountUrl: string,
  logoUrl?: string
): string {
  const content = `
    <h2>We'd love to feature your win!</h2>
    <p>Hi ${displayName},</p>
    <p>Congratulations again on winning <strong>${prizeName}</strong> with BabyBets!</p>
    <p>We'd love to share your story on our website and social channels. If you're happy to take part, please reply to this email with:</p>
    <div class="info-box">
      <ul style="margin: 0; padding-left: 20px; color: #3f3f46;">
        <li style="margin-bottom: 8px;">A photo of you with your prize (or a selfie celebrating your win)</li>
        <li style="margin-bottom: 8px;">A short testimonial about your BabyBets experience</li>
      </ul>
    </div>
    <p>Sharing is completely optional — but it really helps other players see real winners.</p>
    <a href="${accountUrl}" class="button">View Your Account</a>
    <p>If you have any questions, just reply to this email and our team will help.</p>
    <p style="margin-top: 24px; color: #09090b; font-weight: 600;">The BabyBets Team</p>
  `
  return getEmailLayout('Share Your BabyBets Win', content, logoUrl)
}

function getWinnerPhotoRequestText(
  displayName: string,
  prizeName: string,
  accountUrl: string
): string {
  return `
Hi ${displayName},

Congratulations again on winning ${prizeName} with BabyBets!

We'd love to share your story on our website and social channels. If you're happy to take part, please reply to this email with:
- A photo of you with your prize (or a selfie celebrating your win)
- A short testimonial about your BabyBets experience

Sharing is completely optional — but it really helps other players see real winners.

View your account: ${accountUrl}

If you have any questions, just reply to this email and our team will help.

The BabyBets Team
  `.trim()
}

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin') || undefined
  const corsHeaders = getCorsHeaders(false, requestOrigin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userRole = user.user_metadata?.role
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: SendWinnerRequestBody = await req.json()
    const { winnerId, email, displayName, prizeName } = body

    if (!winnerId || !email || !displayName || !prizeName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: winnerId, email, displayName, prizeName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: winner, error: winnerError } = await supabaseAdmin
      .from('winners')
      .select('id, user_id')
      .eq('id', winnerId)
      .single()

    if (winnerError || !winner) {
      return new Response(
        JSON.stringify({ error: 'Winner not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', winner.user_id)
      .single()

    if (profileError || !profile?.email || profile.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email does not match winner record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: webhookConfig, error: configError } = await supabaseAdmin
      .from('webhook_config')
      .select('webhook_secret, supabase_url')
      .limit(1)
      .single()

    if (configError || !webhookConfig?.webhook_secret) {
      console.error('Failed to get webhook config:', configError)
      throw new Error('Email configuration not available')
    }

    const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://www.babybets.co.uk'
    const accountUrl = `${publicSiteUrl}/account`

    const html = getWinnerPhotoRequestHTML(displayName, prizeName, accountUrl)
    const text = getWinnerPhotoRequestText(displayName, prizeName, accountUrl)

    const emailResponse = await fetch(
      `${webhookConfig.supabase_url}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookConfig.webhook_secret,
        },
        body: JSON.stringify({
          type: 'custom',
          recipientEmail: email,
          recipientName: displayName,
          data: {
            subject: 'Share your BabyBets win with us!',
            html,
            text,
          },
        }),
      }
    )

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Email send error:', errorText)
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Request sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-winner-request:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
