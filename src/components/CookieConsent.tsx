import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const CONSENT_KEY = 'bb_cookie_consent'
const CONSENT_VERSION = '1.0' // Increment to re-prompt users

interface ConsentPreferences {
  necessary: boolean // Always true
  analytics: boolean
  marketing: boolean
  affiliate_tracking: boolean
  version: string
  timestamp: number
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    affiliate_tracking: false,
    version: CONSENT_VERSION,
    timestamp: Date.now()
  })

  useEffect(() => {
    checkConsent()
  }, [])

  const checkConsent = () => {
    const stored = localStorage.getItem(CONSENT_KEY)

    if (!stored) {
      // No consent given, show banner
      setShowBanner(true)
      return
    }

    try {
      const parsed: ConsentPreferences = JSON.parse(stored)

      // Check if consent version is outdated
      if (parsed.version !== CONSENT_VERSION) {
        setShowBanner(true)
        return
      }

      // Check if consent is older than 1 year (GDPR requirement)
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000)
      if (parsed.timestamp < oneYearAgo) {
        setShowBanner(true)
        return
      }

      // Valid consent exists, don't show banner
      setShowBanner(false)
    } catch {
      // Invalid stored data, show banner
      setShowBanner(true)
    }
  }

  const saveConsent = (consent: Partial<ConsentPreferences>) => {
    const fullConsent: ConsentPreferences = {
      necessary: true, // Always true
      analytics: consent.analytics ?? false,
      marketing: consent.marketing ?? false,
      affiliate_tracking: consent.affiliate_tracking ?? false,
      version: CONSENT_VERSION,
      timestamp: Date.now()
    }

    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent))

    // Enable tracking based on consent
    if (fullConsent.affiliate_tracking) {
      // Affiliate tracking is now enabled
      (window as { bbAffiliateTrackingEnabled?: boolean }).bbAffiliateTrackingEnabled = true
    }

    setShowBanner(false)
    setShowSettings(false)
  }

  const acceptAll = () => {
    saveConsent({
      analytics: true,
      marketing: true,
      affiliate_tracking: true
    })
  }

  const acceptNecessary = () => {
    saveConsent({
      analytics: false,
      marketing: false,
      affiliate_tracking: false
    })
  }

  const saveCustomPreferences = () => {
    saveConsent(preferences)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 md:p-6 z-50"
      style={{ borderColor: '#e7e5e4' }}>
      <div className="max-w-7xl mx-auto">
        {!showSettings ? (
          // Main banner
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2" style={{ color: '#151e20' }}>
                🍪 We value your privacy
              </h3>
              <p className="text-sm" style={{ color: '#78716c' }}>
                We use cookies to enhance your experience, track referrals from our partners, and analyze site traffic.
                By clicking "Accept All", you consent to our use of cookies.
              </p>
              <button
                onClick={() => window.open('/legal/privacy', '_blank')}
                className="text-sm text-blue-600 underline mt-2 cursor-pointer hover:text-blue-800"
              >
                Read our Privacy Policy
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={acceptNecessary}
                className="px-6 py-3 rounded-lg border-2 font-bold transition-colors cursor-pointer"
                style={{ borderColor: '#e7e5e4', color: '#151e20' }}
              >
                Necessary Only
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-3 rounded-lg border-2 font-bold transition-colors cursor-pointer"
                style={{ borderColor: '#496B71', color: '#496B71' }}
              >
                Customize
              </button>
              <button
                onClick={acceptAll}
                className="px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Settings panel
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl" style={{ color: '#151e20' }}>
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                style={{ color: '#78716c' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary */}
              <div className="flex items-start justify-between p-4 border-2 rounded-lg" style={{ borderColor: '#e7e5e4' }}>
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>
                    Necessary Cookies
                  </h4>
                  <p className="text-sm" style={{ color: '#78716c' }}>
                    Required for the website to function. Cannot be disabled.
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <input type="checkbox" checked disabled className="w-5 h-5 cursor-not-allowed" />
                  <span className="text-xs font-bold" style={{ color: '#78716c' }}>Always On</span>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between p-4 border-2 rounded-lg" style={{ borderColor: '#e7e5e4' }}>
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>
                    Analytics Cookies
                  </h4>
                  <p className="text-sm" style={{ color: '#78716c' }}>
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between p-4 border-2 rounded-lg" style={{ borderColor: '#e7e5e4' }}>
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>
                    Marketing Cookies
                  </h4>
                  <p className="text-sm" style={{ color: '#78716c' }}>
                    Used to deliver personalized advertisements.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
              </div>

              {/* Affiliate Tracking */}
              <div className="flex items-start justify-between p-4 border-2 rounded-lg" style={{ borderColor: '#496B71', backgroundColor: 'rgba(73, 107, 113, 0.05)' }}>
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>
                    Affiliate Tracking Cookies
                  </h4>
                  <p className="text-sm" style={{ color: '#78716c' }}>
                    Track referrals from our partners to credit them for sales. Helps support our partner program.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.affiliate_tracking}
                  onChange={(e) => setPreferences(prev => ({ ...prev, affiliate_tracking: e.target.checked }))}
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-3 rounded-lg border-2 font-bold transition-colors cursor-pointer"
                style={{ borderColor: '#e7e5e4', color: '#151e20' }}
              >
                Back
              </button>
              <button
                onClick={saveCustomPreferences}
                className="px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Check if user has consented to affiliate tracking
 */
export function hasAffiliateTrackingConsent(): boolean {
  // Check global flag first (set when consent is saved)
  if ((window as { bbAffiliateTrackingEnabled?: boolean }).bbAffiliateTrackingEnabled) {
    return true
  }

  // Check localStorage
  const stored = localStorage.getItem(CONSENT_KEY)
  if (!stored) return false

  try {
    const parsed: ConsentPreferences = JSON.parse(stored)

    // Check version and expiry
    if (parsed.version !== CONSENT_VERSION) return false

    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000)
    if (parsed.timestamp < oneYearAgo) return false

    // Set global flag for faster checks
    if (parsed.affiliate_tracking) {
      (window as { bbAffiliateTrackingEnabled?: boolean }).bbAffiliateTrackingEnabled = true
    }

    return parsed.affiliate_tracking
  } catch {
    return false
  }
}
