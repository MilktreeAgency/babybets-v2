import { Wallet, ShieldCheck } from 'lucide-react'

interface PriceSummaryProps {
  totalPrice: number
  discountAmount: number
  promoDiscount: number
  promoCodeType: 'percentage' | 'fixed_value' | null
  promoCodeValue: number
  appliedCredit: number
  finalPrice: number
  compact?: boolean
}

const PriceSummary = ({
  totalPrice,
  discountAmount,
  promoDiscount,
  promoCodeType,
  promoCodeValue,
  appliedCredit,
  finalPrice,
  compact = false,
}: PriceSummaryProps) => {
  return (
    <>
      <div className={compact ? 'space-y-2' : 'mt-8 pt-8 space-y-3 border-t'} style={compact ? undefined : { borderColor: '#e7e5e4' }}>
        <div className="flex justify-between items-center" style={{ color: '#78716c' }}>
          <span className={compact ? 'text-sm' : undefined}>Subtotal</span>
          <span className={compact ? 'text-sm' : undefined}>£{totalPrice.toFixed(2)}</span>
        </div>

        {promoDiscount > 0 && (
          <div className={`flex justify-between items-center text-emerald-600 font-medium ${compact ? 'text-sm' : ''}`}>
            <span>
              Promo Discount
              {promoCodeType === 'percentage' && ` (${promoCodeValue}%)`}
            </span>
            <span>-£{discountAmount.toFixed(2)}</span>
          </div>
        )}

        {appliedCredit > 0 && (
          <div className={`flex justify-between items-center text-green-600 font-medium ${compact ? 'text-sm' : ''}`}>
            <span className="flex items-center gap-1">
              <Wallet size={14} />
              Wallet Credit
            </span>
            <span>-£{appliedCredit.toFixed(2)}</span>
          </div>
        )}

        <div className={`flex justify-between items-center ${compact ? 'pt-1' : 'pt-4 border-t'}`} style={compact ? undefined : { borderColor: '#e7e5e4' }}>
          <span className={`font-bold ${compact ? 'text-base' : 'text-xl'}`} style={{ color: '#151e20' }}>
            Total to Pay
          </span>
          <span className={`font-bold ${compact ? 'text-2xl' : 'text-4xl'}`} style={{ color: '#496B71' }}>
            £{finalPrice.toFixed(2)}
          </span>
        </div>

        {promoDiscount > 0 && (
          <p className={`text-green-600 text-right font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
            You're saving £{discountAmount.toFixed(2)}!
          </p>
        )}
      </div>

      {!compact && (
        <div
          className="flex items-center justify-center gap-2 text-sm font-medium mt-6"
          style={{ color: '#78716c' }}
        >
          <ShieldCheck size={18} /> Guaranteed Secure Checkout
        </div>
      )}
    </>
  )
}

export default PriceSummary
