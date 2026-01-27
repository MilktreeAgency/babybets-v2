import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Wallet } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useWallet } from '@/hooks/useWallet'

export default function Header() {
  const { isAuthenticated, user } = useAuthStore()
  const { items, setCartOpen } = useCartStore()
  const { summary } = useWallet()
  const cartTotal = items.length
  const walletBalance = summary.availableBalance / 100

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6" style={{ backgroundColor: '#fffbf7' }}>
      <nav className="w-full max-w-[1300px] h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <img
            src="/babybets-logo.png"
            alt="babybets"
            className="h-8 transition-transform duration-150 group-hover:scale-110 group-active:scale-95"
          />
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {/* Wallet Balance - Show for authenticated users */}
          {isAuthenticated && walletBalance > 0 && (
            <Link
              to="/account?tab=wallet"
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-[14px] font-medium rounded transition-all duration-150 hover:opacity-80"
              style={{ color: '#335761' }}
            >
              <Wallet className="size-4" />
              <span>£{walletBalance.toFixed(2)}</span>
            </Link>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative h-8 px-3 text-[14px] font-medium rounded flex items-center gap-1.5 transition-all duration-150 hover:opacity-80"
            style={{ color: '#335761' }}
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartTotal > 0 && (
              <span
                className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                style={{ backgroundColor: '#335761' }}
              >
                {cartTotal}
              </span>
            )}
          </button>

          {isAuthenticated && user?.isAdmin ? (
            <>
              {/* Dashboard Button - Admin Only */}
              <Link
                to="/admin/dashboard"
                className="h-8 px-3 text-[14px] font-medium rounded flex items-center gap-1.5 transition-all duration-150 hover:opacity-90 whitespace-nowrap text-white"
                style={{ backgroundColor: '#335761' }}
              >
                <span>Dashboard</span>
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </Link>
            </>
          ) : isAuthenticated && !user?.isAdmin ? (
            <>
              {/* My Account Button - Regular Users */}
              <Link
                to="/account"
                className="h-8 px-3 text-[14px] font-medium rounded flex items-center gap-1.5 transition-all duration-150 hover:opacity-90 whitespace-nowrap text-white"
                style={{ backgroundColor: '#335761' }}
              >
                <span>My Account</span>
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </Link>
            </>
          ) : (
            <>
              {/* Login Link - Hidden on mobile */}
              <Link
                to="/login"
                className="h-8 px-3 text-[14px] items-center rounded transition-colors duration-150 hover:opacity-80 hidden sm:flex font-medium"
                style={{ color: '#335761' }}
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
