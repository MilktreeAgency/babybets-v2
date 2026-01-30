-- ============================================
-- BABYBETS DATABASE SCHEMA - TABLES
-- Description: All table definitions in proper FK dependency order
-- Version: 1.0 (Consolidated from incremental migrations)
-- ============================================

-- ============================================
-- TABLE: profiles
-- Description: User profiles extending Supabase auth.users
-- Dependencies: auth.users (Supabase built-in)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  role user_role DEFAULT 'user',
  avatar_url TEXT,

  -- Address fields
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'UK',

  -- Marketing preferences
  marketing_email BOOLEAN DEFAULT false,
  marketing_sms BOOLEAN DEFAULT false,

  -- Referral tracking
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_profiles_date_of_birth ON public.profiles(date_of_birth);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users(id)';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth for age verification and birthday rewards';
COMMENT ON COLUMN public.profiles.role IS 'User role for access control (user, influencer, admin, super_admin)';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for user to share';
COMMENT ON COLUMN public.profiles.referred_by IS 'User who referred this user';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Profile avatar URL (from OAuth providers or uploaded)';

-- ============================================
-- TABLE: competitions
-- Description: Competition definitions (standard and instant win)
-- Dependencies: None
-- ============================================

CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  category competition_category NOT NULL,
  status competition_status DEFAULT 'draft',
  competition_type competition_type NOT NULL,

  -- Dates
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  draw_datetime TIMESTAMPTZ,

  -- Ticket configuration
  max_tickets INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  max_tickets_per_user INTEGER DEFAULT 100,
  base_ticket_price_pence INTEGER NOT NULL,

  -- Tiered pricing (JSONB array)
  -- Format: [{ "minQty": 1, "maxQty": 9, "pricePerTicketPence": 200 }, ...]
  tiered_pricing JSONB DEFAULT '[]',

  -- Legacy bundle pricing for standard competitions
  bundles JSONB DEFAULT '[]',

  -- Prize values
  total_value_gbp DECIMAL(10,2) NOT NULL,
  retail_value_gbp DECIMAL(10,2),
  cash_alternative_gbp DECIMAL(10,2),

  -- End prize for instant win competitions
  end_prize JSONB,

  -- Ticket pool config
  ticket_pool_locked BOOLEAN DEFAULT false,
  ticket_pool_generated_at TIMESTAMPTZ,

  -- Flags
  is_featured BOOLEAN DEFAULT false,
  show_on_homepage BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitions_status ON public.competitions(status);
CREATE INDEX idx_competitions_category ON public.competitions(category);
CREATE INDEX idx_competitions_slug ON public.competitions(slug);
CREATE INDEX idx_competitions_featured ON public.competitions(is_featured) WHERE is_featured = true;
CREATE INDEX idx_competitions_type ON public.competitions(competition_type);
CREATE INDEX idx_competitions_end_datetime ON public.competitions(end_datetime);

COMMENT ON TABLE public.competitions IS 'Competition definitions for standard and instant win competitions';
COMMENT ON COLUMN public.competitions.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.competitions.competition_type IS 'Type: standard, instant_win, or instant_win_with_end_prize';
COMMENT ON COLUMN public.competitions.base_ticket_price_pence IS 'Base price per ticket in pence';
COMMENT ON COLUMN public.competitions.tiered_pricing IS 'JSON array of pricing tiers based on quantity';
COMMENT ON COLUMN public.competitions.cash_alternative_gbp IS 'Optional cash alternative value for the main prize (standard competitions)';
COMMENT ON COLUMN public.competitions.end_prize IS 'Optional end draw prize for instant win competitions';
COMMENT ON COLUMN public.competitions.ticket_pool_locked IS 'True when ticket pool is generated and locked';
COMMENT ON COLUMN public.competitions.images IS 'Array of image URLs for gallery';

-- ============================================
-- TABLE: prize_templates
-- Description: Master prize library/catalog for reusable prizes
-- Dependencies: None
-- ============================================

CREATE TABLE public.prize_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prize details
  name TEXT NOT NULL,
  short_name TEXT,
  type prize_type NOT NULL,
  value_gbp DECIMAL(10,2) NOT NULL,
  cash_alternative_gbp DECIMAL(10,2),

  -- Content
  description TEXT,
  image_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prize_templates_active ON public.prize_templates(is_active);
CREATE INDEX idx_prize_templates_type ON public.prize_templates(type);
CREATE INDEX idx_prize_templates_value ON public.prize_templates(value_gbp DESC);

COMMENT ON TABLE public.prize_templates IS 'Master prize library/catalog for reusable prizes across competitions';
COMMENT ON COLUMN public.prize_templates.name IS 'Full display name of the prize';
COMMENT ON COLUMN public.prize_templates.short_name IS 'Abbreviated name for compact displays';
COMMENT ON COLUMN public.prize_templates.type IS 'Prize type: Physical, Voucher, Cash, or SiteCredit';
COMMENT ON COLUMN public.prize_templates.cash_alternative_gbp IS 'Optional cash alternative value for physical prizes';
COMMENT ON COLUMN public.prize_templates.is_active IS 'Whether this prize is available for selection in new competitions';

-- ============================================
-- TABLE: competition_instant_win_prizes
-- Description: Junction table linking prize templates to competitions with competition-specific settings
-- Dependencies: competitions, prize_templates
-- ============================================

CREATE TABLE public.competition_instant_win_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  prize_template_id UUID NOT NULL REFERENCES public.prize_templates(id) ON DELETE RESTRICT,

  -- Competition-specific prize settings
  prize_code TEXT NOT NULL, -- e.g., "PR-001", unique per competition
  total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  tier INTEGER DEFAULT 1 CHECK (tier > 0), -- Display ordering (1 = highest value)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(competition_id, prize_code),
  UNIQUE(competition_id, prize_template_id), -- Prevent same prize being added twice to a competition
  CHECK (remaining_quantity <= total_quantity)
);

CREATE INDEX idx_comp_prizes_competition ON public.competition_instant_win_prizes(competition_id);
CREATE INDEX idx_comp_prizes_template ON public.competition_instant_win_prizes(prize_template_id);
CREATE INDEX idx_comp_prizes_tier ON public.competition_instant_win_prizes(competition_id, tier);
CREATE INDEX idx_comp_prizes_remaining ON public.competition_instant_win_prizes(competition_id)
  WHERE remaining_quantity > 0;

COMMENT ON TABLE public.competition_instant_win_prizes IS 'Links prize templates to competitions with competition-specific quantities and settings';
COMMENT ON COLUMN public.competition_instant_win_prizes.prize_code IS 'Unique code for the prize within this competition (e.g., PR-001)';
COMMENT ON COLUMN public.competition_instant_win_prizes.total_quantity IS 'Total number of this prize available in the competition';
COMMENT ON COLUMN public.competition_instant_win_prizes.remaining_quantity IS 'Number of this prize still available to be won';
COMMENT ON COLUMN public.competition_instant_win_prizes.tier IS 'Display order tier (1 = highest value)';

-- ============================================
-- TABLE: promo_codes
-- Description: Promotional discount codes
-- Dependencies: None
-- ============================================

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type promo_code_type NOT NULL,

  -- Value
  value INTEGER NOT NULL,

  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Validity
  min_order_pence INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Restrictions
  competition_ids UUID[] DEFAULT '{}',
  new_customers_only BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_promo_codes_valid ON public.promo_codes(valid_from, valid_until)
  WHERE is_active = true;

COMMENT ON TABLE public.promo_codes IS 'Promotional discount codes for orders';
COMMENT ON COLUMN public.promo_codes.code IS 'Unique promo code string (case-insensitive)';
COMMENT ON COLUMN public.promo_codes.type IS 'Discount type: percentage, fixed_value, or free_tickets';
COMMENT ON COLUMN public.promo_codes.value IS 'Discount value (percentage 0-100 or pence amount)';
COMMENT ON COLUMN public.promo_codes.competition_ids IS 'Empty array = all competitions, otherwise specific competition IDs';
COMMENT ON COLUMN public.promo_codes.new_customers_only IS 'True if code only valid for new customers';

-- ============================================
-- TABLE: orders
-- Description: Customer orders for ticket purchases
-- Dependencies: profiles, promo_codes
-- ============================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Order details
  status order_status DEFAULT 'pending',

  -- Amounts in pence
  subtotal_pence INTEGER NOT NULL,
  discount_pence INTEGER DEFAULT 0,
  credit_applied_pence INTEGER DEFAULT 0,
  total_pence INTEGER NOT NULL,

  -- Promo code
  promo_code_id UUID REFERENCES public.promo_codes(id),
  promo_code_value TEXT,

  -- Influencer tracking
  influencer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  influencer_code TEXT,

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_influencer ON public.orders(influencer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_stripe_payment_intent ON public.orders(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

COMMENT ON TABLE public.orders IS 'Customer orders for ticket purchases';
COMMENT ON COLUMN public.orders.subtotal_pence IS 'Order subtotal before discounts in pence';
COMMENT ON COLUMN public.orders.discount_pence IS 'Promo code discount amount in pence';
COMMENT ON COLUMN public.orders.credit_applied_pence IS 'Wallet credit applied in pence';
COMMENT ON COLUMN public.orders.total_pence IS 'Final order total in pence';
COMMENT ON COLUMN public.orders.influencer_code IS 'Influencer/affiliate code used for tracking';

-- ============================================
-- TABLE: order_items
-- Description: Line items within orders
-- Dependencies: orders, competitions
-- ============================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Ticket details
  ticket_count INTEGER NOT NULL,
  price_per_ticket_pence INTEGER NOT NULL,
  total_pence INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_competition ON public.order_items(competition_id);

COMMENT ON TABLE public.order_items IS 'Line items representing competition entries within orders';
COMMENT ON COLUMN public.order_items.ticket_count IS 'Number of tickets purchased for this competition';
COMMENT ON COLUMN public.order_items.price_per_ticket_pence IS 'Price per ticket in pence (tiered pricing)';
COMMENT ON COLUMN public.order_items.total_pence IS 'Total for this line item in pence';

-- ============================================
-- TABLE: ticket_allocations
-- Description: Pre-generated ticket pool with prize allocations
-- Dependencies: competitions, competition_instant_win_prizes, profiles
-- ============================================

CREATE TABLE public.ticket_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,

  -- Prize allocation (null = no instant win)
  prize_id UUID REFERENCES public.competition_instant_win_prizes(id) ON DELETE SET NULL,

  -- Claim tracking
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMPTZ,
  sold_to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID,

  -- Reveal tracking (for instant wins)
  is_revealed BOOLEAN DEFAULT false,
  revealed_at TIMESTAMPTZ,

  -- Main draw winner flag
  is_main_winner BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competition_id, ticket_number)
);

CREATE INDEX idx_ticket_allocations_competition ON public.ticket_allocations(competition_id);
CREATE INDEX idx_ticket_allocations_user ON public.ticket_allocations(sold_to_user_id);
CREATE INDEX idx_ticket_allocations_order ON public.ticket_allocations(order_id);
CREATE INDEX idx_ticket_allocations_unsold ON public.ticket_allocations(competition_id)
  WHERE is_sold = false;
CREATE INDEX idx_ticket_allocations_unrevealed ON public.ticket_allocations(sold_to_user_id)
  WHERE is_sold = true AND is_revealed = false;
CREATE INDEX idx_ticket_allocations_main_winner ON public.ticket_allocations(competition_id)
  WHERE is_main_winner = true;

COMMENT ON TABLE public.ticket_allocations IS 'Pre-generated ticket pool with instant win prize allocations';
COMMENT ON COLUMN public.ticket_allocations.ticket_number IS '7-digit unique ticket code';
COMMENT ON COLUMN public.ticket_allocations.prize_id IS 'Reference to competition instant win prize (null = no instant win)';
COMMENT ON COLUMN public.ticket_allocations.is_revealed IS 'True when user has revealed/scratched the ticket';
COMMENT ON COLUMN public.ticket_allocations.is_main_winner IS 'True if this ticket won the main prize draw';

-- ============================================
-- TABLE: wallet_credits
-- Description: User wallet credits (site credit)
-- Dependencies: profiles, competitions, ticket_allocations, competition_instant_win_prizes, orders
-- ============================================

CREATE TABLE public.wallet_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Amounts
  amount_pence INTEGER NOT NULL,
  remaining_pence INTEGER NOT NULL,
  status credit_status DEFAULT 'active',

  -- Source tracking
  source_type TEXT NOT NULL,
  source_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  source_ticket_id UUID REFERENCES public.ticket_allocations(id),
  source_order_id UUID REFERENCES public.orders(id),
  source_prize_id UUID REFERENCES public.competition_instant_win_prizes(id) ON DELETE SET NULL,

  -- Description
  description TEXT NOT NULL,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_credits_user ON public.wallet_credits(user_id);
CREATE INDEX idx_wallet_credits_active ON public.wallet_credits(user_id, status)
  WHERE status = 'active';
CREATE INDEX idx_wallet_credits_expiring ON public.wallet_credits(user_id, expires_at)
  WHERE status = 'active';
CREATE INDEX idx_wallet_credits_source_type ON public.wallet_credits(source_type);

COMMENT ON TABLE public.wallet_credits IS 'User wallet credits (site credit) with expiry tracking';
COMMENT ON COLUMN public.wallet_credits.amount_pence IS 'Original credit amount in pence';
COMMENT ON COLUMN public.wallet_credits.remaining_pence IS 'Remaining credit amount in pence';
COMMENT ON COLUMN public.wallet_credits.source_type IS 'Source: instant_win, promo, refund, manual, referral';
COMMENT ON COLUMN public.wallet_credits.expires_at IS 'Credit expiration date';

-- ============================================
-- TABLE: wallet_transactions
-- Description: Wallet transaction ledger
-- Dependencies: profiles, wallet_credits, orders
-- ============================================

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credit_id UUID REFERENCES public.wallet_credits(id),

  -- Transaction details
  type wallet_transaction_type NOT NULL,
  amount_pence INTEGER NOT NULL,
  balance_after_pence INTEGER NOT NULL,

  -- References
  order_id UUID REFERENCES public.orders(id),

  -- Description
  description TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_credit ON public.wallet_transactions(credit_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);

COMMENT ON TABLE public.wallet_transactions IS 'Immutable ledger of all wallet transactions';
COMMENT ON COLUMN public.wallet_transactions.type IS 'Transaction type: credit, debit, expiry, revocation, withdrawal';
COMMENT ON COLUMN public.wallet_transactions.amount_pence IS 'Transaction amount in pence (positive for credit, negative for debit)';
COMMENT ON COLUMN public.wallet_transactions.balance_after_pence IS 'User wallet balance after this transaction';

-- ============================================
-- TABLE: winners
-- Description: Public winner records for social proof
-- Dependencies: profiles, competitions, ticket_allocations
-- ============================================

CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Display info (can be anonymous)
  display_name TEXT NOT NULL,
  location TEXT,

  -- Prize details
  prize_name TEXT NOT NULL,
  prize_value_gbp DECIMAL(10,2),
  prize_image_url TEXT,

  -- References
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.ticket_allocations(id),

  -- Win type
  win_type TEXT DEFAULT 'instant_win',

  -- Display control
  is_public BOOLEAN DEFAULT true,
  show_in_ticker BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,

  -- Winner photo (for social proof)
  winner_photo_url TEXT,
  testimonial TEXT,

  -- Timestamps
  won_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_winners_recent ON public.winners(won_at DESC);
CREATE INDEX idx_winners_ticker ON public.winners(show_in_ticker, won_at DESC)
  WHERE show_in_ticker = true;
CREATE INDEX idx_winners_public ON public.winners(is_public, won_at DESC)
  WHERE is_public = true;
CREATE INDEX idx_winners_featured ON public.winners(featured) WHERE featured = true;
CREATE INDEX idx_winners_competition ON public.winners(competition_id);

COMMENT ON TABLE public.winners IS 'Public winner records for social proof and winner gallery';
COMMENT ON COLUMN public.winners.display_name IS 'Public display name (e.g., "Sarah J.")';
COMMENT ON COLUMN public.winners.win_type IS 'Type of win: instant_win, end_prize, or manual';
COMMENT ON COLUMN public.winners.show_in_ticker IS 'Show in homepage winner ticker';
COMMENT ON COLUMN public.winners.featured IS 'Featured winner for homepage spotlight';

-- ============================================
-- TABLE: prize_fulfillments
-- Description: Prize fulfillment tracking and delivery
-- Dependencies: profiles, ticket_allocations, competition_instant_win_prizes, competitions
-- ============================================

CREATE TABLE public.prize_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.ticket_allocations(id),
  prize_id UUID REFERENCES public.competition_instant_win_prizes(id) ON DELETE SET NULL,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Status
  status fulfillment_status DEFAULT 'pending',

  -- Choice (for prizes with cash alternative)
  choice TEXT,
  value_pence INTEGER NOT NULL,

  -- Deadlines
  claim_deadline TIMESTAMPTZ NOT NULL,

  -- Tracking
  notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Delivery info
  tracking_number TEXT,
  delivery_address JSONB,

  -- Payment info (for cash alternatives)
  payment_method TEXT,
  payment_reference TEXT,
  payment_date TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prize_fulfillments_user ON public.prize_fulfillments(user_id);
CREATE INDEX idx_prize_fulfillments_status ON public.prize_fulfillments(status);
CREATE INDEX idx_prize_fulfillments_pending ON public.prize_fulfillments(status, claim_deadline)
  WHERE status = 'pending';
CREATE INDEX idx_prize_fulfillments_competition ON public.prize_fulfillments(competition_id);

COMMENT ON TABLE public.prize_fulfillments IS 'Prize fulfillment tracking and delivery management';
COMMENT ON COLUMN public.prize_fulfillments.choice IS 'Winner choice: prize or cash (for prizes with cash alternative)';
COMMENT ON COLUMN public.prize_fulfillments.value_pence IS 'Value of prize or cash alternative in pence';
COMMENT ON COLUMN public.prize_fulfillments.claim_deadline IS 'Deadline for winner to respond and claim prize';
COMMENT ON COLUMN public.prize_fulfillments.delivery_address IS 'JSON object with delivery address details';
COMMENT ON COLUMN public.prize_fulfillments.payment_method IS 'Payment method for cash alternatives (bank_transfer, paypal, etc.)';
COMMENT ON COLUMN public.prize_fulfillments.payment_reference IS 'Payment reference or transaction ID';
COMMENT ON COLUMN public.prize_fulfillments.payment_date IS 'Date when cash payment was processed';

-- ============================================
-- TABLE: influencers
-- Description: Influencer/partner profiles and tracking
-- Dependencies: profiles, competitions
-- ============================================

CREATE TABLE public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Profile
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,

  -- Partner page content
  page_bio TEXT,
  page_image_url TEXT,
  total_followers TEXT,
  primary_platform TEXT,

  -- Featured competition
  featured_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,

  -- Commission tier
  commission_tier INTEGER DEFAULT 1,

  -- Social links
  social_links JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_ambassador BOOLEAN DEFAULT false,

  -- Stats (denormalized for performance)
  total_sales_pence INTEGER DEFAULT 0,
  total_commission_pence INTEGER DEFAULT 0,
  monthly_sales_pence INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_influencers_slug ON public.influencers(slug);
CREATE INDEX idx_influencers_user ON public.influencers(user_id);
CREATE INDEX idx_influencers_active ON public.influencers(is_active) WHERE is_active = true;
CREATE INDEX idx_influencers_ambassador ON public.influencers(is_ambassador) WHERE is_ambassador = true;

COMMENT ON TABLE public.influencers IS 'Influencer and partner profiles with commission tracking';
COMMENT ON COLUMN public.influencers.slug IS 'URL-friendly unique identifier for partner page';
COMMENT ON COLUMN public.influencers.commission_tier IS 'Commission tier: 1=10%, 2=15%, 3=20%, 4=25%';
COMMENT ON COLUMN public.influencers.social_links IS 'JSON object with social media links';
COMMENT ON COLUMN public.influencers.is_ambassador IS 'True for brand ambassadors with special features';

-- ============================================
-- TABLE: influencer_sales
-- Description: Commission tracking for influencer sales
-- Dependencies: influencers, orders
-- ============================================

CREATE TABLE public.influencer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),

  -- Amounts
  order_value_pence INTEGER NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_pence INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_influencer_sales_influencer ON public.influencer_sales(influencer_id);
CREATE INDEX idx_influencer_sales_order ON public.influencer_sales(order_id);
CREATE INDEX idx_influencer_sales_status ON public.influencer_sales(status);
CREATE INDEX idx_influencer_sales_created_at ON public.influencer_sales(created_at DESC);

COMMENT ON TABLE public.influencer_sales IS 'Commission tracking for influencer-attributed sales';
COMMENT ON COLUMN public.influencer_sales.commission_rate IS 'Commission rate as decimal (e.g., 0.1500 for 15%)';
COMMENT ON COLUMN public.influencer_sales.status IS 'Status: pending, approved, paid, or cancelled';
COMMENT ON COLUMN public.influencer_sales.paid_at IS 'Timestamp when commission was paid to influencer';

-- ============================================
-- TABLE: withdrawal_requests
-- Description: User wallet withdrawal requests
-- Dependencies: profiles
-- ============================================

CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Amount
  amount_pence INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Bank details
  bank_details JSONB,
  bank_sort_code TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,

  -- Admin
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_pending ON public.withdrawal_requests(status, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at DESC);

COMMENT ON TABLE public.withdrawal_requests IS 'User wallet withdrawal requests and admin approval tracking';
COMMENT ON COLUMN public.withdrawal_requests.status IS 'Status: pending, approved, rejected, or paid';
COMMENT ON COLUMN public.withdrawal_requests.bank_sort_code IS 'UK bank sort code (format: XX-XX-XX)';
COMMENT ON COLUMN public.withdrawal_requests.bank_account_number IS 'UK bank account number (8 digits)';
COMMENT ON COLUMN public.withdrawal_requests.bank_account_name IS 'Name on the bank account';

-- ============================================
-- TABLE: email_notifications
-- Description: Email notification tracking and logging
-- Dependencies: None
-- ============================================

CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  recipient_email TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_notifications_type ON public.email_notifications(type);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_created_at ON public.email_notifications(created_at DESC);
CREATE INDEX idx_email_notifications_recipient ON public.email_notifications(recipient_email);

COMMENT ON TABLE public.email_notifications IS 'Email notification logs for debugging and resending';
COMMENT ON COLUMN public.email_notifications.type IS 'Email type (e.g., prize_win, order_confirmation, withdrawal_approved)';
COMMENT ON COLUMN public.email_notifications.data IS 'JSON data payload for the email template';
COMMENT ON COLUMN public.email_notifications.status IS 'Status: pending, sent, or failed';

-- ============================================
-- DRAW SYSTEM TABLES
-- Description: Cryptographically secure competition draws
-- ============================================

-- TABLE: draw_snapshots
CREATE TABLE public.draw_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Snapshot integrity
  snapshot_hash TEXT NOT NULL,
  total_entries INTEGER NOT NULL,
  paid_entries INTEGER NOT NULL,
  postal_entries INTEGER DEFAULT 0,
  promotional_entries INTEGER DEFAULT 0,

  -- Ticket data
  ticket_ids_json JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draw_snapshots_competition ON public.draw_snapshots(competition_id);

COMMENT ON TABLE public.draw_snapshots IS 'Deterministic snapshots of all tickets for competition draws';
COMMENT ON COLUMN public.draw_snapshots.snapshot_hash IS 'SHA-256 hash of ordered ticket IDs for verification';
COMMENT ON COLUMN public.draw_snapshots.ticket_ids_json IS 'Ordered array of all valid ticket IDs in the draw';

-- TABLE: draws
CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.draw_snapshots(id) ON DELETE CASCADE,

  -- Random selection
  random_seed TEXT NOT NULL,
  random_source TEXT DEFAULT 'crypto.randomBytes',
  winner_index INTEGER NOT NULL,

  -- Winner
  winning_ticket_id UUID REFERENCES public.ticket_allocations(id) ON DELETE SET NULL,
  winning_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Verification
  verification_hash TEXT NOT NULL,

  -- Execution metadata
  executed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Winner notification
  winner_notified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draws_competition ON public.draws(competition_id);
CREATE INDEX idx_draws_winning_user ON public.draws(winning_user_id);
CREATE INDEX idx_draws_executed_at ON public.draws(executed_at);

COMMENT ON TABLE public.draws IS 'Draw execution records with cryptographic proof for audit trail';
COMMENT ON COLUMN public.draws.random_seed IS 'Cryptographically secure random seed used for winner selection';
COMMENT ON COLUMN public.draws.verification_hash IS 'Triple hash for independent verification: SHA-256(snapshot_hash + seed + index)';

-- TABLE: draw_audit_log
CREATE TABLE public.draw_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draw_audit_log_draw ON public.draw_audit_log(draw_id);
CREATE INDEX idx_draw_audit_log_competition ON public.draw_audit_log(competition_id);
CREATE INDEX idx_draw_audit_log_actor ON public.draw_audit_log(actor_id);
CREATE INDEX idx_draw_audit_log_created_at ON public.draw_audit_log(created_at);

COMMENT ON TABLE public.draw_audit_log IS 'Audit trail of all draw-related actions for compliance';
COMMENT ON COLUMN public.draw_audit_log.action IS 'Type of action performed (draw_executed, verified, cancelled, etc.)';
COMMENT ON COLUMN public.draw_audit_log.details IS 'JSONB object with action-specific details';
