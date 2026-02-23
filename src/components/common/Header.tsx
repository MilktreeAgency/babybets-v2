import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, User, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'

interface NavLink {
  name: string
  path: string
  isNew?: boolean
}

interface FeaturedPartner {
  display_name: string
  slug: string
}

interface FeaturedPartnerSettings {
  enabled: boolean
  mode: 'auto' | 'manual'
  manual_partner_id: string | null
}

export default function Header() {
  const { isAuthenticated, user } = useAuthStore()
  const { items, setCartOpen } = useCartStore()
  const cartTotal = items.length
  const location = useLocation()
  const isAdmin = user?.isAdmin || false
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredPartner, setFeaturedPartner] = useState<FeaturedPartner | null>(null)

  // Fetch featured partner based on admin settings
  useEffect(() => {
    const fetchFeaturedPartner = async () => {
      try {
        // First, get the featured_partner settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'featured_partner')
          .single()

        if (settingsError) throw settingsError

        const settings = settingsData.setting_value as unknown as FeaturedPartnerSettings

        // Only proceed if feature is enabled
        if (!settings.enabled) {
          setFeaturedPartner(null)
          return
        }

        // Fetch partner based on mode
        if (settings.mode === 'manual' && settings.manual_partner_id) {
          // Manual mode: fetch specific partner
          const { data, error } = await supabase
            .from('influencers')
            .select('display_name, slug')
            .eq('id', settings.manual_partner_id)
            .eq('is_active', true)
            .single()

          if (error) throw error
          setFeaturedPartner(data)
        } else {
          // Auto mode: fetch latest active partner
          const { data, error } = await supabase
            .from('influencers')
            .select('display_name, slug')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (error) throw error
          setFeaturedPartner(data)
        }
      } catch (error) {
        console.error('Error fetching featured partner:', error)
        setFeaturedPartner(null)
      }
    }

    fetchFeaturedPartner()
  }, [])

  const navLinks: NavLink[] = [
    { name: 'Competitions', path: '/competitions' },
    { name: 'How it works', path: '/how-it-works' },
    { name: 'Meet Nick & Shelley', path: '/founders' },
    ...(featuredPartner ? [{ name: featuredPartner.display_name, path: `/partner/${featuredPartner.slug}`, isNew: true }] : []),
    { name: 'Partners', path: '/partners' },
    { name: 'FAQs', path: '/faq' },
  ]

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path
    }
    return location.pathname === path
  }

  return (
    <>
    <nav className="sticky top-0 z-50" style={{ backgroundColor: 'rgba(255, 251, 247, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #FED0B9', boxShadow: '0 2px 12px 0 rgba(254, 208, 185, 0.35)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
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
          <div className="hidden lg:flex items-center space-x-8">
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
                {link.isNew && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#ff4b5f', color: 'white', boxShadow: '0 2px 8px rgba(255, 75, 95, 0.3)' }}>
                    Our New Official Partner
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className="text-sm font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                {isAuthenticated ? (
                  <Link
                    to="/account"
                    className="text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    style={{ backgroundColor: '#151e20', color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c3e45'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#151e20'}
                  >
                    <User size={18} className="inline mr-2" />
                    My Profile
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
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-3">
            {!isAdmin && (
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
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 cursor-pointer"
              style={{ color: '#223033' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

      </div>

    </nav>

      {/* Mobile Menu — rendered via portal directly on body */}
      {mobileMenuOpen && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: '#fffbf7',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '80px', borderBottom: '1px solid #FED0B9', flexShrink: 0 }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <img src="/babybets-logo.png" alt="BabyBets Logo" style={{ height: '40px' }} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!isAdmin && (
                <button
                  onClick={() => { setCartOpen(true); setMobileMenuOpen(false) }}
                  style={{ position: 'relative', padding: '8px', cursor: 'pointer', color: '#223033', background: 'none', border: 'none' }}
                >
                  <ShoppingBag size={24} />
                  {cartTotal > 0 && (
                    <span style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#FED0B9', color: '#151e20', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                      {cartTotal}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px', cursor: 'pointer', color: '#223033', background: 'none', border: 'none' }}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '20px 0',
                  borderBottom: '1px solid #f0e0ca',
                  textDecoration: 'none',
                  color: isActive(link.path) ? '#496B71' : '#151e20',
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: "'Fraunces', serif" }}>
                  {link.name}
                </span>
                {link.isNew && (
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold', backgroundColor: '#FED0B9', color: '#151e20' }}>
                    NEW
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', textAlign: 'center', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#496B71', color: 'white', textDecoration: 'none' }}
              >
                Dashboard
              </Link>
            ) : isAuthenticated ? (
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', textAlign: 'center', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#151e20', color: 'white', textDecoration: 'none' }}
              >
                My Profile
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', textAlign: 'center', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#496B71', color: 'white', textDecoration: 'none' }}
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', textAlign: 'center', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#151e20', color: 'white', textDecoration: 'none' }}
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
