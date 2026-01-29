import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

export default function Header() {
  const { isAuthenticated } = useAuthStore()
  const { items, setCartOpen } = useCartStore()
  const cartTotal = items.length
  const location = useLocation()

  const navLinks = [
    { name: 'Competitions', path: '/competitions' },
    { name: 'How it Works', path: '/how-it-works' },
    { name: 'Partners', path: '/partners' },
  ]

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path
    }
    return location.pathname === path
  }

  return (
    <nav className="sticky top-0 z-50 " style={{ backgroundColor: 'rgba(255, 251, 247, 0.9)', backdropFilter: 'blur(12px)', borderColor: '#f0e0ca' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group cursor-pointer">
            <img
              src="/babybets-logo.png"
              alt="BabyBets Logo"
              className="h-10 group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold transition-colors flex items-center gap-1.5 group cursor-pointer ${
                  isActive(link.path)
                    ? 'hover:text-teal-700'
                    : 'hover:text-teal-700'
                }`}
                style={{ color: isActive(link.path) ? '#496B71' : '#78716c' }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/account"
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors cursor-pointer hover:bg-cream-50"
                style={{ backgroundColor: 'transparent' }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#e1eaec', color: '#496B71' }}>
                  <User size={16} />
                </div>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer hover:bg-cream-50"
                  style={{ color: '#78716c' }}
                >
                  <User size={18} className="inline mr-2" />
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  style={{ backgroundColor: '#f0e0ca', color: '#151e20' }}
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              style={{ backgroundColor: '#3a565b', color: 'white' }}
            >
              <ShoppingBag size={18} className="inline mr-2" />
              Basket
              {cartTotal > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-teal-900 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 font-bold" style={{ backgroundColor: '#FED0B9', borderColor: 'white' }}>
                  {cartTotal}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 cursor-pointer"
              style={{ color: '#223033' }}
            >
              <ShoppingBag size={24} />
              {cartTotal > 0 && (
                <span className="absolute top-1 right-1 text-teal-900 text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: '#FED0B9' }}>
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
