import type { Database } from './database.types'

// Re-export Database type
export type { Database }

// Base database types - using proper Database['public']['Tables']['table_name']['Row'] syntax
export type Competition = Database['public']['Tables']['competitions']['Row']
export type TicketAllocation = Database['public']['Tables']['ticket_allocations']['Row']
export type WalletCredit = Database['public']['Tables']['wallet_credits']['Row']
export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row']
export type PrizeFulfillment = Database['public']['Tables']['prize_fulfillments']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type PromoCode = Database['public']['Tables']['promo_codes']['Row']

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

export type InstantWinPrize = {
  id: string
  competition_id: string
  prize_template_id: string
  prize_code: string
  total_quantity: number
  remaining_quantity: number
  tier: number
  created_at: string
  updated_at: string
  // Flattened prize_template properties for convenience
  name: string
  short_name: string | null
  type: string
  value_gbp: number
  cash_alternative_gbp: number | null
  description: string | null
  image_url: string | null
  // Additional computed properties
  value_pence?: number
  win_probability?: number
  claimed_count?: number
  quantity?: number
  prize_template?: PrizeTemplate
}

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
