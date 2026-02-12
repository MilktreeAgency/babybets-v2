import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getPrizeWinHTML, getPrizeWinText } from './templates/prize-win.ts'
import { getOrderConfirmationHTML, getOrderConfirmationText } from './templates/order-confirmation.ts'
import { getWithdrawalRequestHTML, getWithdrawalRequestText } from './templates/withdrawal-request.ts'
import { getWithdrawalApprovedHTML, getWithdrawalApprovedText } from './templates/withdrawal-approved.ts'
import { getWithdrawalRejectedHTML, getWithdrawalRejectedText } from './templates/withdrawal-rejected.ts'
import { getCompetitionEndingHTML, getCompetitionEndingText } from './templates/competition-ending.ts'
import { getWelcomeHTML, getWelcomeText } from './templates/welcome.ts'
import { getInfluencerApplicationSubmittedHTML, getInfluencerApplicationSubmittedText } from './templates/influencer-application-submitted.ts'
import { getInfluencerApprovedHTML, getInfluencerApprovedText } from './templates/influencer-approved.ts'
import { getInfluencerRejectedHTML, getInfluencerRejectedText } from './templates/influencer-rejected.ts'
import { getPrizeFulfillmentUpdateHTML, getPrizeFulfillmentUpdateText } from './templates/prize-fulfillment-update.ts'
import { getWalletCreditHTML, getWalletCreditText } from './templates/wallet-credit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotification {
  type: 'prize_win' | 'order_confirmation' | 'withdrawal_request' | 'withdrawal_approved' | 'withdrawal_rejected' | 'competition_ending' | 'welcome' | 'influencer_application_submitted' | 'influencer_approved' | 'influencer_rejected' | 'prize_fulfillment_update' | 'wallet_credit' | 'custom'
  recipientEmail: string
  recipientName?: string
  data: Record<string, unknown>
}

/**
 * Get email template based on notification type
 * Templates are imported from separate files in ./templates/
 */
function getEmailTemplate(notification: EmailNotification): { subject: string; html: string; text: string } {
  const { type, recipientName, data } = notification
  const firstName = recipientName || 'there'

  switch (type) {
    case 'prize_win':
      return {
        subject: `🎉 Congratulations! You've Won ${data.prizeName || 'a Prize'}!`,
        html: getPrizeWinHTML(firstName, data),
        text: getPrizeWinText(firstName, data),
      }

    case 'order_confirmation':
      return {
        subject: `Order Confirmation - ${data.orderNumber || 'Your Order'}`,
        html: getOrderConfirmationHTML(firstName, data),
        text: getOrderConfirmationText(firstName, data),
      }

    case 'withdrawal_request':
      return {
        subject: 'Withdrawal Request Received',
        html: getWithdrawalRequestHTML(firstName, data),
        text: getWithdrawalRequestText(firstName, data),
      }

    case 'withdrawal_approved':
      return {
        subject: '✅ Withdrawal Approved - Payment Processing',
        html: getWithdrawalApprovedHTML(firstName, data),
        text: getWithdrawalApprovedText(firstName, data),
      }

    case 'withdrawal_rejected':
      return {
        subject: 'Withdrawal Request Declined',
        html: getWithdrawalRejectedHTML(firstName, data),
        text: getWithdrawalRejectedText(firstName, data),
      }

    case 'competition_ending':
      return {
        subject: `⏰ Last Chance! ${data.competitionTitle || 'Competition'} Ending Soon`,
        html: getCompetitionEndingHTML(firstName, data),
        text: getCompetitionEndingText(firstName, data),
      }

    case 'welcome':
      return {
        subject: '🎉 Welcome to BabyBets!',
        html: getWelcomeHTML(firstName, data),
        text: getWelcomeText(firstName, data),
      }

    case 'influencer_application_submitted':
      return {
        subject: 'BabyBets Partner Application Received',
        html: getInfluencerApplicationSubmittedHTML(firstName, data),
        text: getInfluencerApplicationSubmittedText(firstName, data),
      }

    case 'influencer_approved':
      return {
        subject: '🎉 Welcome to BabyBets Partners!',
        html: getInfluencerApprovedHTML(firstName, data),
        text: getInfluencerApprovedText(firstName, data),
      }

    case 'influencer_rejected':
      return {
        subject: 'BabyBets Partner Application Update',
        html: getInfluencerRejectedHTML(firstName, data),
        text: getInfluencerRejectedText(firstName, data),
      }

    case 'prize_fulfillment_update':
      return {
        subject: `Prize Update: ${data.prizeName || 'Your Prize'}`,
        html: getPrizeFulfillmentUpdateHTML(firstName, data),
        text: getPrizeFulfillmentUpdateText(firstName, data),
      }

    case 'wallet_credit':
      return {
        subject: `£${data.amount || '0.00'} Added to Your BabyBets Wallet!`,
        html: getWalletCreditHTML(firstName, data),
        text: getWalletCreditText(firstName, data),
      }

    case 'custom':
      return {
        subject: (data.subject as string) || 'Notification from BabyBets',
        html: (data.html as string) || (data.text as string) || '',
        text: (data.text as string) || '',
      }

    default:
      throw new Error(`Unknown notification type: ${type}`)
  }
}

/**
 * Main handler - Non-blocking email notification service
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const notification: EmailNotification = await req.json()

    if (!notification.recipientEmail || !notification.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipientEmail, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email template
    const { subject, html, text } = getEmailTemplate(notification)

    // Get Mailgun settings
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN') || 'mail.babybets.co.uk'
    const fromEmail = Deno.env.get('SMTP_FROM') || `noreply@${mailgunDomain}`

    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY not configured')
    }

    // Log notification
    const { data: loggedNotification } = await supabaseClient
      .from('email_notifications')
      .insert({
        type: notification.type,
        recipient_email: notification.recipientEmail,
        status: 'pending',
        data: notification.data,
      })
      .select()
      .single()

    // Send email via Mailgun and update status
    const formData = new FormData()
    formData.append('from', `BabyBets <${fromEmail}>`)
    formData.append('to', notification.recipientEmail)
    formData.append('subject', subject)
    formData.append('text', text)
    formData.append('html', html)

    try {
      const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${mailgunApiKey}`),
        },
        body: formData,
      })

      if (mailgunResponse.ok) {
        // Update to sent status
        if (loggedNotification) {
          await supabaseClient
            .from('email_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', loggedNotification.id)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email sent successfully',
            notification_id: loggedNotification?.id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Mailgun returned an error
        const errorText = await mailgunResponse.text()
        const errorMessage = `Mailgun error: ${mailgunResponse.status} - ${errorText}`

        if (loggedNotification) {
          await supabaseClient
            .from('email_notifications')
            .update({
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', loggedNotification.id)
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: errorMessage,
            notification_id: loggedNotification?.id,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (mailgunError) {
      // Network error or other exception
      const errorMessage = mailgunError instanceof Error ? mailgunError.message : 'Unknown error sending email'
      console.error('Error sending email to Mailgun:', mailgunError)

      if (loggedNotification) {
        await supabaseClient
          .from('email_notifications')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', loggedNotification.id)
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          notification_id: loggedNotification?.id,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in send-notification-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
