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
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
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
  competition: Pick<Competition, 'id' | 'title' | 'slug' | 'image_url' | 'competition_type'> & {
    images?: string[]
  }
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
  allocationResult?: {
    success: boolean
    fulfillment_id?: string
    wallet_credit_id?: string
    winner_id?: string
    message?: string
    prize?: PrizeTemplate
  }
}

// Draw types
export type DrawSnapshot = {
  id: string
  competition_id: string
  snapshot_hash: string
  total_entries: number
  paid_entries: number
  postal_entries: number
  promotional_entries: number
  ticket_ids_json: string[]
  created_at: string
}

export type Draw = {
  id: string
  competition_id: string
  snapshot_id: string
  random_seed: string
  random_source: string
  winner_index: number
  winning_ticket_id: string
  winning_user_id: string
  verification_hash: string
  executed_by: string | null
  executed_at: string
  winner_notified_at: string | null
  created_at: string
}

export type DrawAuditLog = {
  id: string
  draw_id: string | null
  competition_id: string | null
  action: string
  actor_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type DrawExecutionResult = {
  success: boolean
  draw_id: string
  winner_id: string
  snapshot_id: string
  winning_ticket_id: string
  winning_ticket_number: string
  winning_user_id: string
  winner_display_name: string
  winner_index: number
  total_entries: number
  verification_hash: string
  snapshot_hash: string
  message: string
}

export type DrawVerificationResult = {
  valid: boolean
  draw_id: string
  competition_id: string
  checks: {
    snapshot_hash_valid: boolean
    verification_hash_valid: boolean
    winner_index_valid: boolean
  }
  details: {
    total_entries: number
    winner_index: number
    stored_snapshot_hash: string
    computed_snapshot_hash: string
    stored_verification_hash: string
    computed_verification_hash: string
    winning_ticket_id: string
    expected_ticket_id: string
    executed_at: string
  }
  error?: string
}
