// Referral tracking utilities
const REFERRAL_KEY = 'babybets_referral'
const REFERRAL_EXPIRY_DAYS = 30

interface ReferralData {
  influencerId: string
  influencerSlug: string
  timestamp: number
}

/**
 * Set referral data in localStorage
 * @param influencerId - The influencer's ID
 * @param influencerSlug - The influencer's slug for debugging
 */
export function setReferral(influencerId: string, influencerSlug: string): void {
  const referralData: ReferralData = {
    influencerId,
    influencerSlug,
    timestamp: Date.now()
  }

  localStorage.setItem(REFERRAL_KEY, JSON.stringify(referralData))
}

/**
 * Get referral data from localStorage if not expired
 * @returns ReferralData or null if expired or not found
 */
export function getReferral(): ReferralData | null {
  const stored = localStorage.getItem(REFERRAL_KEY)

  if (!stored) return null

  try {
    const data: ReferralData = JSON.parse(stored)
    const expiryTime = data.timestamp + (REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    // Check if expired
    if (Date.now() > expiryTime) {
      clearReferral()
      return null
    }

    return data
  } catch (error) {
    console.error('Error parsing referral data:', error)
    clearReferral()
    return null
  }
}

/**
 * Clear referral data from localStorage
 */
export function clearReferral(): void {
  localStorage.removeItem(REFERRAL_KEY)
}

/**
 * Check if a referral is currently active
 */
export function hasActiveReferral(): boolean {
  return getReferral() !== null
}

/**
 * Set referral from slug (looks up influencer ID from database)
 * @param slug - The influencer's slug
 */
export async function setReferralFromSlug(slug: string): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase')

    const { data: influencer, error } = await supabase
      .from('influencers')
      .select('id, slug')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !influencer) {
      console.error('Influencer not found:', slug)
      return false
    }

    setReferral(influencer.id, influencer.slug)
    return true
  } catch (error) {
    console.error('Error setting referral from slug:', error)
    return false
  }
}
