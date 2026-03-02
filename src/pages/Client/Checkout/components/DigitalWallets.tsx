interface DigitalWalletsProps {
  onGooglePayClick: () => void
  onApplePayClick: () => void
  disabled?: boolean
}

export function DigitalWallets({
  onGooglePayClick,
  onApplePayClick,
  disabled = false,
}: DigitalWalletsProps) {
  // Always show both payment methods - G2Pay will handle availability

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: '#e7e5e4' }}></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 text-xs" style={{ backgroundColor: 'white', color: '#78716c' }}>
            Or pay with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onGooglePayClick}
          disabled={disabled}
          className="cursor-pointer flex items-center justify-center px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: '#e7e5e4',
            backgroundColor: 'white',
          }}
        >
          <img
            src="/google-pay.png"
            alt="Google Pay"
            className="h-14 w-auto"
          />
        </button>

        <button
          type="button"
          onClick={onApplePayClick}
          disabled={disabled}
          className="cursor-pointer flex items-center justify-center px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: '#e7e5e4',
            backgroundColor: 'white',
          }}
        >
          <img
            src="/apple-pay.png"
            alt="Apple Pay"
            className="h-14 w-auto"
          />
        </button>
      </div>
    </div>
  )
}
