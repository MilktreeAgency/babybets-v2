import { Wallet } from 'lucide-react'

interface WalletCreditSectionProps {
  availableCreditGBP: number
  useWalletCredit: boolean
  setUseWalletCredit: (use: boolean) => void
  appliedCredit: number
  setAppliedCredit: (amount: number) => void
  maxApplicableCredit: number
}

const WalletCreditSection = ({
  availableCreditGBP,
  useWalletCredit,
  setUseWalletCredit,
  appliedCredit,
  setAppliedCredit,
  maxApplicableCredit,
}: WalletCreditSectionProps) => {
  if (availableCreditGBP <= 0) {
    return null
  }

  return (
    <div
      className="mt-6 sm:mt-8 pt-6 sm:pt-8"
      style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
    >
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={useWalletCredit}
              onChange={(e) => {
                setUseWalletCredit(e.target.checked)
                if (e.target.checked) {
                  setAppliedCredit(maxApplicableCredit)
                } else {
                  setAppliedCredit(0)
                }
              }}
              className="sr-only peer"
            />
            <div
              className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
              style={{
                backgroundColor: useWalletCredit ? '#496B71' : '#d1d5db',
                borderWidth: '2px',
                borderColor: useWalletCredit ? '#496B71' : '#d1d5db',
              }}
            />
          </div>
          <span
            className="font-bold flex items-center gap-2"
            style={{ color: '#151e20' }}
          >
            <Wallet size={18} style={{ color: '#496B71' }} />
            Use Wallet Credit
          </span>
        </label>
        <span className="text-sm" style={{ color: '#78716c' }}>
          Balance: <span className="font-bold" style={{ color: '#151e20' }}>£{availableCreditGBP.toFixed(2)}</span>
        </span>
      </div>

      {useWalletCredit && (
        <>
          <div
            className="rounded-lg p-4 mb-4"
            style={{
              backgroundColor: '#e1eaec',
              borderWidth: '1px',
              borderColor: '#496B71',
            }}
          >
            <div className="flex items-start gap-2">
              <div className="text-sm" style={{ color: '#151e20' }}>
                <p className="font-medium">
                  Applying £{appliedCredit.toFixed(2)} credit
                </p>
                <p className="text-xs mt-1" style={{ color: '#78716c' }}>
                  Maximum credit can be applied after any promo discounts
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: '#78716c' }}>
              Apply Credit Amount
            </label>
            <input
              type="number"
              min="0"
              max={maxApplicableCredit}
              step="0.01"
              value={appliedCredit}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                setAppliedCredit(Math.min(value, maxApplicableCredit))
              }}
              className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:outline-none"
              style={{
                backgroundColor: '#f5f5f4',
                borderWidth: '1px',
                borderColor: '#e7e5e4',
                color: '#151e20',
              }}
              placeholder="0.00"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setAppliedCredit(Math.min(10, maxApplicableCredit))}
                className="flex-1 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                style={{
                  borderWidth: '1px',
                  borderColor: '#e7e5e4',
                  backgroundColor: 'white',
                  color: '#151e20',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                £10
              </button>
              <button
                onClick={() => setAppliedCredit(Math.min(25, maxApplicableCredit))}
                className="flex-1 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                style={{
                  borderWidth: '1px',
                  borderColor: '#e7e5e4',
                  backgroundColor: 'white',
                  color: '#151e20',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                £25
              </button>
              <button
                onClick={() => setAppliedCredit(maxApplicableCredit)}
                className="flex-1 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                style={{
                  borderWidth: '1px',
                  borderColor: '#e7e5e4',
                  backgroundColor: 'white',
                  color: '#151e20',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                Use All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WalletCreditSection
