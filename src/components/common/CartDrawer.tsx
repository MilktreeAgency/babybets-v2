import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Trash2, ArrowRight, ShoppingBag, Wallet } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWallet } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, removeItem, getTotalItems, getTotalPrice, validateCart } =
    useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { summary } = useWallet()
  const navigate = useNavigate()
  const [cartWarning, setCartWarning] = useState<string | null>(null)

  const totalTickets = getTotalItems()
  const totalPrice = getTotalPrice()
  const walletBalanceGBP = summary.availableBalance / 100

  const handleContinueShopping = () => {
    setCartOpen(false)
    navigate('/')
  }

  const handleCheckout = () => {
    setCartOpen(false)
    navigate('/checkout')
  }

  // Validate cart when drawer opens
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
      const validateOnOpen = async () => {
        const result = await validateCart()
        if (result.removedCount > 0) {
          setCartWarning(
            `${result.removedCount} item(s) were removed (no longer available)`
          )
          // Clear warning after 5 seconds
          setTimeout(() => setCartWarning(null), 5000)
        }
      }
      validateOnOpen()
    } else {
      setCartWarning(null)
    }
  }, [isCartOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCartOpen])

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity cursor-pointer"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        style={{ backgroundColor: '#FFFCF9' }}
      >
        {/* Header */}
        <div
          className="p-6 flex justify-between items-center"
          style={{ borderBottomWidth: '1px', borderColor: '#e7e5e4' }}
        >
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#151e20' }}>
              Your Cart
            </h2>
            {items.length > 0 && (
              <p className="text-sm mt-1" style={{ color: '#78716c' }}>
                {items.length} {items.length === 1 ? 'item' : 'items'} • {totalTickets} tickets
              </p>
            )}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-full transition-colors cursor-pointer"
            style={{ backgroundColor: '#f5f5f4', color: '#151e20' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e7e5e4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cart Warning */}
        {cartWarning && (
          <div className="px-6 pt-4">
            <div
              className="p-3 rounded-lg border-2 flex items-start gap-2"
              style={{
                backgroundColor: '#fef3c7',
                borderColor: '#f59e0b',
              }}
            >
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-medium flex-1" style={{ color: '#92400e' }}>
                {cartWarning}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div
                className="inline-flex items-center justify-center size-20 rounded-full mb-4"
                style={{ backgroundColor: '#FBEFDF' }}
              >
                <ShoppingBag className="size-10" style={{ color: '#78716c' }} />
              </div>
              <p className="mb-4 font-medium" style={{ color: '#151e20' }}>
                Your cart is empty
              </p>
              <p className="text-sm mb-6" style={{ color: '#78716c' }}>
                Start adding prizes you'd love to win!
              </p>
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#496B71',
                  color: 'white',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a565a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#496B71')}
              >
                <ShoppingBag className="size-4" />
                Browse Competitions
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.competitionId}
                className="flex gap-4 p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: 'white',
                  borderWidth: '1px',
                  borderColor: '#e7e5e4',
                }}
              >
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    className="size-20 rounded-xl object-cover"
                    style={{ backgroundColor: '#FBEFDF' }}
                    alt={item.competitionTitle}
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-sm line-clamp-2" style={{ color: '#151e20' }}>
                    {item.competitionTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#e1eaec', color: '#496B71' }}
                    >
                      {item.quantity} Tickets
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-lg" style={{ color: '#496B71' }}>
                      £{item.totalPrice.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.competitionId)}
                      className="transition-colors p-1 cursor-pointer"
                      style={{ color: '#78716c' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#78716c')}
                      aria-label="Remove item"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="p-6 space-y-4"
            style={{
              borderTopWidth: '1px',
              borderColor: '#e7e5e4',
              backgroundColor: '#f5f6f7',
            }}
          >
            {/* Wallet Balance */}
            {isAuthenticated && walletBalanceGBP > 0 && (
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: '#ecfdf5',
                  borderWidth: '1px',
                  borderColor: '#a7f3d0',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="size-4 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">Wallet Balance Available</p>
                </div>
                <p className="text-lg text-green-800 font-bold">£{walletBalanceGBP.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">
                  {walletBalanceGBP >= totalPrice
                    ? '✓ Enough to cover this order!'
                    : `Use at checkout to save £${Math.min(walletBalanceGBP, totalPrice).toFixed(2)}`}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center">
              <span style={{ color: '#78716c' }}>Total</span>
              <span className="text-2xl font-bold" style={{ color: '#151e20' }}>
                £{totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-between px-6 py-4 font-bold rounded-lg transition-colors text-white group cursor-pointer"
                style={{ backgroundColor: '#496B71' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a565a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#496B71')}
              >
                <span>Secure Checkout</span>
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleContinueShopping}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg transition-colors cursor-pointer"
                style={{
                  borderWidth: '1px',
                  borderColor: '#e7e5e4',
                  backgroundColor: 'white',
                  color: '#151e20',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FBEFDF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                <ShoppingBag className="size-4" />
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
