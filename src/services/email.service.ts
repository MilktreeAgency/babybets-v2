import { supabase } from '@/lib/supabase'

export interface PrizeWinEmailData {
  prizeName: string
  prizeValue?: number
  prizeDescription?: string
  ticketNumber?: string
  competitionTitle?: string
  claimUrl?: string
}

export interface OrderConfirmationEmailData {
  orderNumber: string
  orderDate?: string
  totalTickets: number
  orderTotal: string
  ticketsUrl?: string
}

export interface WithdrawalRequestEmailData {
  amount: string
  requestDate?: string
  statusUrl?: string
}

export interface WithdrawalApprovedEmailData {
  amount: string
  approvedDate?: string
  paymentMethod?: string
  expectedArrival?: string
  statusUrl?: string
}

export interface CompetitionEndingEmailData {
  competitionTitle: string
  prizeName: string
  prizeValue?: number
  endDate: string
  ticketsRemaining?: number
  competitionUrl?: string
}

export interface WelcomeEmailData {
  welcomeBonus?: string
  competitionsUrl?: string
}

export interface WithdrawalRejectedEmailData {
  amount: string
  rejectedDate?: string
  rejectionReason: string
  statusUrl?: string
}

export interface InfluencerApplicationSubmittedEmailData {
  displayName: string
  reviewUrl?: string
}

export interface InfluencerApprovedEmailData {
  displayName: string
  slug: string
  dashboardUrl?: string
  commissionTier?: number
}

export interface InfluencerRejectedEmailData {
  displayName: string
  rejectionReason?: string
}

export interface PrizeFulfillmentUpdateEmailData {
  prizeName: string
  status: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  notes?: string
}

export interface WalletCreditEmailData {
  amount: string
  description: string
  expiryDate: string
  newBalance: string
  transactionsUrl?: string
}

export interface EmailNotification {
  type: 'prize_win' | 'order_confirmation' | 'withdrawal_request' | 'withdrawal_approved' | 'withdrawal_rejected' | 'competition_ending' | 'welcome' | 'influencer_application_submitted' | 'influencer_approved' | 'influencer_rejected' | 'prize_fulfillment_update' | 'wallet_credit' | 'custom'
  recipientEmail: string
  recipientName?: string
  data: Record<string, unknown>
}

class EmailService {
  /**
   * Send a prize win notification email
   * Non-blocking - returns immediately after queuing
   */
  async sendPrizeWinEmail(
    recipientEmail: string,
    recipientName: string,
    data: PrizeWinEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'prize_win',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send an order confirmation email
   * Non-blocking - returns immediately after queuing
   */
  async sendOrderConfirmationEmail(
    recipientEmail: string,
    recipientName: string,
    data: OrderConfirmationEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'order_confirmation',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a withdrawal request notification
   * Non-blocking - returns immediately after queuing
   */
  async sendWithdrawalRequestEmail(
    recipientEmail: string,
    recipientName: string,
    data: WithdrawalRequestEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'withdrawal_request',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a withdrawal approved notification
   * Non-blocking - returns immediately after queuing
   */
  async sendWithdrawalApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    data: WithdrawalApprovedEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'withdrawal_approved',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a competition ending reminder
   * Non-blocking - returns immediately after queuing
   */
  async sendCompetitionEndingEmail(
    recipientEmail: string,
    recipientName: string,
    data: CompetitionEndingEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'competition_ending',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a welcome email to new users
   * Non-blocking - returns immediately after queuing
   */
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string,
    data?: WelcomeEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'welcome',
      recipientEmail,
      recipientName,
      data: data || {},
    })
  }

  /**
   * Send a withdrawal rejected notification
   * Non-blocking - returns immediately after queuing
   */
  async sendWithdrawalRejectedEmail(
    recipientEmail: string,
    recipientName: string,
    data: WithdrawalRejectedEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'withdrawal_rejected',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send an influencer application submitted confirmation
   * Non-blocking - returns immediately after queuing
   */
  async sendInfluencerApplicationSubmittedEmail(
    recipientEmail: string,
    recipientName: string,
    data: InfluencerApplicationSubmittedEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'influencer_application_submitted',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send an influencer approved notification
   * Non-blocking - returns immediately after queuing
   */
  async sendInfluencerApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    data: InfluencerApprovedEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'influencer_approved',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send an influencer rejected notification
   * Non-blocking - returns immediately after queuing
   */
  async sendInfluencerRejectedEmail(
    recipientEmail: string,
    recipientName: string,
    data: InfluencerRejectedEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'influencer_rejected',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a prize fulfillment update notification
   * Non-blocking - returns immediately after queuing
   */
  async sendPrizeFulfillmentUpdateEmail(
    recipientEmail: string,
    recipientName: string,
    data: PrizeFulfillmentUpdateEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'prize_fulfillment_update',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a wallet credit notification
   * Non-blocking - returns immediately after queuing
   */
  async sendWalletCreditEmail(
    recipientEmail: string,
    recipientName: string,
    data: WalletCreditEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'wallet_credit',
      recipientEmail,
      recipientName,
      data,
    })
  }

  /**
   * Send a custom email
   * Non-blocking - returns immediately after queuing
   */
  async sendCustomEmail(
    recipientEmail: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'custom',
      recipientEmail,
      data: { subject, html, text },
    })
  }

  /**
   * Internal method to send notification via edge function
   * Non-blocking - returns immediately after API call
   */
  private async sendNotification(
    notification: EmailNotification
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    try {
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
      }

      // Call edge function directly using fetch
      const url = `${supabaseUrl}/functions/v1/send-notification-email`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(notification),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge function error response:', errorText)
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()

      return {
        success: true,
        notification_id: data?.notification_id,
      }
    } catch (error) {
      console.error('Error invoking email function:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const emailService = new EmailService()
