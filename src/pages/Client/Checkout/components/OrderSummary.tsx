import { ShoppingCart, Trash2 } from 'lucide-react'

interface CartItem {
  competitionId: string
  competitionTitle: string
  imageUrl: string
  quantity: number
  totalPrice: number
}

interface OrderSummaryProps {
  items: CartItem[]
  onRemoveItem: (competitionId: string) => void
}

const OrderSummary = ({ items, onRemoveItem }: OrderSummaryProps) => {
  return (
    <div
      className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-sm"
      style={{
        backgroundColor: 'white',
        borderWidth: '1px',
        borderColor: '#e7e5e4',
      }}
    >
      <h2
        className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 md:mb-8 flex items-center gap-2"
        style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}
      >
        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
        Your Order{' '}
        <span className="text-xs sm:text-sm font-normal" style={{ color: '#78716c' }}>
          ({items.length} {items.length === 1 ? 'item' : 'items'})
        </span>
      </h2>

      <div className="space-y-4 sm:space-y-6">
        {items.map((item) => (
          <div key={item.competitionId} className="flex gap-3 sm:gap-4 items-start">
            <img
              src={item.imageUrl}
              alt={item.competitionTitle}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl object-cover shrink-0"
              style={{ backgroundColor: '#f5f5f4' }}
            />
            <div className="grow pt-0.5 sm:pt-1 min-w-0">
              <h3
                className="font-bold leading-tight mb-1.5 sm:mb-2 text-sm sm:text-base md:text-lg line-clamp-2"
                style={{ color: '#151e20' }}
              >
                {item.competitionTitle}
              </h3>
              <span
                className="text-xs sm:text-sm font-bold inline-block px-2 py-0.5 sm:py-1 rounded-md"
                style={{ backgroundColor: '#e1eaec', color: '#496B71' }}
              >
                {item.quantity} Tickets
              </span>
            </div>
            <div className="text-right pt-0.5 sm:pt-1 shrink-0">
              <p className="font-bold text-base sm:text-lg" style={{ color: '#151e20' }}>
                £{item.totalPrice.toFixed(2)}
              </p>
              <button
                onClick={() => onRemoveItem(item.competitionId)}
                className="transition-colors mt-2 sm:mt-3 cursor-pointer"
                style={{ color: '#d1d5db' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
              >
                <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderSummary
