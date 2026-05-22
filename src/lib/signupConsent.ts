export const SIGNUP_MARKETING_CONSENT_KEY = 'bb_signup_marketing_consent'
export const SIGNUP_TERMS_ACCEPTED_KEY = 'bb_signup_terms_accepted'

export function storeSignupConsentForOAuth(marketingConsent: boolean): void {
  sessionStorage.setItem(SIGNUP_MARKETING_CONSENT_KEY, String(marketingConsent))
  sessionStorage.setItem(SIGNUP_TERMS_ACCEPTED_KEY, new Date().toISOString())
}

export function clearSignupConsentFromStorage(): void {
  sessionStorage.removeItem(SIGNUP_MARKETING_CONSENT_KEY)
  sessionStorage.removeItem(SIGNUP_TERMS_ACCEPTED_KEY)
}

export function getPendingSignupMarketingConsent(): boolean | null {
  const value = sessionStorage.getItem(SIGNUP_MARKETING_CONSENT_KEY)
  if (value === null) return null
  return value === 'true'
}
