export const SIGNUP_MARKETING_CONSENT_KEY = 'bb_signup_marketing_consent'
export const SIGNUP_TERMS_ACCEPTED_KEY = 'bb_signup_terms_accepted'
export const OAUTH_FLOW_KEY = 'bb_oauth_flow'

export type OAuthFlow = 'signup' | 'login'

export function setOAuthFlow(flow: OAuthFlow): void {
  sessionStorage.setItem(OAUTH_FLOW_KEY, flow)
}

export function getOAuthFlow(): OAuthFlow | null {
  const value = sessionStorage.getItem(OAUTH_FLOW_KEY)
  if (value === 'signup' || value === 'login') return value
  return null
}

export function clearOAuthFlow(): void {
  sessionStorage.removeItem(OAUTH_FLOW_KEY)
}

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

export function hasPendingSignupTermsAcceptance(): boolean {
  return sessionStorage.getItem(SIGNUP_TERMS_ACCEPTED_KEY) !== null
}

/** True when the auth user was created moments ago (OAuth auto-registration). */
export function isRecentlyCreatedAuthUser(createdAt: string | undefined): boolean {
  if (!createdAt) return false
  const createdMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdMs)) return false
  return Date.now() - createdMs < 2 * 60 * 1000
}
