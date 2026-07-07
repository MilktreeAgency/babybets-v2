import { Tag, X, Users } from 'lucide-react'

interface PromoCodeSectionProps {
  promoCode: string
  setPromoCode: (code: string) => void
  appliedPromoCode: string | null
  promoCodeType: 'percentage' | 'fixed_value' | null
  promoCodeValue: number
  onApplyPromoCode: () => void
  onRemovePromoCode: () => void
  partnerCode: string
  setPartnerCode: (code: string) => void
  activeReferral: { slug: string; influencerId: string; displayName?: string } | null
  onApplyPartnerCode: () => void
  onRemovePartnerCode: () => void
  embedded?: boolean
}

const PromoCodeSection = ({
  promoCode,
  setPromoCode,
  appliedPromoCode,
  promoCodeType,
  promoCodeValue,
  onApplyPromoCode,
  onRemovePromoCode,
  partnerCode,
  setPartnerCode,
  activeReferral,
  onApplyPartnerCode,
  onRemovePartnerCode,
  embedded = false,
}: PromoCodeSectionProps) => {
  const promoWrapperClass = embedded ? '' : 'mt-6 sm:mt-8 pt-6 sm:pt-8'
  const partnerWrapperClass = embedded
    ? '-mx-4 sm:-mx-6 md:-mx-8 mt-6 pt-6 px-4 sm:px-6 md:px-8 border-t'
    : 'mt-6 sm:mt-8 pt-6 sm:pt-8'

  return (
    <>
      <div
        className={promoWrapperClass}
        style={embedded ? undefined : { borderTopWidth: '1px', borderColor: '#e7e5e4' }}
      >
        <label
          className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: '#78716c' }}
        >
          Promotional Code
        </label>

        {appliedPromoCode ? (
          <div
            className="flex justify-between items-center p-3 sm:p-4 rounded-xl"
            style={{
              backgroundColor: '#e1eaec',
              borderWidth: '1px',
              borderColor: '#496B71',
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Tag className="w-4 h-4 shrink-0" style={{ color: '#496B71' }} />
              <span className="font-bold text-sm sm:text-base truncate" style={{ color: '#151e20' }}>
                {appliedPromoCode}
              </span>
              <span
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                {promoCodeType === 'percentage'
                  ? `${promoCodeValue}% OFF`
                  : `£${(promoCodeValue / 100).toFixed(2)} OFF`}
              </span>
            </div>
            <button
              onClick={onRemovePromoCode}
              className="transition-colors cursor-pointer shrink-0 ml-2"
              style={{ color: '#78716c' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#78716c')}
            >
              <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApplyPromoCode()
              }}
              placeholder="Enter code"
              className="grow p-2.5 sm:p-3 text-sm sm:text-base rounded-xl focus:ring-2 focus:outline-none uppercase font-medium placeholder:normal-case"
              style={{
                backgroundColor: '#f5f5f4',
                borderWidth: '1px',
                borderColor: '#e7e5e4',
                color: '#151e20',
              }}
            />
            <button
              onClick={onApplyPromoCode}
              className="px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-colors cursor-pointer font-bold"
              style={{
                backgroundColor: 'white',
                borderWidth: '1px',
                borderColor: '#e7e5e4',
                color: '#151e20',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#496B71'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.color = '#151e20'
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div
        className={partnerWrapperClass}
        style={embedded ? { borderColor: '#e7e5e4' } : { borderTopWidth: '1px', borderColor: '#e7e5e4' }}
      >
        <label
          className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: '#78716c' }}
        >
          Partner Code
        </label>

        {activeReferral ? (
          <div
            className="flex justify-between items-center p-3 sm:p-4 rounded-xl"
            style={{
              backgroundColor: '#e1eaec',
              borderWidth: '1px',
              borderColor: '#496B71',
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Users className="w-4 h-4 shrink-0" style={{ color: '#496B71' }} />
              <span className="font-bold text-sm sm:text-base truncate" style={{ color: '#151e20' }}>
                {activeReferral.slug}
              </span>
              <span
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                {activeReferral.displayName || 'Partner'}
              </span>
            </div>
            <button
              onClick={onRemovePartnerCode}
              className="transition-colors cursor-pointer shrink-0 ml-2"
              style={{ color: '#78716c' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#78716c')}
            >
              <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApplyPartnerCode()
              }}
              placeholder="Enter partner code"
              className="grow p-2.5 sm:p-3 text-sm sm:text-base rounded-xl focus:ring-2 focus:outline-none uppercase font-medium placeholder:normal-case"
              style={{
                backgroundColor: '#f5f5f4',
                borderWidth: '1px',
                borderColor: '#e7e5e4',
                color: '#151e20',
              }}
            />
            <button
              onClick={onApplyPartnerCode}
              className="px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-colors cursor-pointer font-bold"
              style={{
                backgroundColor: 'white',
                borderWidth: '1px',
                borderColor: '#e7e5e4',
                color: '#151e20',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#496B71'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.color = '#151e20'
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default PromoCodeSection
