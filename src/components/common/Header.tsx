import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function Header() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 bg-background" style={{ borderBottom: '1px solid #f0f0f0' }}>
      <nav className="w-full max-w-3xl h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <div
            className="size-6 rounded-md transition-transform duration-150 group-hover:scale-110 group-active:scale-95"
            style={{ backgroundColor: '#f25100' }}
            aria-hidden="true"
          />
          <span className="font-semibold text-[15px] tracking-tight transition-colors duration-300 text-foreground">
            babybets
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">

          {isAuthenticated && user?.isAdmin ? (
            <>
              {/* Dashboard Button - Admin Only */}
              <Link
                to="/admin/dashboard"
                className="h-8 px-3 text-[14px] font-medium rounded flex items-center gap-1.5 transition-all duration-150 hover:opacity-90 whitespace-nowrap bg-foreground text-background"
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
                className="h-8 px-3 text-[14px] font-medium rounded flex items-center gap-1.5 transition-all duration-150 hover:opacity-90 whitespace-nowrap bg-foreground text-background"
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
                className="h-8 px-3 text-[14px] items-center rounded transition-colors duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hidden sm:flex text-muted-foreground"
              >
                Log in
              </Link>

              {/* Get Started Button */}
              <Link
                to="/login"
                className="h-8 px-3 text-[14px] font-medium rounded flex items-center gap-1.5 transition-all duration-150 hover:opacity-90 whitespace-nowrap bg-foreground text-background"
              >
                <span>Get started</span>
                <kbd className="hidden sm:inline-flex h-5 items-center justify-center rounded-sm px-1.5 font-mono text-[11px] font-bold bg-white/10 text-white/90 border border-white/15">
                  G
                </kbd>
                <ArrowRight className="sm:hidden size-3.5" strokeWidth={2.5} />
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
