import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Trash2, ArrowRight, ShoppingBag, Wallet } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWallet } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, removeItem, getTotalItems, getTotalPrice } =
    useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { summary } = useWallet()
  const navigate = useNavigate()

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
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Your Cart</h2>
            {items.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} • {totalTickets} tickets
              </p>
            )}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center size-20 bg-gray-100 rounded-full mb-4">
                <ShoppingBag className="size-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-6">Start adding prizes you'd love to win!</p>
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingBag className="size-4" />
                Browse Competitions
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.competitionId} className="flex gap-4">
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    className="size-20 rounded-xl object-cover bg-gray-100"
                    alt={item.competitionTitle}
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-sm line-clamp-2">{item.competitionTitle}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: '#f25100' }}
                    >
                      {item.quantity} Tickets
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold" style={{ color: '#f25100' }}>
                      £{item.totalPrice.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.competitionId)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
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
          <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-4">
            {/* Wallet Balance */}
            {isAuthenticated && walletBalanceGBP > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
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
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold">{`£${totalPrice.toFixed(2)}`}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-between px-6 py-3 font-bold rounded-lg transition-opacity hover:opacity-90 text-white group"
                style={{ backgroundColor: '#f25100' }}
              >
                <span>Secure Checkout</span>
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleContinueShopping}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
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
