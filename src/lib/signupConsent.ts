export const SIGNUP_MARKETING_CONSENT_KEY = 'bb_signup_marketing_consent'
export const SIGNUP_TERMS_ACCEPTED_KEY = 'bb_signup_terms_accepted'
export const OAUTH_FLOW_KEY = 'bb_oauth_flow'
export const LOGIN_OAUTH_INTENT_KEY = 'bb_login_oauth_intent'

export type OAuthFlow = 'signup' | 'login'

export function setOAuthFlow(flow: OAuthFlow): void {
  sessionStorage.setItem(OAUTH_FLOW_KEY, flow)
  localStorage.setItem(OAUTH_FLOW_KEY, flow)
}

export function getOAuthFlow(): OAuthFlow | null {
  const value = sessionStorage.getItem(OAUTH_FLOW_KEY) ?? localStorage.getItem(OAUTH_FLOW_KEY)
  if (value === 'signup' || value === 'login') return value
  return null
}

export function clearOAuthFlow(): void {
  sessionStorage.removeItem(OAUTH_FLOW_KEY)
  localStorage.removeItem(OAUTH_FLOW_KEY)
}

export function setLoginOAuthIntent(): void {
  localStorage.setItem(LOGIN_OAUTH_INTENT_KEY, '1')
}

export function consumeLoginOAuthIntent(): boolean {
  const value = localStorage.getItem(LOGIN_OAUTH_INTENT_KEY) === '1'
  localStorage.removeItem(LOGIN_OAUTH_INTENT_KEY)
  return value
}

/** Resolve OAuth flow from callback URL (survives Google redirect) with sessionStorage fallback. */
export function resolveOAuthFlow(searchParams: URLSearchParams): OAuthFlow | null {
  const fromUrl = searchParams.get('flow')
  if (fromUrl === 'signup' || fromUrl === 'login') return fromUrl
  return getOAuthFlow()
}

export function buildOAuthCallbackUrl(flow: OAuthFlow, termsAccepted = false): string {
  const params = new URLSearchParams({ flow })
  if (flow === 'signup' && termsAccepted) {
    params.set('terms', '1')
  }
  return `${window.location.origin}/auth/callback?${params.toString()}`
}

export function hasSignupTermsAcceptance(searchParams: URLSearchParams): boolean {
  return searchParams.get('terms') === '1' || hasPendingSignupTermsAcceptance()
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
  return Date.now() - createdMs < 10 * 60 * 1000
}

/** Sign-up flow if URL, storage, or terms consent indicate the sign-up page. */
export function isOAuthSignupFlow(searchParams: URLSearchParams): boolean {
  if (resolveOAuthFlow(searchParams) === 'signup') return true
  return hasSignupTermsAcceptance(searchParams)
}
