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
  referred_by UUID REFERENCES public.profiles(id),
  referral_code TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_profiles_date_of_birth ON public.profiles(date_of_birth);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users(id)';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth for age verification and birthday rewards';
COMMENT ON COLUMN public.profiles.role IS 'User role for access control (user, influencer, admin, super_admin)';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for user to share';
COMMENT ON COLUMN public.profiles.referred_by IS 'User who referred this user';
