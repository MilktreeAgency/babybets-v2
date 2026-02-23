import { useState, useEffect } from 'react'
import { Cookie, X, Shield, BarChart3, Megaphone, Users } from 'lucide-react'

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
    <>
      {/* Backdrop with blur */}
      <div className="fixed inset-0 z-40 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }} />

      {/* Main banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: '#fffbf7',
              borderWidth: '2px',
              borderColor: '#e7e5e4',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {!showSettings ? (
              <>
                {/* Main Banner */}
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="p-3 rounded-xl shadow-sm"
                      style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                    >
                      <Cookie className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-2xl font-bold mb-3"
                        style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                      >
                        We value your privacy
                      </h3>
                      <p className="text-base leading-relaxed mb-3" style={{ color: '#78716c' }}>
                        We use cookies to enhance your experience, track referrals from our partners, and analyze site traffic.
                        By clicking "Accept All", you consent to our use of cookies.
                      </p>
                      <button
                        onClick={() => window.open('/legal/privacy', '_blank')}
                        className="text-sm font-bold underline transition-colors cursor-pointer"
                        style={{ color: '#496B71' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3a565a'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#496B71'}
                      >
                        Read our Privacy Policy →
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div
                    className="flex flex-col sm:flex-row gap-3 pt-6"
                    style={{ borderTop: '1px solid #e7e5e4' }}
                  >
                    <button
                      onClick={acceptNecessary}
                      className="w-full sm:flex-1 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#151e20',
                        borderWidth: '2px',
                        borderColor: '#e7e5e4'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Necessary Only
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="w-full sm:flex-1 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#496B71',
                        borderWidth: '2px',
                        borderColor: '#496B71'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(73, 107, 113, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Customize
                    </button>
                    <button
                      onClick={acceptAll}
                      className="w-full sm:flex-1 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg"
                      style={{
                        backgroundColor: '#496B71',
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(73, 107, 113, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a565a'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#496B71'
                      }}
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Settings Panel */}
                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-xl shadow-sm"
                        style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                      >
                        <Shield className="w-6 h-6" />
                      </div>
                      <h3
                        className="text-2xl font-bold"
                        style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                      >
                        Cookie Preferences
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 rounded-full transition-colors cursor-pointer"
                      style={{ color: '#78716c' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="text-sm leading-relaxed mb-6" style={{ color: '#78716c' }}>
                    Customize which cookies you want to accept. You can change these settings at any time.
                  </p>

                  {/* Cookie Options */}
                  <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
                    {/* Necessary Cookies */}
                    <div
                      className="flex items-start gap-4 p-5 rounded-xl"
                      style={{
                        backgroundColor: '#f5f5f4',
                        borderWidth: '2px',
                        borderColor: '#e7e5e4'
                      }}
                    >
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{ backgroundColor: '#fffbf7', color: '#78716c' }}
                      >
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm" style={{ color: '#151e20' }}>
                            Necessary Cookies
                          </h4>
                          <div className="flex items-center gap-2">
                            <div
                              className="relative inline-flex h-6 w-11 items-center rounded-full cursor-not-allowed opacity-50"
                              style={{ backgroundColor: '#496B71' }}
                            >
                              <span
                                className="inline-block h-4 w-4 transform rounded-full transition"
                                style={{ backgroundColor: 'white', transform: 'translateX(24px)' }}
                              />
                            </div>
                            <span className="text-xs font-bold" style={{ color: '#78716c' }}>
                              Always On
                            </span>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                          Essential for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div
                      className="flex items-start gap-4 p-5 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: '#fffbf7',
                        borderWidth: '2px',
                        borderColor: preferences.analytics ? '#496B71' : '#e7e5e4'
                      }}
                      onMouseEnter={(e) => {
                        if (!preferences.analytics) {
                          e.currentTarget.style.borderColor = 'rgba(73, 107, 113, 0.5)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!preferences.analytics) {
                          e.currentTarget.style.borderColor = '#e7e5e4'
                        }
                      }}
                    >
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)', color: '#496B71' }}
                      >
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm" style={{ color: '#151e20' }}>
                            Analytics Cookies
                          </h4>
                          <label htmlFor="analytics-switch" className="cursor-pointer">
                            <div
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                              style={{ backgroundColor: preferences.analytics ? '#496B71' : '#d1d5db' }}
                              onClick={(e) => {
                                e.preventDefault()
                                setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))
                              }}
                            >
                              <span
                                className="inline-block h-4 w-4 transform rounded-full transition-transform"
                                style={{
                                  backgroundColor: 'white',
                                  transform: preferences.analytics ? 'translateX(24px)' : 'translateX(4px)'
                                }}
                              />
                            </div>
                          </label>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                          Help us understand how visitors interact with our website to improve your experience.
                        </p>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div
                      className="flex items-start gap-4 p-5 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: '#fffbf7',
                        borderWidth: '2px',
                        borderColor: preferences.marketing ? '#496B71' : '#e7e5e4'
                      }}
                      onMouseEnter={(e) => {
                        if (!preferences.marketing) {
                          e.currentTarget.style.borderColor = 'rgba(73, 107, 113, 0.5)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!preferences.marketing) {
                          e.currentTarget.style.borderColor = '#e7e5e4'
                        }
                      }}
                    >
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)', color: '#496B71' }}
                      >
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm" style={{ color: '#151e20' }}>
                            Marketing Cookies
                          </h4>
                          <label htmlFor="marketing-switch" className="cursor-pointer">
                            <div
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                              style={{ backgroundColor: preferences.marketing ? '#496B71' : '#d1d5db' }}
                              onClick={(e) => {
                                e.preventDefault()
                                setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))
                              }}
                            >
                              <span
                                className="inline-block h-4 w-4 transform rounded-full transition-transform"
                                style={{
                                  backgroundColor: 'white',
                                  transform: preferences.marketing ? 'translateX(24px)' : 'translateX(4px)'
                                }}
                              />
                            </div>
                          </label>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                          Used to deliver personalized advertisements relevant to you and your interests.
                        </p>
                      </div>
                    </div>

                    {/* Affiliate Tracking Cookies */}
                    <div
                      className="flex items-start gap-4 p-5 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: preferences.affiliate_tracking ? 'rgba(73, 107, 113, 0.05)' : '#fffbf7',
                        borderWidth: '2px',
                        borderColor: preferences.affiliate_tracking ? '#496B71' : 'rgba(73, 107, 113, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (!preferences.affiliate_tracking) {
                          e.currentTarget.style.borderColor = '#496B71'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!preferences.affiliate_tracking) {
                          e.currentTarget.style.borderColor = 'rgba(73, 107, 113, 0.3)'
                        }
                      }}
                    >
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{ backgroundColor: 'rgba(73, 107, 113, 0.2)', color: '#496B71' }}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm" style={{ color: '#151e20' }}>
                            Affiliate Tracking Cookies
                          </h4>
                          <label htmlFor="affiliate-switch" className="cursor-pointer">
                            <div
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                              style={{ backgroundColor: preferences.affiliate_tracking ? '#496B71' : '#d1d5db' }}
                              onClick={(e) => {
                                e.preventDefault()
                                setPreferences(prev => ({ ...prev, affiliate_tracking: !prev.affiliate_tracking }))
                              }}
                            >
                              <span
                                className="inline-block h-4 w-4 transform rounded-full transition-transform"
                                style={{
                                  backgroundColor: 'white',
                                  transform: preferences.affiliate_tracking ? 'translateX(24px)' : 'translateX(4px)'
                                }}
                              />
                            </div>
                          </label>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                          Track referrals from our partners to credit them for sales. Helps support our partner program.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div
                    className="flex gap-3 justify-end pt-6"
                    style={{ borderTop: '1px solid #e7e5e4' }}
                  >
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#151e20',
                        borderWidth: '2px',
                        borderColor: '#e7e5e4'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCustomPreferences}
                      className="px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg"
                      style={{
                        backgroundColor: '#496B71',
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(73, 107, 113, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a565a'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#496B71'
                      }}
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
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
