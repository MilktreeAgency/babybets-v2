import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LogOut, MapPin, User, Bell, LayoutDashboard, X, Save, Wallet, Clock, TrendingUp, Gift, Ticket, Search } from 'lucide-react'
import Header from '@/components/common/Header'
import { useAuthStore } from '@/store/authStore'
import { useTickets } from '@/hooks/useTickets'
import { useProfile } from '@/hooks/useProfile'
import { useWallet } from '@/hooks/useWallet'
import { usePrizeFulfillments } from '@/hooks/usePrizeFulfillments'
import { UserPrizeClaimModal } from '@/components/UserPrizeClaimModal'
import { ScratchCard } from '@/components/ScratchCard'
import { authService } from '@/services/auth.service'
import type { PrizeTemplate } from '@/types'

type Section = 'dashboard' | 'tickets' | 'prizes' | 'wallet' | 'addresses' | 'account-details' | 'communication' | 'logout'

function Account() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [isBulkRevealing, setIsBulkRevealing] = useState(false)
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
  const [ticketSearchQuery, setTicketSearchQuery] = useState('')

  useEffect(() => {
    if (!isLoading && isInitialized && !isAuthenticated) {
      navigate('/login?redirect=/account')
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate])

  // Sync activeSection with URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Section | null
    if (tabParam && ['dashboard', 'tickets', 'prizes', 'wallet', 'addresses', 'account-details', 'communication'].includes(tabParam)) {
      setActiveSection(tabParam)
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

  const hasAddress = profile && profile.address_line1 && profile.city && profile.postcode

  // Bulk reveal all tickets
  const handleRevealAll = async () => {
    if (isBulkRevealing || isRevealing) return

    const unrevealedTickets = tickets.filter(t => !t.is_revealed)
    if (unrevealedTickets.length === 0) return

    setIsBulkRevealing(true)
    try {
      // Reveal all tickets sequentially
      for (const ticket of unrevealedTickets) {
        await revealTicket(ticket.id)
      }
    } catch (error) {
      console.error('Error revealing tickets:', error)
      alert('Failed to reveal some tickets. Please try again.')
    } finally {
      setIsBulkRevealing(false)
    }
  }

  // Filter tickets based on search query
  const filteredTickets = tickets.filter((ticket) => {
    if (!ticketSearchQuery) return true

    const query = ticketSearchQuery.toLowerCase()
    const competitionTitle = ticket.competition?.title?.toLowerCase() || ''
    const ticketNumber = ticket.ticket_number?.toString() || ''
    const prizeName = ticket.prize?.name?.toLowerCase() || ''
    const status = ticket.is_revealed ? 'revealed' : 'unrevealed'
    const winnerStatus = ticket.prize_id ? 'winner' : 'no prize'

    return (
      competitionTitle.includes(query) ||
      ticketNumber.includes(query) ||
      prizeName.includes(query) ||
      status.includes(query) ||
      winnerStatus.includes(query)
    )
  })

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

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="antialiased relative h-screen flex flex-col" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <div className="flex-1 overflow-y-auto pt-34 pb-8 px-6">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
            {/* Sidebar */}
            <div className="lg:w-82 shrink-0">
              <div className="bg-white rounded-xl p-4 lg:sticky lg:top-8">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSectionChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors text-left cursor-pointer ${
                          item.id === 'logout'
                            ? 'text-red-600 hover:bg-red-50'
                            : isActive
                            ? 'text-white'
                            : 'text-[#666] hover:bg-gray-50'
                        }`}
                        style={isActive && item.id !== 'logout' ? { backgroundColor: '#335761' } : {}}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="text-sm leading-tight flex-1">{item.label}</span>
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
                  <div className="bg-white rounded-xl p-6">
                    <h1 className="text-3xl font-bold mb-3" style={{ color: '#1a1a1a' }}>
                      Hello {user?.name || 'User'}
                    </h1>
                    <p className="text-base" style={{ color: '#666' }}>
                      From your account dashboard you can view your tickets, manage your prizes, check your wallet balance, and edit your account details.
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tickets Card */}
                    <button
                      onClick={() => {
                        setActiveSection('tickets')
                        setSearchParams({ tab: 'tickets' })
                      }}
                      className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff' }}>
                          <Ticket size={24} style={{ color: '#335761' }} />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Tickets
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#666' }}>Total</span>
                          <span className="font-bold" style={{ color: '#1a1a1a' }}>{tickets.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
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
                      className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                          <Gift size={24} style={{ color: '#f59e0b' }} />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Prizes
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#666' }}>Pending</span>
                          <span className="font-bold text-orange-600">{pendingFulfillments.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
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
                      className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
                          <Wallet size={24} style={{ color: '#22c55e' }} />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          My Wallet
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#666' }}>Balance</span>
                          <span className="font-bold" style={{ color: '#1a1a1a' }}>
                            £{(summary.availableBalance / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#666' }}>Active Credits</span>
                          <span className="font-bold" style={{ color: '#1a1a1a' }}>{credits.length}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'tickets' && (
                <div className="space-y-6">
                  {/* Tickets Header */}
                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Ticket size={24} style={{ color: '#335761' }} />
                      <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        My Tickets
                      </h2>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Ticket size={18} style={{ color: '#335761' }} />
                          <span className="text-sm font-semibold" style={{ color: '#666' }}>
                            Total Tickets
                          </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          {tickets.length}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Gift size={18} style={{ color: '#f59e0b' }} />
                          <span className="text-sm font-semibold" style={{ color: '#666' }}>
                            Unrevealed
                          </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          {unrevealedCount}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Gift size={18} style={{ color: '#22c55e' }} />
                          <span className="text-sm font-semibold" style={{ color: '#666' }}>
                            Revealed
                          </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                          {tickets.filter(t => t.is_revealed).length}
                        </p>
                      </div>
                    </div>

                    {/* Unrevealed Alert */}
                    {unrevealedCount > 0 && (
                      <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                        <p className="font-semibold" style={{ color: '#92400e' }}>
                          🎉 You have {unrevealedCount} unrevealed ticket{unrevealedCount > 1 ? 's' : ''}!
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#92400e' }}>
                          Scratch them below to see if you've won a prize!
                        </p>
                      </div>
                    )}

                    {/* Search Bar */}
                    {tickets.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5" style={{ color: '#666' }} />
                        <input
                          type="text"
                          value={ticketSearchQuery}
                          onChange={(e) => setTicketSearchQuery(e.target.value)}
                          placeholder="Search by competition, ticket number, prize, or status..."
                          className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all"
                          style={{ borderColor: '#e5e7eb', backgroundColor: '#fff' }}
                        />
                        {ticketSearchQuery && (
                          <button
                            onClick={() => setTicketSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                          >
                            <X className="size-4" style={{ color: '#666' }} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Unrevealed Tickets */}
                  {filteredTickets.filter(t => !t.is_revealed).length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                          Scratch to Reveal
                          {ticketSearchQuery && (
                            <span className="text-sm font-normal ml-2" style={{ color: '#666' }}>
                              ({filteredTickets.filter(t => !t.is_revealed).length} found)
                            </span>
                          )}
                        </h3>
                        {!ticketSearchQuery && (
                          <button
                            onClick={handleRevealAll}
                            disabled={isBulkRevealing || isRevealing}
                            className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{ backgroundColor: '#335761' }}
                          >
                            {isBulkRevealing ? 'Revealing All...' : `Reveal All (${unrevealedCount})`}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTickets.filter(t => !t.is_revealed).map((ticket) => (
                          <ScratchCard
                            key={ticket.id}
                            ticket={ticket}
                            onReveal={revealTicket}
                            disabled={isRevealing || isBulkRevealing}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revealed Tickets */}
                  {filteredTickets.filter(t => t.is_revealed).length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                        Revealed Tickets
                        {ticketSearchQuery && (
                          <span className="text-sm font-normal ml-2" style={{ color: '#666' }}>
                            ({filteredTickets.filter(t => t.is_revealed).length} found)
                          </span>
                        )}
                      </h3>
                      <div className="space-y-3">
                        {filteredTickets.filter(t => t.is_revealed).map((ticket) => (
                          <div
                            key={ticket.id}
                            className="p-4 border rounded-lg"
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <div className="flex items-start gap-3">
                              {ticket.competition?.image_url ? (
                                <img
                                  src={ticket.competition.image_url}
                                  alt={ticket.competition.title}
                                  className="size-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="size-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Ticket className="size-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold mb-1" style={{ color: '#1a1a1a' }}>
                                  {ticket.competition?.title || 'Competition'}
                                </h4>
                                <p className="text-sm mb-2" style={{ color: '#666' }}>
                                  Ticket #{ticket.ticket_number}
                                </p>
                                <div className="flex items-center gap-2">
                                  {ticket.prize_id ? (
                                    <>
                                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                        ✓ Winner!
                                      </span>
                                      {ticket.prize && (
                                        <span className="text-xs" style={{ color: '#666' }}>
                                          {ticket.prize.name}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#666' }}>
                                      No prize
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs" style={{ color: '#666' }}>
                                  Revealed
                                </p>
                                <p className="text-xs" style={{ color: '#666' }}>
                                  {ticket.revealed_at ? new Date(ticket.revealed_at).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Search Results Message */}
                  {ticketSearchQuery && filteredTickets.length === 0 && tickets.length > 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <div className="text-center py-12">
                        <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Search className="size-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                          No Tickets Found
                        </h3>
                        <p className="mb-4" style={{ color: '#666' }}>
                          No tickets match your search for "{ticketSearchQuery}"
                        </p>
                        <button
                          onClick={() => setTicketSearchQuery('')}
                          className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
                          style={{ backgroundColor: '#335761' }}
                        >
                          Clear Search
                        </button>
                      </div>
                    </div>
                  )}

                  {/* No Tickets Message */}
                  {tickets.length === 0 && (
                    <div className="bg-white rounded-xl p-6">
                      <div className="text-center py-12">
                        <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Ticket className="size-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                          No Tickets Yet
                        </h3>
                        <p style={{ color: '#666' }}>
                          Purchase tickets to enter competitions and win prizes!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'prizes' && (
                <div className="space-y-6">
                  {/* Prizes Header */}
                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Gift size={24} style={{ color: '#335761' }} />
                      <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
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
                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Wallet size={24} style={{ color: '#335761' }} />
                      <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        My Wallet
                      </h2>
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
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                        Your Credits
                      </h3>
                      <div className="space-y-3">
                        {credits.map((credit) => (
                          <div
                            key={credit.id}
                            className="p-4 border rounded-lg flex items-center justify-between"
                            style={{
                              borderColor: credit.isExpiringSoon ? '#fbbf24' : '#e5e7eb',
                              backgroundColor: credit.isExpiringSoon ? '#fef3c7' : 'transparent',
                            }}
                          >
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: '#1a1a1a' }}>
                                {credit.description}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm" style={{ color: '#666' }}>
                                  {credit.source_type}
                                </span>
                                <span className="text-sm" style={{ color: '#666' }}>
                                  Expires: {new Date(credit.expires_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold" style={{ color: '#335761' }}>
                                £{(credit.remaining_pence / 100).toFixed(2)}
                              </p>
                              {credit.remaining_pence < credit.amount_pence && (
                                <p className="text-xs" style={{ color: '#666' }}>
                                  of £{(credit.amount_pence / 100).toFixed(2)}
                                </p>
                              )}
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
                </div>
              )}

              {activeSection === 'addresses' && (
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MapPin size={24} style={{ color: '#335761' }} />
                      <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        Addresses
                      </h2>
                    </div>
                    {hasAddress && !isEditingAddress && (
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
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
                          value={addressForm.address_line1}
                          onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                          required
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={addressForm.address_line2}
                          onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            City *
                          </label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="London"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            County
                          </label>
                          <input
                            type="text"
                            value={addressForm.county}
                            onChange={(e) => handleAddressChange('county', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="Greater London"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            Postcode *
                          </label>
                          <input
                            type="text"
                            value={addressForm.postcode}
                            onChange={(e) => handleAddressChange('postcode', e.target.value.toUpperCase())}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="SW1A 1AA"
                          />
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
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <User size={24} style={{ color: '#335761' }} />
                      <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                        Account Details
                      </h2>
                    </div>
                    {!isEditingAccount && (
                      <button
                        onClick={() => setIsEditingAccount(true)}
                        className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
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
                            value={accountForm.first_name}
                            onChange={(e) => handleAccountChange('first_name', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="John"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={accountForm.last_name}
                            onChange={(e) => handleAccountChange('last_name', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb' }}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: '#666' }}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={accountForm.phone}
                          onChange={(e) => handleAccountChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="+44 7700 900000"
                        />
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
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Bell size={24} style={{ color: '#335761' }} />
                    <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                Confirm Logout
              </h2>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} style={{ color: '#666' }} />
              </button>
            </div>
            <p className="mb-6" style={{ color: '#666' }}>
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 cursor-pointer"
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
    </div>
  )
}

export default Account
