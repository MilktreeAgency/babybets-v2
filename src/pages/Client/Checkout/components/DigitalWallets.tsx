import { useState, useEffect } from 'react'
import { isApplePayAvailable } from '@/lib/applePay'

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
  const [applePayAvailable, setApplePayAvailable] = useState(false)

  useEffect(() => {
    // Check if Apple Pay is available
    setApplePayAvailable(isApplePayAvailable())
  }, [])

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
        {/* Google Pay - Coming Soon */}
        <div className="relative group">
          <button
            type="button"
            disabled={true}
            className="w-full cursor-not-allowed flex items-center justify-center px-3 py-2 rounded-lg border opacity-50"
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
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Coming Soon
          </div>
        </div>

        {/* Apple Pay - Only show if available */}
        {applePayAvailable ? (
          <button
            type="button"
            onClick={onApplePayClick}
            disabled={disabled}
            className="cursor-pointer flex items-center justify-center px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
        ) : (
          <div className="relative group">
            <button
              type="button"
              disabled={true}
              className="w-full cursor-not-allowed flex items-center justify-center px-3 py-2 rounded-lg border opacity-50"
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Not available on this device
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
