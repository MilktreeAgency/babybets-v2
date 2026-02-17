import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LogOut, MapPin, User, Bell, LayoutDashboard, X, Save, Wallet, Clock, TrendingUp, Gift, Ticket, Trophy, ChevronDown, ChevronUp, UserCheck, ArrowDownToLine, CheckCircle, XCircle, AlertCircle as AlertCircleIcon, Menu } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import Header from '@/components/common/Header'
import { useAuthStore } from '@/store/authStore'
import { useTickets } from '@/hooks/useTickets'
import { useProfile } from '@/hooks/useProfile'
import { useWallet } from '@/hooks/useWallet'
import { usePrizeFulfillments } from '@/hooks/usePrizeFulfillments'
import { UserPrizeClaimModal } from '@/components/UserPrizeClaimModal'
import { WithdrawalRequestModal } from '@/components/WithdrawalRequestModal'
import { WinCelebrationModal } from '@/components/WinCelebrationModal'
import { authService } from '@/services/auth.service'
import type { PrizeTemplate } from '@/types'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Section = 'dashboard' | 'tickets' | 'prizes' | 'wallet' | 'addresses' | 'account-details' | 'communication' | 'logout'

type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']

function Account() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { isAuthenticated, user, isLoading, isInitialized } = useAuthStore()
  const { tickets, revealTicket, isRevealing, unrevealedCount } = useTickets()
  const { profile, updateAddress, isUpdatingAddress, updateProfile, isUpdating } = useProfile()
  const { credits, transactions, summary, isLoading: isLoadingWallet } = useWallet()
  const { fulfillments, pendingFulfillments, activeFulfillments, completedFulfillments, expiringSoon } = usePrizeFulfillments()

  // Initialize activeSection from URL or default to 'dashboard'
  const tabParam = searchParams.get('tab') as Section | null
  const initialSection = tabParam && ['dashboard', 'tickets', 'prizes', 'wallet', 'addresses', 'account-details', 'communication', 'logout'].includes(tabParam)
    ? tabParam
    : 'dashboard'
  const [activeSection, setActiveSection] = useState<Section>(initialSection)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [selectedFulfillment, setSelectedFulfillment] = useState<typeof fulfillments[0] | null>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'UK',
  })
  const [accountForm, setAccountForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  })
  const [communicationPrefs, setCommunicationPrefs] = useState({
    marketing_email: false,
    marketing_sms: false,
  })
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<string>>(new Set())
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)
  const [wonPrize] = useState<PrizeTemplate | null>(null)
  const purchaseToastShown = useRef(false)

  useEffect(() => {
    if (!isLoading && isInitialized && !isAuthenticated) {
      navigate('/login?redirect=/account')
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate])

  // Handle purchase success toast
  useEffect(() => {
    if (searchParams.get('purchase') === 'success' && !purchaseToastShown.current) {
      purchaseToastShown.current = true
      showSuccessToast('Purchase successful! Your tickets are ready.')
      // Remove the purchase param after showing toast
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('purchase')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Sync activeSection with URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Section | null
    if (tabParam && ['dashboard', 'tickets', 'prizes', 'wallet', 'addresses', 'account-details', 'communication'].includes(tabParam)) {
      setActiveSection(tabParam)

      // Scroll to top when switching tabs
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])

  // Load address data when profile is available
  useEffect(() => {
    if (profile) {
      setAddressForm({
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        county: profile.county || '',
        postcode: profile.postcode || '',
        country: profile.country || 'UK',
      })
      setAccountForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      })
      setCommunicationPrefs({
        marketing_email: profile.marketing_email || false,
        marketing_sms: profile.marketing_sms || false,
      })
    }
  }, [profile])

  const handleLogout = async () => {
    await authService.logout()
    navigate('/')
  }

  const handleSectionChange = (section: Section) => {
    if (section === 'logout') {
      setShowLogoutModal(true)
    } else {
      setActiveSection(section)
      setSearchParams({ tab: section })
    }
    setIsMobileMenuOpen(false) // Close mobile menu when a section is selected
  }

  const confirmLogout = async () => {
    setShowLogoutModal(false)
    await handleLogout()
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateAddress(addressForm)
      setIsEditingAddress(false)
    } catch (error) {
      console.error('Error updating address:', error)
    }
  }

  const handleAddressChange = (field: keyof typeof addressForm, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(accountForm)
      setIsEditingAccount(false)
    } catch (error) {
      console.error('Error updating account details:', error)
    }
  }

  const handleAccountChange = (field: keyof typeof accountForm, value: string) => {
    setAccountForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCommunicationToggle = async (field: keyof typeof communicationPrefs) => {
    const newValue = !communicationPrefs[field]
    setCommunicationPrefs(prev => ({ ...prev, [field]: newValue }))
    try {
      await updateProfile({ [field]: newValue })
    } catch (error) {
      console.error('Error updating communication preferences:', error)
      // Revert on error
      setCommunicationPrefs(prev => ({ ...prev, [field]: !newValue }))
    }
  }

  const loadWithdrawalRequests = async () => {
    if (!user) return
    try {
      setLoadingWithdrawals(true)
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWithdrawalRequests(data || [])
    } catch (error) {
      console.error('Error loading withdrawal requests:', error)
    } finally {
      setLoadingWithdrawals(false)
    }
  }

  // Load withdrawal requests when wallet section is active
  useEffect(() => {
    if (activeSection === 'wallet' && user) {
      loadWithdrawalRequests()
    }
  }, [activeSection, user])

  const toggleCompetitionExpanded = (competitionId: string) => {
    setExpandedCompetitions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(competitionId)) {
        newSet.delete(competitionId)
      } else {
        newSet.add(competitionId)
      }
      return newSet
    })
  }

  const hasAddress = profile && profile.address_line1 && profile.city && profile.postcode

  // Navigate to scratch reveal page
  const handleRevealAll = () => {
    const unrevealedTickets = tickets.filter(t => !t.is_revealed && t.competition?.competition_type === 'instant_win')
    if (unrevealedTickets.length === 0) return

    navigate('/scratch-reveal')
  }

  // Reveal all tickets without animation
  const handleScratchAllWithoutAnimation = async () => {
    const unrevealedTickets = tickets.filter(t => !t.is_revealed && t.competition?.competition_type === 'instant_win')
    if (unrevealedTickets.length === 0) return

    try {
      // Reveal all unrevealed tickets in parallel
      await Promise.all(
        unrevealedTickets.map(ticket => revealTicket(ticket.id))
      )

      // Manually invalidate queries to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      await queryClient.invalidateQueries({ queryKey: ['wallet-credits'] })
      await queryClient.invalidateQueries({ queryKey: ['prize-fulfillments'] })

      showSuccessToast(`Successfully revealed ${unrevealedTickets.length} ticket${unrevealedTickets.length > 1 ? 's' : ''}!`)
    } catch (error) {
      console.error('Failed to reveal tickets:', error)
      showErrorToast('Failed to reveal some tickets. Please try again.')
    }
  }


  // Group tickets by competition
  const groupTicketsByCompetition = (ticketList: typeof tickets) => {
    const groups = new Map<string, typeof tickets>()

    ticketList.forEach(ticket => {
      const competitionId = ticket.competition?.id || 'unknown'
      if (!groups.has(competitionId)) {
        groups.set(competitionId, [])
      }
      groups.get(competitionId)!.push(ticket)
    })

    return Array.from(groups.entries()).map(([competitionId, competitionTickets]) => ({
      competitionId,
      competition: competitionTickets[0].competition,
      tickets: competitionTickets
    }))
  }

  const navigationItems = [
    { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets' as Section, label: 'My Tickets', icon: Ticket, badge: unrevealedCount > 0 ? unrevealedCount : undefined },
    { id: 'prizes' as Section, label: 'My Prizes', icon: Gift },
    { id: 'wallet' as Section, label: 'Wallet', icon: Wallet },
    { id: 'addresses' as Section, label: 'Addresses', icon: MapPin },
    { id: 'account-details' as Section, label: 'Account Details', icon: User },
    { id: 'communication' as Section, label: 'Communication Preferences', icon: Bell },
    { id: 'logout' as Section, label: 'Logout', icon: LogOut },
  ]

  // Add influencer dashboard link if user is an influencer
  const isInfluencer = profile?.role === 'influencer'

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="antialiased relative h-screen flex flex-col" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <div className="flex-1 overflow-y-auto pt-4 sm:pt-6 pb-6 sm:pb-8 px-4 sm:px-6">
        <div className="max-w-[1300px] mx-auto">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 p-3 sm:p-4 rounded-full shadow-lg cursor-pointer"
            style={{ backgroundColor: '#335761', color: 'white' }}
            aria-label="Open navigation menu"
          >
            <Menu size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Mobile Menu Backdrop */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 lg:items-start">
            {/* Sidebar */}
            <div className={`
              lg:w-82 shrink-0
              fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
              w-[280px] sm:w-[320px] lg:w-82
              transform transition-transform duration-300 ease-in-out lg:transform-none
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="bg-white rounded-xl p-3 sm:p-4 lg:sticky lg:top-8 h-full lg:h-auto overflow-y-auto">
                {/* Mobile Menu Close Button */}
                <div className="lg:hidden flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-bold" style={{ color: '#2D251E' }}>Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSectionChange(item.id)}
                        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-left cursor-pointer ${
                          item.id === 'logout'
                            ? 'text-red-600 hover:bg-red-50'
                            : isActive
                            ? 'text-white'
                            : 'text-[#666] hover:bg-gray-50'
                        }`}
                        style={isActive && item.id !== 'logout' ? { backgroundColor: '#335761' } : {}}
                      >
                        <Icon size={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
                        <span className="text-xs sm:text-sm leading-tight flex-1">{item.label}</span>
                        {'badge' in item && item.badge && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full" style={{ backgroundColor: '#f25100', color: 'white' }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeSection === 'dashboard' && (
                <div className="space-y-8">
                  {/* Welcome Message */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: '#1a1a1a' }}>
                      Hello {user?.name || 'User'}
                    </h1>
                    <p className="text-sm sm:text-base" style={{ color: '#666' }}>
                      From your account dashboard you can view your tickets, manage your prizes, check your wallet balance, and edit your account details.
                    </p>
                  </div>

                  {/* Influencer Dashboard Card */}
                  {isInfluencer && (
                    <button
                      onClick={() => navigate('/influencer/dashboard')}
                      className="w-full bg-gradient-to-r from-[#496B71] to-[#335761] rounded-xl p-4 sm:p-5 md:p-6 text-white cursor-pointer text-left"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-white/20 rounded-full">
                          <UserCheck size={24} className="sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Partner Dashboard</h2>
                          <p className="text-sm sm:text-base text-white/90">View your commission stats, sales, referral link, and manage your partner profile</p>
                        </div>
                        <div className="hidden sm:block text-3xl md:text-4xl font-bold">→</div>
                      </div>
                    </button>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Tickets Card */}
                    <button
                      onClick={() => {
                        setActiveSection('tickets')
                        setSearchParams({ tab: 'tickets' })
                      }}
                      className="bg-white rounded-xl p-4 sm:p-5 md:p-6 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff' }}>
                          <Ticket size={20} className="sm:w-6 sm:h-6" style={{ color: '#335761' }} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Tickets
                        </h3>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span style={{ color: '#666' }}>Total</span>
                          <span className="font-bold" style={{ color: '#1a1a1a' }}>{tickets.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span style={{ color: '#666' }}>Unrevealed</span>
                          <span className="font-bold text-orange-600">{unrevealedCount}</span>
                        </div>
                      </div>
                    </button>

                    {/* Prizes Card */}
                    <button
                      onClick={() => {
                        setActiveSection('prizes')
                        setSearchParams({ tab: 'prizes' })
                      }}
                      className="bg-white rounded-xl p-4 sm:p-5 md:p-6 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                          <Gift size={20} className="sm:w-6 sm:h-6" style={{ color: '#f59e0b' }} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Prizes
                        </h3>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span style={{ color: '#666' }}>Pending</span>
                          <span className="font-bold text-orange-600">{pendingFulfillments.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span style={{ color: '#666' }}>Completed</span>
                          <span className="font-bold text-green-600">{completedFulfillments.length}</span>
                        </div>
                      </div>
                    </button>

                    {/* Wallet Card */}
                    <button
                      onClick={() => {
                        setActiveSection('wallet')
                        setSearchParams({ tab: 'wallet' })
                      }}
                      className="bg-white rounded-xl p-4 sm:p-5 md:p-6 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
                          <Wallet size={20} className="sm:w-6 sm:h-6" style={{ color: '#22c55e' }} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Wallet
                        </h3>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span style={{ color: '#666' }}>Balance</span>
                          <span className="font-bold" style={{ color: '#1a1a1a' }}>
                            £{(summary.availableBalance / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span style={{ color: '#666' }}>Active Credits</span>
                          <span className="font-bold" style={{ color: '#1a1a1a' }}>{credits.length}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'tickets' && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Reveal All Section - Only show if there are unrevealed instant win tickets */}
                  {unrevealedCount > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 sm:p-4 border-2" style={{ borderColor: '#fb923c' }}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold mb-0.5" style={{ color: '#1a1a1a' }}>
                            Unrevealed Tickets
                          </h3>
                          <p className="text-xs" style={{ color: '#78716c' }}>
                            You have {unrevealedCount} ticket{unrevealedCount > 1 ? 's' : ''} ready to scratch
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={handleScratchAllWithoutAnimation}
                            disabled={isRevealing}
                            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm text-white transition-all duration-300 hover:opacity-90 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#496B71' }}
                          >
                            {isRevealing ? 'Revealing...' : 'Reveal All'}
                          </button>
                          <button
                            onClick={handleRevealAll}
                            disabled={isRevealing}
                            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm text-white transition-all duration-300 hover:opacity-90 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#f97316' }}
                          >
                            Scratch All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Competitions */}
                  {tickets.length > 0 ? (
                    <div className="space-y-3">
                      {groupTicketsByCompetition(tickets).map((group) => (
                        <div key={group.competitionId} className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                          {/* Competition Header */}
                          <button
                            onClick={() => toggleCompetitionExpanded(group.competitionId)}
                            className="w-full p-3 sm:p-4 border-b transition-colors hover:bg-gray-50 cursor-pointer"
                            style={{ borderColor: '#f3f4f6', backgroundColor: '#fafafa' }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              {/* Competition Image */}
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0">
                                {(group.competition?.image_url || (group.competition?.images && group.competition.images.length > 0)) ? (
                                  <img
                                    src={group.competition.image_url || group.competition.images![0]}
                                    alt={group.competition.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
                                    <Ticket className="size-6 sm:size-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              {/* Competition Details */}
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="font-bold text-sm sm:text-base mb-0.5 truncate" style={{ color: '#1a1a1a' }}>
                                  {group.competition?.title || 'Competition'}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                    {group.tickets.length} Ticket{group.tickets.length > 1 ? 's' : ''}
                                  </span>
                                  {group.competition?.competition_type === 'instant_win' && (
                                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                                      Instant Win
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Chevron Icon */}
                              <div className="shrink-0">
                                {expandedCompetitions.has(group.competitionId) ? (
                                  <ChevronUp className="size-4 sm:size-5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="size-4 sm:size-5 text-gray-600" />
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Ticket Numbers - Collapsible */}
                          {expandedCompetitions.has(group.competitionId) && (
                            <div className="p-2 sm:p-3">
                              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2">
                                {group.tickets.map((ticket) => {
                                  const isUnrevealed = !ticket.is_revealed && ticket.competition?.competition_type === 'instant_win'

                                  if (isUnrevealed) {
                                    // Unrevealed instant win ticket
                                    return (
                                      <button
                                        key={ticket.id}
                                        onClick={() => navigate('/scratch-reveal')}
                                        className="relative p-1.5 sm:p-2 rounded-md font-bold text-[9px] sm:text-[10px] transition-all duration-300 cursor-pointer hover:scale-105"
                                        style={{
                                          backgroundColor: '#fff7ed',
                                          borderWidth: '1px',
                                          borderColor: '#fb923c',
                                          color: '#9a3412'
                                        }}
                                      >
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                          <Ticket className="size-2.5 sm:size-3" />
                                          <span className="leading-tight">Scratch</span>
                                        </div>
                                      </button>
                                    )
                                  }

                                  // Revealed ticket or standard competition ticket
                                  return (
                                    <div
                                      key={ticket.id}
                                      className={`relative p-1.5 sm:p-2 rounded-md font-mono font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center min-h-[32px] sm:min-h-[36px] ${
                                        ticket.prize_id ? 'ring-1 ring-yellow-400' : ''
                                      }`}
                                      style={{
                                        backgroundColor: ticket.prize_id ? '#fef9c3' : '#f9fafb',
                                        borderWidth: '1px',
                                        borderColor: ticket.prize_id ? '#facc15' : '#e5e7eb',
                                        color: ticket.prize_id ? '#713f12' : '#1f2937'
                                      }}
                                    >
                                      {ticket.prize_id && (
                                        <div className="absolute -top-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5">
                                          <Trophy size={8} className="text-yellow-900" />
                                        </div>
                                      )}
                                      <div className="text-center leading-tight">
                                        {ticket.ticket_number}
                                      </div>
                                      {ticket.prize_id && (
                                        <div className="text-center text-[7px] sm:text-[8px] font-bold mt-0.5 leading-none" style={{ color: '#854d0e' }}>
                                          WIN
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-6 sm:p-8 md:p-12 text-center">
                      <div className="size-16 sm:size-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5" style={{ backgroundColor: '#f3f4f6' }}>
                        <Ticket className="size-8 sm:size-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                        No Tickets Yet
                      </h3>
                      <p className="text-sm sm:text-base mb-4 sm:mb-5" style={{ color: '#666' }}>
                        Purchase tickets to enter competitions and win prizes!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'prizes' && (
                <div className="space-y-6">
                  {/* Prizes Header */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <Gift size={20} className="sm:w-6 sm:h-6" style={{ color: '#335761' }} />
                      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        My Prizes
                      </h2>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={18} style={{ color: '#f59e0b' }} />
                          <span className="text-sm font-semibold" style={{ color: '#666' }}>
                            Pending Action
                          </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          {pendingFulfillments.length}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={18} style={{ color: '#335761' }} />
                          <span className="text-sm font-semibold" style={{ color: '#666' }}>
                            In Progress
                          </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          {activeFulfillments.length}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Gift size={18} style={{ color: '#22c55e' }} />
                          <span className="text-sm font-semibold" style={{ color: '#666' }}>
                            Completed
                          </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          {completedFulfillments.length}
                        </p>
                      </div>
                    </div>

                    {/* Expiring Soon Alert */}
                    {expiringSoon.length > 0 && (
                      <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                        <p className="font-semibold" style={{ color: '#92400e' }}>
                          ⚠️ {expiringSoon.length} prize{expiringSoon.length > 1 ? 's' : ''} expiring soon!
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#92400e' }}>
                          Please claim your prize{expiringSoon.length > 1 ? 's' : ''} before the deadline.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pending Prizes */}
                  {pendingFulfillments.length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                        Action Required
                      </h3>
                      <div className="space-y-3">
                        {pendingFulfillments.map((fulfillment) => (
                          <div
                            key={fulfillment.id}
                            className="p-4 border rounded-lg"
                            style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}
                          >
                            <div className="flex items-start gap-3">
                              {fulfillment.prize?.image_url ? (
                                <img
                                  src={fulfillment.prize.image_url}
                                  alt={fulfillment.prize.name}
                                  className="size-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="size-16 bg-white rounded-lg flex items-center justify-center">
                                  <Gift className="size-8 text-orange-500" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold mb-1" style={{ color: '#1a1a1a' }}>
                                  {fulfillment.prize?.name || 'Prize'}
                                </h4>
                                <p className="text-sm mb-2" style={{ color: '#666' }}>
                                  Worth £{fulfillment.prize?.value_gbp || (fulfillment.value_pence / 100).toFixed(2)}
                                </p>
                                <p className="text-xs" style={{ color: '#92400e' }}>
                                  Claim by: {new Date(fulfillment.claim_deadline).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedFulfillment(fulfillment)
                                  setShowClaimModal(true)
                                }}
                                className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
                                style={{ backgroundColor: '#335761' }}
                              >
                                Claim Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Prizes */}
                  {activeFulfillments.length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                        In Progress
                      </h3>
                      <div className="space-y-3">
                        {activeFulfillments.map((fulfillment) => (
                          <div
                            key={fulfillment.id}
                            className="p-4 border rounded-lg"
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <div className="flex items-start gap-3">
                              {fulfillment.prize?.image_url ? (
                                <img
                                  src={fulfillment.prize.image_url}
                                  alt={fulfillment.prize.name}
                                  className="size-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="size-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Gift className="size-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold mb-1" style={{ color: '#1a1a1a' }}>
                                  {fulfillment.prize?.name || 'Prize'}
                                </h4>
                                <p className="text-sm mb-2" style={{ color: '#666' }}>
                                  Worth £{fulfillment.prize?.value_gbp || (fulfillment.value_pence / 100).toFixed(2)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                    {fulfillment.status === 'processing' ? 'Processing' : fulfillment.status === 'dispatched' ? 'Dispatched' : fulfillment.status}
                                  </span>
                                  {fulfillment.tracking_number && (
                                    <span className="text-xs" style={{ color: '#666' }}>
                                      Tracking: {fulfillment.tracking_number}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Prizes */}
                  {completedFulfillments.length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                        Completed
                      </h3>
                      <div className="space-y-3">
                        {completedFulfillments.map((fulfillment) => (
                          <div
                            key={fulfillment.id}
                            className="p-4 border rounded-lg opacity-75"
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <div className="flex items-start gap-3">
                              {fulfillment.prize?.image_url ? (
                                <img
                                  src={fulfillment.prize.image_url}
                                  alt={fulfillment.prize.name}
                                  className="size-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="size-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Gift className="size-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold mb-1" style={{ color: '#1a1a1a' }}>
                                  {fulfillment.prize?.name || 'Prize'}
                                </h4>
                                <p className="text-sm mb-2" style={{ color: '#666' }}>
                                  Worth £{fulfillment.prize?.value_gbp || (fulfillment.value_pence / 100).toFixed(2)}
                                </p>
                                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                  ✓ Completed
                                </span>

                                {/* Voucher/Gift Card Information */}
                                {(fulfillment.prize?.type === 'Voucher' || fulfillment.prize?.type === 'GiftCard') &&
                                  (fulfillment as { voucher_code?: string; voucher_description?: string }).voucher_code && (
                                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '2px solid #fbbf24' }}>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#92400e' }}>
                                            Your Voucher Code
                                          </span>
                                          <p className="font-mono text-base font-bold" style={{ color: '#78350f' }}>
                                            {(fulfillment as { voucher_code?: string }).voucher_code}
                                          </p>
                                        </div>
                                        {(fulfillment as { voucher_description?: string }).voucher_description && (
                                          <div>
                                            <span className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#92400e' }}>
                                              How to Redeem
                                            </span>
                                            <p className="text-sm" style={{ color: '#78350f' }}>
                                              {(fulfillment as { voucher_description?: string }).voucher_description}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Prizes Message */}
                  {fulfillments.length === 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <div className="text-center py-12">
                        <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Gift className="size-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                          No Prizes Yet
                        </h3>
                        <p style={{ color: '#666' }}>
                          Your won prizes will appear here. Keep playing to win exciting prizes!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'wallet' && (
                <div className="space-y-6">
                  {/* Wallet Summary */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Wallet size={20} className="sm:w-6 sm:h-6" style={{ color: '#335761' }} />
                        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Wallet
                        </h2>
                      </div>
                      {summary.availableBalance >= 10000 && (
                        <button
                          onClick={() => setShowWithdrawalModal(true)}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#335761' }}
                        >
                          <ArrowDownToLine size={16} className="sm:w-[18px] sm:h-[18px]" />
                          <span className="hidden sm:inline">Request Withdrawal</span>
                          <span className="sm:hidden">Withdraw</span>
                        </button>
                      )}
                    </div>

                    {isLoadingWallet ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-20 bg-gray-200 rounded-lg" />
                        <div className="h-20 bg-gray-200 rounded-lg" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet size={18} style={{ color: '#335761' }} />
                            <span className="text-sm font-semibold" style={{ color: '#666' }}>
                              Total Balance
                            </span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                            £{(summary.availableBalance / 100).toFixed(2)}
                          </p>
                        </div>

                        {summary.expiringBalance > 0 && (
                          <div className="p-4 border rounded-lg" style={{ borderColor: '#fbbf24', backgroundColor: '#fef3c7' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock size={18} style={{ color: '#f59e0b' }} />
                              <span className="text-sm font-semibold" style={{ color: '#92400e' }}>
                                Expiring Soon
                              </span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#92400e' }}>
                              £{(summary.expiringBalance / 100).toFixed(2)}
                            </p>
                            {summary.nextExpiryDate && (
                              <p className="text-xs mt-1" style={{ color: '#92400e' }}>
                                Expires {new Date(summary.nextExpiryDate as string).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={18} style={{ color: '#335761' }} />
                            <span className="text-sm font-semibold" style={{ color: '#666' }}>
                              Active Credits
                            </span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                            {credits.length}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credit Details */}
                  {credits.length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>
                        Your Credits
                      </h3>
                      <div className="space-y-4">
                        {credits.map((credit) => (
                          <div
                            key={credit.id}
                            className="p-5 border-2 rounded-xl"
                            style={{
                              borderColor: credit.isExpiringSoon ? '#f59e0b' : '#e5e7eb',
                              backgroundColor: credit.isExpiringSoon ? '#fffbeb' : '#fafafa',
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Description */}
                                <p className="font-bold text-base mb-2" style={{ color: '#1a1a1a' }}>
                                  {credit.description}
                                </p>

                                {/* Competition and Ticket Info */}
                                <div className="space-y-1.5">
                                  {credit.competition && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#78716c' }}>
                                        Competition:
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: '#44403c' }}>
                                        {credit.competition.title}
                                      </span>
                                    </div>
                                  )}

                                  {credit.ticket && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#78716c' }}>
                                        Ticket:
                                      </span>
                                      <span className="text-sm font-mono font-bold px-2 py-0.5 rounded" style={{
                                        color: '#059669',
                                        backgroundColor: '#d1fae5'
                                      }}>
                                        #{credit.ticket.ticket_number}
                                      </span>
                                    </div>
                                  )}

                                  {/* Source Type and Expiry */}
                                  <div className="flex items-center gap-3 flex-wrap mt-2">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                                      backgroundColor: '#dbeafe',
                                      color: '#1e40af'
                                    }}>
                                      {credit.source_type.replace('_', ' ')}
                                    </span>
                                    <span className={`text-xs font-medium ${credit.isExpiringSoon ? 'text-amber-600' : ''}`} style={{
                                      color: credit.isExpiringSoon ? '#d97706' : '#78716c'
                                    }}>
                                      {credit.isExpiringSoon && '⚠️ '}
                                      Expires: {new Date(credit.expires_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="text-right shrink-0">
                                <p className="text-2xl font-bold" style={{ color: '#059669' }}>
                                  £{(credit.remaining_pence / 100).toFixed(2)}
                                </p>
                                {credit.remaining_pence < credit.amount_pence && (
                                  <p className="text-xs mt-1" style={{ color: '#78716c' }}>
                                    of £{(credit.amount_pence / 100).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction History */}
                  <div className="bg-white rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                      Transaction History
                    </h3>
                    {transactions.length === 0 ? (
                      <div className="text-center py-8" style={{ color: '#666' }}>
                        <p>No transactions yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {transactions.slice(0, 10).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-3 border-b flex items-center justify-between"
                            style={{ borderColor: '#f3f4f6' }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                                {transaction.description}
                              </p>
                              <p className="text-xs" style={{ color: '#666' }}>
                                {new Date(transaction.created_at!).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-sm font-bold"
                                style={{
                                  color: transaction.amount_pence > 0 ? '#22c55e' : '#ef4444',
                                }}
                              >
                                {transaction.amount_pence > 0 ? '+' : ''}
                                £{Math.abs(transaction.amount_pence / 100).toFixed(2)}
                              </p>
                              <p className="text-xs" style={{ color: '#666' }}>
                                Balance: £{(transaction.balance_after_pence / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Withdrawal Requests */}
                  <div className="bg-white rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                      Withdrawal Requests
                    </h3>
                    {loadingWithdrawals ? (
                      <div className="text-center py-8">
                        <div className="inline-block size-8 border-4 border-gray-200 border-t-[#335761] rounded-full animate-spin"></div>
                        <p className="mt-2 text-sm" style={{ color: '#666' }}>Loading withdrawal requests...</p>
                      </div>
                    ) : withdrawalRequests.length === 0 ? (
                      <div className="text-center py-8" style={{ color: '#666' }}>
                        <p>No withdrawal requests yet.</p>
                        {summary.availableBalance >= 10000 && (
                          <button
                            onClick={() => setShowWithdrawalModal(true)}
                            className="mt-4 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
                            style={{ backgroundColor: '#335761' }}
                          >
                            Request Your First Withdrawal
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {withdrawalRequests.map((request) => {
                          const getStatusConfig = (status: string | null) => {
                            switch (status) {
                              case 'pending':
                                return {
                                  label: 'Pending Review',
                                  color: '#f59e0b',
                                  bgColor: '#fef3c7',
                                  icon: Clock
                                }
                              case 'approved':
                                return {
                                  label: 'Approved - Processing',
                                  color: '#3b82f6',
                                  bgColor: '#dbeafe',
                                  icon: AlertCircleIcon
                                }
                              case 'paid':
                                return {
                                  label: 'Paid',
                                  color: '#22c55e',
                                  bgColor: '#dcfce7',
                                  icon: CheckCircle
                                }
                              case 'rejected':
                                return {
                                  label: 'Rejected',
                                  color: '#ef4444',
                                  bgColor: '#fee2e2',
                                  icon: XCircle
                                }
                              default:
                                return {
                                  label: 'Unknown',
                                  color: '#666',
                                  bgColor: '#f3f4f6',
                                  icon: Clock
                                }
                            }
                          }

                          const statusConfig = getStatusConfig(request.status)
                          const StatusIcon = statusConfig.icon

                          return (
                            <div
                              key={request.id}
                              className="p-4 border rounded-lg"
                              style={{ borderColor: '#e5e7eb' }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg"
                                      style={{
                                        backgroundColor: statusConfig.bgColor,
                                        color: statusConfig.color
                                      }}
                                    >
                                      <StatusIcon className="size-3" />
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium mb-1" style={{ color: '#666' }}>
                                    Requested: {new Date(request.created_at!).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </p>
                                  {request.paid_at && (
                                    <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                                      Paid: {new Date(request.paid_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  )}
                                  {request.status === 'rejected' && request.rejection_reason && (
                                    <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#fee2e2' }}>
                                      <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>
                                        Reason: {request.rejection_reason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                                    £{(request.amount_pence / 100).toFixed(2)}
                                  </p>
                                  <p className="text-xs" style={{ color: '#666' }}>
                                    ***{request.bank_account_number?.slice(-4)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'addresses' && (
                <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <MapPin size={20} className="sm:w-6 sm:h-6" style={{ color: '#335761' }} />
                      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        Addresses
                      </h2>
                    </div>
                    {hasAddress && !isEditingAddress && (
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: '#335761' }}
                      >
                        Edit Address
                      </button>
                    )}
                  </div>
                  <p className="text-sm mb-6" style={{ color: '#666' }}>
                    {hasAddress ? 'Your saved address information.' : 'Add your address for prize delivery.'}
                  </p>

                  {!hasAddress || isEditingAddress ? (
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={addressForm.address_line1}
                          onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                          required
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="123 Main Street"
                        />
                        <p className="text-xs mt-1" style={{ color: '#999' }}>
                          {addressForm.address_line1.length}/100 characters
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={addressForm.address_line2}
                          onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                        <p className="text-xs mt-1" style={{ color: '#999' }}>
                          {addressForm.address_line2.length}/100 characters
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            City *
                          </label>
                          <input
                            type="text"
                            maxLength={50}
                            value={addressForm.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="London"
                          />
                          <p className="text-xs mt-1" style={{ color: '#999' }}>
                            {addressForm.city.length}/50 characters
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            County
                          </label>
                          <input
                            type="text"
                            maxLength={50}
                            value={addressForm.county}
                            onChange={(e) => handleAddressChange('county', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="Greater London"
                          />
                          <p className="text-xs mt-1" style={{ color: '#999' }}>
                            {addressForm.county.length}/50 characters
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            Postcode *
                          </label>
                          <input
                            type="text"
                            maxLength={10}
                            value={addressForm.postcode}
                            onChange={(e) => handleAddressChange('postcode', e.target.value.toUpperCase())}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="SW1A 1AA"
                          />
                          <p className="text-xs mt-1" style={{ color: '#999' }}>
                            {addressForm.postcode.length}/10 characters
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            Country *
                          </label>
                          <select
                            value={addressForm.country}
                            onChange={(e) => handleAddressChange('country', e.target.value)}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <option value="UK">United Kingdom</option>
                            <option value="GB">Great Britain</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        {isEditingAddress && hasAddress && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingAddress(false)
                              if (profile) {
                                setAddressForm({
                                  address_line1: profile.address_line1 || '',
                                  address_line2: profile.address_line2 || '',
                                  city: profile.city || '',
                                  county: profile.county || '',
                                  postcode: profile.postcode || '',
                                  country: profile.country || 'UK',
                                })
                              }
                            }}
                            className="flex-1 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer"
                            style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isUpdatingAddress}
                          className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#335761' }}
                        >
                          <Save size={18} />
                          {isUpdatingAddress ? 'Saving...' : hasAddress ? 'Update Address' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <p className="font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                          Delivery Address
                        </p>
                        <div style={{ color: '#666' }}>
                          <p>{profile?.address_line1}</p>
                          {profile?.address_line2 && <p>{profile.address_line2}</p>}
                          <p>{profile?.city}{profile?.county ? `, ${profile.county}` : ''}</p>
                          <p>{profile?.postcode}</p>
                          <p>{profile?.country}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'account-details' && (
                <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <User size={20} className="sm:w-6 sm:h-6" style={{ color: '#335761' }} />
                      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        Account Details
                      </h2>
                    </div>
                    {!isEditingAccount && (
                      <button
                        onClick={() => setIsEditingAccount(true)}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: '#335761' }}
                      >
                        Edit Details
                      </button>
                    )}
                  </div>

                  {isEditingAccount ? (
                    <form onSubmit={handleAccountSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            First Name
                          </label>
                          <input
                            type="text"
                            maxLength={50}
                            value={accountForm.first_name}
                            onChange={(e) => handleAccountChange('first_name', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="John"
                          />
                          <p className="text-xs mt-1" style={{ color: '#999' }}>
                            {accountForm.first_name.length}/50 characters
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            Last Name
                          </label>
                          <input
                            type="text"
                            maxLength={50}
                            value={accountForm.last_name}
                            onChange={(e) => handleAccountChange('last_name', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="Doe"
                          />
                          <p className="text-xs mt-1" style={{ color: '#999' }}>
                            {accountForm.last_name.length}/50 characters
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          maxLength={15}
                          value={accountForm.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            handleAccountChange('phone', value)
                          }}
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="07700900000"
                        />
                        <p className="text-xs mt-1" style={{ color: '#999' }}>
                          {accountForm.phone.length}/15 characters (numbers only)
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                          Email (cannot be changed)
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 border rounded-lg bg-gray-50 cursor-not-allowed"
                          style={{ borderColor: '#e5e7eb', color: '#999' }}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingAccount(false)
                            if (profile) {
                              setAccountForm({
                                first_name: profile.first_name || '',
                                last_name: profile.last_name || '',
                                phone: profile.phone || '',
                              })
                            }
                          }}
                          className="flex-1 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer"
                          style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#335761' }}
                        >
                          <Save size={18} />
                          {isUpdating ? 'Saving...' : 'Update Details'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-1 block" style={{ color: '#666' }}>
                          First Name
                        </label>
                        <p className="font-semibold" style={{ color: '#1a1a1a' }}>
                          {profile?.first_name || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1 block" style={{ color: '#666' }}>
                          Last Name
                        </label>
                        <p className="font-semibold" style={{ color: '#1a1a1a' }}>
                          {profile?.last_name || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1 block" style={{ color: '#666' }}>
                          Phone Number
                        </label>
                        <p className="font-semibold" style={{ color: '#1a1a1a' }}>
                          {profile?.phone || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1 block" style={{ color: '#666' }}>
                          Email
                        </label>
                        <p className="font-semibold" style={{ color: '#1a1a1a' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'communication' && (
                <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4">
                    <Bell size={20} className="sm:w-6 sm:h-6" style={{ color: '#335761' }} />
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                      Communication Preferences
                    </h2>
                  </div>
                  <p className="text-sm mb-6" style={{ color: '#666' }}>
                    Manage how you receive updates and notifications. Changes are saved automatically.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded mt-0.5 cursor-pointer"
                          style={{ accentColor: '#335761' }}
                          checked={communicationPrefs.marketing_email}
                          onChange={() => handleCommunicationToggle('marketing_email')}
                        />
                        <div>
                          <span className="font-semibold block" style={{ color: '#1a1a1a' }}>
                            Marketing Emails
                          </span>
                          <span className="text-sm" style={{ color: '#666' }}>
                            Receive emails about new competitions, special offers, and promotions
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded mt-0.5 cursor-pointer"
                          style={{ accentColor: '#335761' }}
                          checked={communicationPrefs.marketing_sms}
                          onChange={() => handleCommunicationToggle('marketing_sms')}
                        />
                        <div>
                          <span className="font-semibold block" style={{ color: '#1a1a1a' }}>
                            SMS Notifications
                          </span>
                          <span className="text-sm" style={{ color: '#666' }}>
                            Receive text messages about competition results and important updates
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f0f9ff' }}>
                      <p className="text-sm" style={{ color: '#0369a1' }}>
                        <strong>Note:</strong> You will always receive important account-related emails such as competition wins, password resets, and order confirmations, regardless of your preferences above.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#1a1a1a' }}>
                Confirm Logout
              </h2>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} className="sm:w-5 sm:h-5" style={{ color: '#666' }} />
              </button>
            </div>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base" style={{ color: '#666' }}>
              Are you sure you want to log out of your account?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: '#dc2626' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prize Claim Modal */}
      {showClaimModal && selectedFulfillment && selectedFulfillment.prize && (
        <UserPrizeClaimModal
          isOpen={showClaimModal}
          onClose={() => {
            setShowClaimModal(false)
            setSelectedFulfillment(null)
          }}
          prize={selectedFulfillment.prize as PrizeTemplate}
          fulfillmentId={selectedFulfillment.id}
          onClaimed={() => {
            setShowClaimModal(false)
            setSelectedFulfillment(null)
          }}
        />
      )}

      {/* Withdrawal Request Modal */}
      <WithdrawalRequestModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={summary.availableBalance}
        onSuccess={loadWithdrawalRequests}
      />

      {/* Win Celebration Modal */}
      {wonPrize && (
        <WinCelebrationModal
          isOpen={showWinModal}
          onClose={() => setShowWinModal(false)}
          prize={wonPrize}
        />
      )}
    </div>
  )
}

export default Account
