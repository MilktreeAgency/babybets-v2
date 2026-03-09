/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_G2PAY_MERCHANT_ID: string
  readonly VITE_GOOGLE_MERCHANT_ID: string
  readonly VITE_GOOGLE_PAY_MERCHANT_NAME: string
  readonly VITE_GOOGLE_PAY_GATEWAY: string
  readonly VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Apple Pay API declarations
interface Window {
  ApplePaySession?: {
    canMakePayments(): boolean
    new (version: number, paymentRequest: unknown): unknown
  }
  PaymentRequest?: {
    new (
      methodData: unknown[],
      details: unknown,
      options?: unknown
    ): {
      canMakePayment(): Promise<boolean>
      show(): Promise<unknown>
    }
  }
}
