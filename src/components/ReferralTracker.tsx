import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setReferralFromSlug } from '@/lib/referralTracking'
import { hasAffiliateTrackingConsent } from './CookieConsent'

/**
 * Component that tracks referrals from URL query parameters
 * Checks for ?ref=slug on any page and stores the referral
 * GDPR-compliant: Only tracks if user has consented
 */
export function ReferralTracker() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const refParam = searchParams.get('ref')

    if (refParam) {
      // Check consent first (GDPR compliance)
      if (!hasAffiliateTrackingConsent()) {
        console.log('Affiliate tracking requires user consent. Ref parameter detected but not tracked yet.')
        // Store ref param temporarily to track after consent
        sessionStorage.setItem('pending_ref', refParam)
        return
      }

      // Set referral from slug in URL
      setReferralFromSlug(refParam).then((success) => {
        if (success) {
          console.log('Referral tracked:', refParam)
          // Clear pending ref
          sessionStorage.removeItem('pending_ref')
        }
      })
    }

    // Check if there's a pending ref after consent was given
    const pendingRef = sessionStorage.getItem('pending_ref')
    if (pendingRef && hasAffiliateTrackingConsent()) {
      setReferralFromSlug(pendingRef).then((success) => {
        if (success) {
          console.log('Pending referral tracked:', pendingRef)
          sessionStorage.removeItem('pending_ref')
        }
      })
    }
  }, [searchParams])

  return null
}
