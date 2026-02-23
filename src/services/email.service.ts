export interface PrizeWinEmailData extends Record<string, unknown> {
  prizeName: string
  prizeValue?: number
  prizeDescription?: string
  ticketNumber?: string
  competitionTitle?: string
  claimUrl?: string
}

export interface OrderConfirmationEmailData extends Record<string, unknown> {
  orderNumber: string
  orderDate?: string
  totalTickets: number
  orderTotal: string
  ticketsUrl?: string
}

export interface WithdrawalRequestEmailData extends Record<string, unknown> {
  amount: string
  requestDate?: string
  statusUrl?: string
}

export interface WithdrawalApprovedEmailData extends Record<string, unknown> {
  amount: string
  approvedDate?: string
  paymentMethod?: string
  expectedArrival?: string
  statusUrl?: string
}

export interface CompetitionEndingEmailData extends Record<string, unknown> {
  competitionTitle: string
  prizeName: string
  prizeValue?: number
  endDate: string
  ticketsRemaining?: number
  competitionUrl?: string
}

export interface WelcomeEmailData extends Record<string, unknown> {
  welcomeBonus?: string
  competitionsUrl?: string
}

export interface WithdrawalRejectedEmailData extends Record<string, unknown> {
  amount: string
  rejectedDate?: string
  rejectionReason: string
  statusUrl?: string
}

export interface InfluencerApplicationSubmittedEmailData extends Record<string, unknown> {
  displayName: string
  reviewUrl?: string
}

export interface InfluencerApprovedEmailData extends Record<string, unknown> {
  displayName: string
  slug: string
  dashboardUrl?: string
  commissionTier?: number
}

export interface InfluencerApprovedWithPasswordEmailData extends Record<string, unknown> {
  displayName: string
  slug: string
  temporaryPassword: string
  loginUrl?: string
  dashboardUrl?: string
  commissionTier?: number
}

export interface InfluencerRejectedEmailData extends Record<string, unknown> {
  displayName: string
  rejectionReason?: string
}

export interface PrizeFulfillmentUpdateEmailData extends Record<string, unknown> {
  prizeName: string
  status: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  notes?: string
}

export interface WalletCreditEmailData extends Record<string, unknown> {
  amount: string
  description: string
  expiryDate: string
  newBalance: string
  transactionsUrl?: string
}

export interface EmailNotification {
  type: 'prize_win' | 'order_confirmation' | 'withdrawal_request' | 'withdrawal_approved' | 'withdrawal_rejected' | 'competition_ending' | 'welcome' | 'influencer_application_submitted' | 'influencer_approved' | 'influencer_approved_with_password' | 'influencer_rejected' | 'prize_fulfillment_update' | 'wallet_credit' | 'custom'
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
   * Send an influencer approved notification with temporary password
   * Used when approving applications submitted without a user account
   * Non-blocking - returns immediately after queuing
   */
  async sendInfluencerApprovedWithPasswordEmail(
    recipientEmail: string,
    recipientName: string,
    data: InfluencerApprovedWithPasswordEmailData
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    return this.sendNotification({
      type: 'influencer_approved_with_password',
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
