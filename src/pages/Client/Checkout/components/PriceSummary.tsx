import { Wallet, ShieldCheck } from 'lucide-react'

interface PriceSummaryProps {
  totalPrice: number
  discountAmount: number
  promoDiscount: number
  promoCodeType: 'percentage' | 'fixed_value' | null
  promoCodeValue: number
  appliedCredit: number
  finalPrice: number
}

const PriceSummary = ({
  totalPrice,
  discountAmount,
  promoDiscount,
  promoCodeType,
  promoCodeValue,
  appliedCredit,
  finalPrice,
}: PriceSummaryProps) => {
  return (
    <>
      {/* Order Totals */}
      <div
        className="mt-8 pt-8 space-y-3"
        style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
      >
        <div className="flex justify-between items-center" style={{ color: '#78716c' }}>
          <span>Subtotal</span>
          <span>£{totalPrice.toFixed(2)}</span>
        </div>

        {promoDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 font-medium">
            <span>
              Promo Discount
              {promoCodeType === 'percentage' && ` (${promoCodeValue}%)`}
            </span>
            <span>-£{discountAmount.toFixed(2)}</span>
          </div>
        )}

        {appliedCredit > 0 && (
          <div className="flex justify-between items-center text-green-600 font-medium">
            <span className="flex items-center gap-1">
              <Wallet size={14} />
              Wallet Credit
            </span>
            <span>-£{appliedCredit.toFixed(2)}</span>
          </div>
        )}

        <div
          className="flex justify-between items-center pt-4"
          style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
        >
          <span className="font-bold text-xl" style={{ color: '#151e20' }}>
            Total to Pay
          </span>
          <span className="text-4xl font-bold" style={{ color: '#496B71' }}>
            £{finalPrice.toFixed(2)}
          </span>
        </div>

        {promoDiscount > 0 && (
          <p className="text-sm text-green-600 text-right font-medium">
            You're saving £{discountAmount.toFixed(2)}!
          </p>
        )}
      </div>

      <div
        className="flex items-center justify-center gap-2 text-sm font-medium mt-6"
        style={{ color: '#78716c' }}
      >
        <ShieldCheck size={18} /> Guaranteed Secure Checkout
      </div>
    </>
  )
}

export default PriceSummary
