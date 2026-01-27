import type { Tables } from './database.types'

// Base database types
export type Competition = Tables<'competitions'>
export type TicketAllocation = Tables<'ticket_allocations'>
export type WalletCredit = Tables<'wallet_credits'>
export type WalletTransaction = Tables<'wallet_transactions'>
export type PrizeFulfillment = Tables<'prize_fulfillments'>
export type Order = Tables<'orders'>
export type Profile = Tables<'profiles'>

// Prize types
export type PrizeTemplate = {
  id: string
  name: string
  short_name: string | null
  type: string
  value_gbp: number
  cash_alternative_gbp: number | null
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CompetitionInstantWinPrize = {
  id: string
  competition_id: string
  prize_template_id: string
  prize_code: string
  total_quantity: number
  remaining_quantity: number
  tier: number
  created_at: string
  updated_at: string
}

// Re-export Tables type
export type { Tables }

// Extended types with joined data
export type TicketWithDetails = TicketAllocation & {
  competition: Pick<Competition, 'id' | 'title' | 'slug' | 'image_url' | 'competition_type'>
  prize?: Pick<PrizeTemplate, 'id' | 'name' | 'short_name' | 'type' | 'value_gbp' | 'cash_alternative_gbp' | 'image_url'>
}

export type WalletCreditWithDetails = WalletCredit & {
  isExpiringSoon: boolean
}

export type WalletSummary = {
  totalBalance: number
  availableBalance: number
  expiringBalance: number
  nextExpiryDate: string | null
}

export type PrizeChoice = 'prize' | 'cash'

export type TicketRevealResult = {
  ticketId: string
  hasPrize: boolean
  prize?: PrizeTemplate
}
