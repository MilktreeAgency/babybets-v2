import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { Trophy, Plus, Minus, Share2, ArrowLeft, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { RichTextDisplay } from '@/components/ui/RichTextDisplay'

type Competition = Database['public']['Tables']['competitions']['Row']

interface TieredPrice {
  minQty: number
  maxQty: number
  pricePerTicketPence: number
}

interface InstantWinPrize {
  id: string
  competition_id: string
  prize_code: string
  total_quantity: number
  remaining_quantity: number
  tier: number
  prize_template: {
    id: string
    name: string
    short_name: string | null
    type: string
    value_gbp: number
    cash_alternative_gbp: number | null
    description: string | null
    image_url: string | null
  }
  winning_tickets?: Array<{
    ticket_number: string
    ticket_id: string
    is_sold: boolean
  }>
}

function CompetitionEntry() {
  const { slug } = useParams()
  const { addItem, setCartOpen } = useCartStore()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(10)
  const [tieredPricing, setTieredPricing] = useState<TieredPrice[]>([])
  const [instantWinPrizes, setInstantWinPrizes] = useState<InstantWinPrize[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'prize' | 'details'>('details')
  const [expandedPrizeId, setExpandedPrizeId] = useState<string | null>(null)
  const [prizeTabs, setPrizeTabs] = useState<Record<string, 'tickets' | 'description'>>({})
  const [entryMode, setEntryMode] = useState<'paid' | 'postal'>('paid')
  const [showStickyBar, setShowStickyBar] = useState(false)

  useEffect(() => {
    if (slug) {
      loadCompetition()
    }
  }, [slug])

  // Real-time subscription for instant win prize updates
  useEffect(() => {
    if (!competition) return

    // Subscribe to ticket allocation changes (when prizes are won)
    const channel = supabase
      .channel('instant-win-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_allocations',
          filter: `competition_id=eq.${competition.id}`,
        },
        () => {
          // Reload instant win prizes when any ticket allocation changes
          loadInstantWinPrizes(competition.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [competition])

  // Scroll detection for sticky bottom bar (mobile)
  useEffect(() => {
    const handleScroll = () => {
      const ticketSelector = document.getElementById('ticket-selector')
      if (ticketSelector) {
        const rect = ticketSelector.getBoundingClientRect()
        // Show sticky bar when ticket selector scrolls out of view
        setShowStickyBar(rect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set default tab based on competition type
  useEffect(() => {
    if (competition) {
      if (competition.competition_type === 'instant_win' || competition.competition_type === 'instant_win_with_end_prize') {
        setActiveTab('prize')
      } else {
        setActiveTab('details')
      }
    }
  }, [competition])

  const loadInstantWinPrizes = async (competitionId: string) => {
    try {
      const { data: prizes, error: prizesError } = await supabase
        .from('competition_instant_win_prizes')
        .select(`
          id,
          competition_id,
          prize_code,
          total_quantity,
          remaining_quantity,
          tier,
          prize_templates (
            id,
            name,
            short_name,
            type,
            value_gbp,
            cash_alternative_gbp,
            description,
            image_url
          )
        `)
        .eq('competition_id', competitionId)
        .order('tier', { ascending: true })

      if (!prizesError && prizes) {
        // Fetch ALL tickets assigned to prizes (both sold and unsold)
        const { data: allPrizeTickets } = await supabase
          .from('ticket_allocations')
          .select('id, ticket_number, prize_id, is_sold')
          .eq('competition_id', competitionId)
          .not('prize_id', 'is', null)

        const mappedPrizes = prizes.map((p: Record<string, unknown>) => {
          const prizeTickets = allPrizeTickets?.filter(
            (ticket) => ticket.prize_id === p.id
          ).map((ticket) => ({
            ticket_number: ticket.ticket_number,
            ticket_id: ticket.id,
            is_sold: ticket.is_sold || false
          })) || []

          return {
            id: p.id,
            competition_id: p.competition_id,
            prize_code: p.prize_code,
            total_quantity: p.total_quantity,
            remaining_quantity: p.remaining_quantity,
            tier: p.tier,
            prize_template: p.prize_templates,
            winning_tickets: prizeTickets
          }
        }) as InstantWinPrize[]

        setInstantWinPrizes(mappedPrizes)
      }
    } catch (error) {
      console.error('Error loading instant win prizes:', error)
    }
  }

  const loadCompetition = async () => {
    try {
      setLoading(true)
      if (!slug) throw new Error('No competition slug provided')

      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error

      setCompetition(data)

      // Load tiered pricing if available
      if (data.tiered_pricing && Array.isArray(data.tiered_pricing)) {
        setTieredPricing(data.tiered_pricing as unknown as TieredPrice[])
      }

      // Load instant win prizes if applicable
      if (
        data.competition_type === 'instant_win' ||
        data.competition_type === 'instant_win_with_end_prize'
      ) {
        await loadInstantWinPrizes(data.id)
      }
    } catch (error) {
      console.error('Error loading competition:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate number of postal entries based on ticket price
  // Formula: entries_per_postcard = max(1, ceil(stamp_price_pence / ticket_price_pence))
  const calculatePostalEntries = () => {
    if (!competition?.base_ticket_price_pence || competition.base_ticket_price_pence <= 0) return 1
    const stampPricePence = 87 // UK Second Class stamp price
    const ticketPricePence = competition.base_ticket_price_pence
    const entries = Math.ceil(stampPricePence / ticketPricePence)
    return Math.max(1, entries)
  }

  const calculatePrice = (qty: number) => {
    if (!competition) {
      console.error('calculatePrice called without competition loaded')
      return 0
    }

    if (qty <= 0) {
      console.warn('calculatePrice called with invalid quantity:', qty)
      return 0
    }

    // Validate base ticket price exists
    if (!competition.base_ticket_price_pence || competition.base_ticket_price_pence <= 0) {
      console.error('Competition has invalid base_ticket_price_pence:', competition.base_ticket_price_pence)
      return 0
    }

    if (tieredPricing.length === 0) {
      return (qty * competition.base_ticket_price_pence) / 100
    }

    // Find the tier that applies to the total quantity
    const sortedTiers = [...tieredPricing].sort((a, b) => a.minQty - b.minQty)
    const applicableTier = [...sortedTiers]
      .reverse()
      .find(tier => qty >= tier.minQty && qty <= tier.maxQty)

    const pricePerTicketPence = applicableTier
      ? applicableTier.pricePerTicketPence
      : competition.base_ticket_price_pence

    return (qty * pricePerTicketPence) / 100
  }

  const pricingDetails = useMemo(() => {
    if (!competition) return { total: 0, perTicket: 0, savings: 0 }

    const total = calculatePrice(quantity)
    const perTicket = quantity > 0 ? total / quantity : 0
    const baseTotal = (quantity * competition.base_ticket_price_pence) / 100
    const savings = Math.max(0, baseTotal - total)

    // Log warning if prices are invalid
    if (total <= 0 || perTicket <= 0) {
      console.warn('Invalid pricing calculated:', { total, perTicket, quantity, competition })
    }

    return { total, perTicket, savings }
  }, [quantity, competition, tieredPricing])

  const getProgressPercentage = () => {
    if (!competition || competition.max_tickets === 0 || competition.tickets_sold === null) return 0
    return Math.min((competition.tickets_sold / competition.max_tickets) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const year = date.getFullYear()

    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'

    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`
  }

  const maxPurchase = useMemo(() => {
    if (!competition) return 100
    const ticketsSold = competition.tickets_sold || 0
    const maxPerUser = competition.max_tickets_per_user || competition.max_tickets
    return Math.min(
      competition.max_tickets - ticketsSold,
      maxPerUser
    )
  }, [competition])

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.min(Math.max(1, prev + delta), maxPurchase))
  }

  const quickSelectOptions = useMemo(() => {
    const options = [10, 25, 50, 100]
    return options.filter(opt => opt <= maxPurchase)
  }, [maxPurchase])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Win ${competition?.title} on BabyBets`,
          text: `Check out this competition!`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleAddToCart = () => {
    if (!competition) return

    // Validate pricing before adding to cart
    if (!pricingDetails.total || pricingDetails.total <= 0) {
      alert('Unable to add to cart: Invalid price. Please refresh the page and try again.')
      console.error('Invalid pricing details:', { pricingDetails, competition })
      return
    }

    if (!pricingDetails.perTicket || pricingDetails.perTicket <= 0) {
      alert('Unable to add to cart: Invalid price per ticket. Please refresh the page and try again.')
      console.error('Invalid per ticket price:', { pricingDetails, competition })
      return
    }

    if (quantity <= 0) {
      alert('Please select at least 1 ticket')
      return
    }

    // Use first image from images array, or fallback to image_url
    const displayImage = allImages[0]

    addItem({
      competitionId: competition.id,
      competitionTitle: competition.title,
      competitionSlug: competition.slug,
      imageUrl: displayImage,
      quantity,
      pricePerTicket: pricingDetails.perTicket,
      totalPrice: pricingDetails.total,
    })

    // Open cart drawer
    setCartOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
        <Header />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block size-12 border-4 rounded-full animate-spin" style={{ borderColor: '#e7e5e4', borderTopColor: '#496B71' }}></div>
            <p className="mt-4 text-gray-600">Loading competition...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
        <Header />
        <div className="pt-32 px-6 text-center">
          <Trophy className="size-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Competition Not Found</h1>
          <p className="text-gray-600 mb-6">The competition you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="size-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const percentSold = (((competition.tickets_sold || 0) / competition.max_tickets) * 100)

  // Get all images for carousel
  const images = (competition.images as string[]) || []
  const allImages = images.length > 0 ? images : [competition.image_url]

  // Scroll to ticket selector
  const scrollToTicketSelector = () => {
    const element = document.getElementById('ticket-selector')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
      <Header />

      {/* Main Content */}
      <div className="pt-16 sm:pt-20 pb-24 md:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Mobile-First Layout: Image, Title, Ticket Selector stacked */}
          <div className="lg:hidden space-y-4 sm:space-y-6">
            {/* Image Gallery - Mobile */}
            <div className="space-y-3">
              {/* Featured Image */}
              <div
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{
                  backgroundColor: '#FBEFDF',
                  borderWidth: '1px',
                  borderColor: '#f0e0ca'
                }}
              >
                <img
                  key={selectedImageIndex}
                  src={allImages[selectedImageIndex]}
                  alt={competition.title}
                  className="w-full h-full object-cover animate-fade-in"
                />

                {competition.status === 'ending_soon' && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    Ending Soon!
                  </div>
                )}
                {competition.status === 'scheduled' && (
                  <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    Coming Soon
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedImageIndex(index) } }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                      style={{
                        backgroundColor: '#FBEFDF',
                        borderWidth: selectedImageIndex === index ? '2px' : '1px',
                        borderColor: selectedImageIndex === index ? '#496B71' : '#f0e0ca',
                        transition: 'border-color 200ms ease, border-width 200ms ease'
                      }}
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={selectedImageIndex === index}
                    >
                      <img
                        src={image}
                        alt={`${competition.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Right: Entry Form */}
            <div>
              {/* Category Badge - Centered */}
              <div className="mb-4 text-center">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer"
                  style={{
                    backgroundColor: '#fff0e6',
                    borderWidth: '1px',
                    borderColor: '#ffdec9',
                    color: '#151e20'
                  }}
                >
                  {competition.category}
                </span>
              </div>

              {/* Title - Centered */}
              <h1 className="text-4xl sm:text-5xl md:text-5xl font-bold mb-2 leading-tight text-center" style={{ fontFamily: "'Fraunces', serif" }}>
                {competition.title}
              </h1>

              {/* Short Description */}
              {competition.short_description && (
                <p className="text-sm sm:text-base text-center mb-4 sm:mb-6 line-clamp-3" style={{ color: '#78716c' }}>
                  {competition.short_description}
                </p>
              )}

              {/* Price - Centered */}
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-[10px] sm:text-xs font-bold uppercase mb-1" style={{ color: '#78716c' }}>From</p>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#496B71' }}>
                  £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                </div>
                <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#78716c' }}>per ticket</p>
              </div>

              {/* Progress - Simple */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-2" style={{ color: '#666666' }}>
                  <span>{percentSold.toFixed(0)}% Sold</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e7e5e4' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${getProgressPercentage()}%`,
                      background: 'linear-gradient(to right, #FED0B9, #fa8c61)'
                    }}
                  />
                </div>
                <div className="text-[10px] sm:text-xs font-semibold mt-2 text-center" style={{ color: '#666666' }}>
                  {competition.tickets_sold || 0}/{competition.max_tickets}
                </div>
              </div>

              {/* Ticket Selector */}
              <div id="ticket-selector" className="mb-4 sm:mb-6">
                <div className="rounded-lg p-3 sm:p-4" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#f0e0ca' }}>
                  {/* Entry Mode Toggle */}
                  <div className="flex items-stretch gap-0 mb-4 sm:mb-6">
                    <button
                      onClick={() => setEntryMode('paid')}
                      className="flex-1 py-2.5 sm:py-3 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                      style={{
                        backgroundColor: entryMode === 'paid' ? '#496B71' : 'transparent',
                        color: entryMode === 'paid' ? 'white' : '#78716c',
                        borderWidth: '2px',
                        borderColor: entryMode === 'paid' ? '#496B71' : '#e7e5e4',
                        borderTopLeftRadius: '0.5rem',
                        borderBottomLeftRadius: '0.5rem',
                        borderRight: 'none'
                      }}
                    >
                      Paid Entry
                    </button>
                    <button
                      onClick={() => setEntryMode('postal')}
                      className="flex-1 py-2.5 sm:py-3 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                      style={{
                        backgroundColor: entryMode === 'postal' ? '#496B71' : 'transparent',
                        color: entryMode === 'postal' ? 'white' : '#78716c',
                        borderWidth: '2px',
                        borderColor: entryMode === 'postal' ? '#496B71' : '#e7e5e4',
                        borderTopRightRadius: '0.5rem',
                        borderBottomRightRadius: '0.5rem',
                        borderLeft: 'none'
                      }}
                    >
                      <span className="hidden sm:inline">Free Postal Entry</span>
                      <span className="sm:hidden">Postal Entry</span>
                    </button>
                  </div>

                  {/* Paid Entry Section */}
                  {entryMode === 'paid' && (
                    <>
                  {/* Quick Select Buttons - Only show if tiered pricing exists */}
                  {tieredPricing.length > 0 && quickSelectOptions.length > 0 && (
                    <>
                      <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3">Choose Your Tickets</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-4">
                      {quickSelectOptions.map((option) => {
                        const optionPrice = calculatePrice(option)
                        const basePrice = (option * (competition.base_ticket_price_pence / 100))
                        const savings = basePrice - optionPrice
                        return (
                          <button
                            key={option}
                            onClick={() => setQuantity(option)}
                            className="relative pt-2.5 sm:pt-3 p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer"
                            style={{
                              borderWidth: '1px',
                              borderColor: quantity === option ? '#496B71' : '#f0e0ca',
                              backgroundColor: quantity === option ? '#e1eaec' : 'white'
                            }}
                            onMouseEnter={(e) => {
                              if (quantity !== option) {
                                e.currentTarget.style.borderColor = '#e7e5e4'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (quantity !== option) {
                                e.currentTarget.style.borderColor = '#f0e0ca'
                              }
                            }}
                          >
                            {savings > 0 && (
                              <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap"
                                style={{
                                  backgroundColor: 'white',
                                  borderWidth: '1px',
                                  borderColor: '#22c55e',
                                  color: '#22c55e'
                                }}
                              >
                                Save £{savings.toFixed(2)}
                              </div>
                            )}
                            <div className="font-bold text-sm sm:text-base">{option}</div>
                            <div className="text-[10px] sm:text-xs" style={{ color: '#78716c' }}>
                              £{optionPrice.toFixed(2)}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    </>
                  )}

                  {/* Custom Amount */}
                  <div>
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <span className="font-medium text-[10px] sm:text-xs" style={{ color: '#78716c' }}>Custom Amount</span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => adjustQuantity(-1)}
                          disabled={quantity <= 1}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          style={{ backgroundColor: '#FBEFDF' }}
                          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f0e0ca')}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FBEFDF'}
                        >
                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                        <div className="rounded px-2.5 sm:px-3 py-1 font-bold text-base sm:text-lg min-w-[45px] sm:min-w-[50px] text-center" style={{ backgroundColor: '#fff0e6', borderWidth: '1px', borderColor: '#f0e0ca' }}>
                          {quantity}
                        </div>
                        <button
                          onClick={() => adjustQuantity(1)}
                          disabled={quantity >= maxPurchase}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          style={{ backgroundColor: '#FBEFDF' }}
                          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f0e0ca')}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FBEFDF'}
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max={maxPurchase}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{ backgroundColor: '#e7e5e4', accentColor: '#496B71' }}
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs mt-1.5" style={{ color: '#a8a29e' }}>
                      <span>1</span>
                      <span>{maxPurchase}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-3 sm:my-4" style={{ borderTopWidth: '1px', borderColor: '#f0e0ca' }}></div>

                  {/* Total and CTA */}
                  <div>
                    <div className="flex justify-between items-center pb-3 sm:pb-4 mb-3 sm:mb-4">
                      <div>
                        <span className="font-medium block text-[10px] sm:text-xs" style={{ color: '#78716c' }}>Total Price</span>
                        {pricingDetails.savings > 0 && (
                          <span className="text-[10px] sm:text-xs font-bold" style={{ color: '#22c55e' }}>
                            You save £{pricingDetails.savings.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block text-xl sm:text-2xl font-bold" style={{ color: '#496B71' }}>£{pricingDetails.total.toFixed(2)}</span>
                        {quantity > 1 && (
                          <span className="text-[10px] sm:text-xs font-medium" style={{ color: '#78716c' }}>
                            £{pricingDetails.perTicket.toFixed(2)} per ticket
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className="w-full font-bold py-3 sm:py-4 text-sm sm:text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      style={{
                        backgroundColor: '#496B71',
                        color: 'white',
                        transition: 'background-color 200ms ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fa8c61'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
                      disabled={competition.status === 'scheduled'}
                    >
                      {competition.status === 'scheduled' ? 'Coming Soon' : 'Add to Basket'}
                    </button>
                    <p className="text-[10px] sm:text-xs text-center mt-2 sm:mt-3" style={{ color: '#78716c' }}>
                      By entering, you agree to our Terms & Conditions
                    </p>
                  </div>
                </>
              )}

              {/* Postal Entry Section */}
              {entryMode === 'postal' && (
                <div className="space-y-4">
                  {/* Free Postal Entry Box */}
                  <div
                    className="rounded-lg p-4 text-center"
                    style={{
                      backgroundColor: '#e1eaec',
                      borderWidth: '2px',
                      borderColor: '#496B71'
                    }}
                  >
                    <p className="text-xs font-bold uppercase mb-2" style={{ color: '#78716c' }}>
                      FREE POSTAL ENTRY
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#496B71' }}>
                      {calculatePostalEntries()} {calculatePostalEntries() === 1 ? 'Entry' : 'Entries'}
                    </p>
                    <p className="text-xs" style={{ color: '#78716c' }}>
                      Based on ticket price of £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                    </p>
                  </div>

                  {/* Competition-level line */}
                  <div className="text-sm text-center" style={{ color: '#151e20' }}>
                    <p>
                      <strong>Postal entries to this competition receive {calculatePostalEntries()} {calculatePostalEntries() === 1 ? 'ticket' : 'tickets'}.</strong>
                    </p>
                  </div>

                  {/* Postal Entry Terms */}
                  <div className="space-y-3 text-xs sm:text-sm" style={{ color: '#78716c' }}>
                    <div>
                      <h3 className="font-bold mb-2" style={{ color: '#151e20' }}>Postal Entry Route</h3>
                      <p>
                        You may enter a BabyBets competition for free using our Postal Entry Route by complying with the conditions below.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>1. Where to send your entry</h4>
                      <p className="mb-2">
                        Send your entry on an unenclosed postcard by First or Second Class post to:
                      </p>
                      <div className="pl-4 mb-2" style={{ color: '#151e20' }}>
                        <p className="font-medium">BabyBets</p>
                        <p>Unit B2, Beacon House</p>
                        <p>Cumberland Business Centre</p>
                        <p>Portsmouth, Hampshire</p>
                        <p>PO5 1DS</p>
                      </div>
                      <p className="italic">Hand delivered entries will not be accepted.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>2. What to include on the postcard</h4>
                      <p className="mb-2">Your postcard must clearly include:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Your full name</li>
                        <li>Your full postal address</li>
                        <li>A contact telephone number</li>
                        <li>The email address linked to your BabyBets account</li>
                        <li>The name of the competition you want to enter</li>
                        <li>The answer to the competition question (where a question applies)</li>
                      </ul>
                      <p className="mt-2 italic">Incomplete or illegible entries will be disqualified.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>3. Account requirement</h4>
                      <p className="mb-2">
                        Entrants must have created a BabyBets account for a free postal entry to be processed.
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>The details on the postcard must match the details on the account.</li>
                        <li>Postal entries received without a matching registered account cannot be processed.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>4. One postcard per entry request (no bundles)</h4>
                      <p className="mb-2">Each postcard counts as one postal entry request.</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>You may make multiple free entries for any competition (up to any entry limit stated on the competition page).</li>
                        <li>Each free entry must be sent on a separate postcard and posted separately.</li>
                        <li>Bulk entries in one envelope will not be accepted as multiple entries. If bulk entries are received, they will be counted as one single entry request.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>5. Entry limits still apply</h4>
                      <p className="mb-2">
                        If a competition has a maximum entry limit per person, that limit applies to postal entries too.
                      </p>
                      <p>If you send entries above the stated limit, we will only process entries up to the limit.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>6. Closing dates, sell-outs and late entries</h4>
                      <p className="mb-2">
                        Your postcard must be received before the competition closing date and time shown on the competition page.
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Entries received after the closing date will not be entered into the competition.</li>
                        <li>If the competition sells out before your valid postal entry is received, your entry will not be entered.</li>
                        <li>Postal entries received after a competition has closed or sold out are void and will not be credited or transferred.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>7. No confirmation of entry</h4>
                      <p className="mb-2">
                        We do not acknowledge receipt of postal entries and we do not confirm whether your entry has been successfully processed.
                      </p>
                      <p>
                        If your postal entry is valid and received before the closing date, it will be entered into the relevant competition automatically. You will only be contacted if you win.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>8. General</h4>
                      <p className="mb-2">
                        By entering using the Postal Entry Route, you confirm that you are eligible to enter and that you accept our Terms and Conditions.
                      </p>
                      <p>
                        For full details, please refer to our{' '}
                        <Link to="/legal/website-terms" className="font-bold underline cursor-pointer" style={{ color: '#496B71' }}>
                          Website Terms of Use
                        </Link>,{' '}
                        <Link to="/legal/terms" className="font-bold underline cursor-pointer" style={{ color: '#496B71' }}>
                          Terms and Conditions
                        </Link>{' '}and{' '}
                        <Link to="/legal/privacy" className="font-bold underline cursor-pointer" style={{ color: '#496B71' }}>
                          Privacy Policy
                        </Link>.
                      </p>
                    </div>

                    <div
                      className="mt-4 p-3 rounded-lg"
                      style={{ backgroundColor: '#fff0e6', borderWidth: '1px', borderColor: '#ffdec9' }}
                    >
                      <p className="font-bold mb-1" style={{ color: '#151e20' }}>Postal service disclaimer</p>
                      <p>
                        We are not responsible for postal entries that are lost, delayed, damaged, or misdirected in the post. Proof of posting is not proof of receipt. Only postal entries received by us before the competition closing date and time will be valid.
                      </p>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </div>

              {/* Share Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm transition-colors cursor-pointer"
                  style={{ color: '#78716c' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#151e20'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#78716c'}
                >
                  <Share2 className="size-4" />
                  Share this competition
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout: 2-Column Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-8">
            {/* Left Column: Images */}
            <div className="space-y-4">
              {/* Featured Image */}
              <div
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{
                  backgroundColor: '#FBEFDF',
                  borderWidth: '1px',
                  borderColor: '#f0e0ca'
                }}
              >
                <img
                  key={selectedImageIndex}
                  src={allImages[selectedImageIndex]}
                  alt={competition.title}
                  className="w-full h-full object-cover animate-fade-in"
                />

                {competition.status === 'ending_soon' && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    Ending Soon!
                  </div>
                )}
                {competition.status === 'scheduled' && (
                  <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    Coming Soon
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedImageIndex(index) } }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                      style={{
                        backgroundColor: '#FBEFDF',
                        borderWidth: selectedImageIndex === index ? '2px' : '1px',
                        borderColor: selectedImageIndex === index ? '#496B71' : '#f0e0ca',
                        transition: 'border-color 200ms ease, border-width 200ms ease'
                      }}
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={selectedImageIndex === index}
                    >
                      <img
                        src={image}
                        alt={`${competition.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Entry Details */}
            <div className="flex flex-col">
              {/* Category Badge */}
              <div className="mb-4 text-center">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer"
                  style={{
                    backgroundColor: '#fff0e6',
                    borderWidth: '1px',
                    borderColor: '#ffdec9',
                    color: '#151e20'
                  }}
                >
                  {competition.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-5xl font-bold mb-2 leading-tight text-center" style={{ fontFamily: "'Fraunces', serif" }}>
                {competition.title}
              </h1>

              {/* Short Description */}
              {competition.short_description && (
                <p className="text-base text-center mb-6 line-clamp-3" style={{ color: '#78716c' }}>
                  {competition.short_description}
                </p>
              )}

              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase mb-1" style={{ color: '#78716c' }}>From</p>
                <div className="text-3xl font-bold" style={{ color: '#496B71' }}>
                  £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                </div>
                <p className="text-xs mt-1" style={{ color: '#78716c' }}>per ticket</p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-2" style={{ color: '#666666' }}>
                  <span>{percentSold.toFixed(0)}% Sold</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e7e5e4' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${getProgressPercentage()}%`,
                      background: 'linear-gradient(to right, #FED0B9, #fa8c61)'
                    }}
                  />
                </div>
                <div className="text-xs font-semibold mt-2 text-center" style={{ color: '#666666' }}>
                  {competition.tickets_sold || 0}/{competition.max_tickets}
                </div>
              </div>

              {/* Ticket Selector - Same as mobile but without sm: responsive classes */}
              <div className="mb-6">
                <div className="rounded-lg p-4" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#f0e0ca' }}>
                  {/* Entry Mode Toggle */}
                  <div className="flex items-stretch gap-0 mb-6">
                    <button
                      onClick={() => setEntryMode('paid')}
                      className="flex-1 py-3 font-bold text-sm transition-all cursor-pointer"
                      style={{
                        backgroundColor: entryMode === 'paid' ? '#496B71' : 'transparent',
                        color: entryMode === 'paid' ? 'white' : '#78716c',
                        borderWidth: '2px',
                        borderColor: entryMode === 'paid' ? '#496B71' : '#e7e5e4',
                        borderTopLeftRadius: '0.5rem',
                        borderBottomLeftRadius: '0.5rem',
                        borderRight: 'none'
                      }}
                    >
                      Paid Entry
                    </button>
                    <button
                      onClick={() => setEntryMode('postal')}
                      className="flex-1 py-3 font-bold text-sm transition-all cursor-pointer"
                      style={{
                        backgroundColor: entryMode === 'postal' ? '#496B71' : 'transparent',
                        color: entryMode === 'postal' ? 'white' : '#78716c',
                        borderWidth: '2px',
                        borderColor: entryMode === 'postal' ? '#496B71' : '#e7e5e4',
                        borderTopRightRadius: '0.5rem',
                        borderBottomRightRadius: '0.5rem',
                        borderLeft: 'none'
                      }}
                    >
                      Free Postal Entry
                    </button>
                  </div>

                  {/* Paid Entry Section */}
                  {entryMode === 'paid' && (
                    <>
                      {/* Quick Select Buttons */}
                      {tieredPricing.length > 0 && quickSelectOptions.length > 0 && (
                        <>
                          <h3 className="font-bold text-sm mb-3">Choose Your Tickets</h3>
                          <div className="grid grid-cols-4 gap-2 mb-4">
                            {quickSelectOptions.map((option) => {
                              const optionPrice = calculatePrice(option)
                              const basePrice = (option * (competition.base_ticket_price_pence / 100))
                              const savings = basePrice - optionPrice
                              return (
                                <button
                                  key={option}
                                  onClick={() => setQuantity(option)}
                                  className="relative pt-3 p-2 rounded-lg transition-all cursor-pointer"
                                  style={{
                                    borderWidth: '1px',
                                    borderColor: quantity === option ? '#496B71' : '#f0e0ca',
                                    backgroundColor: quantity === option ? '#e1eaec' : 'white'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (quantity !== option) {
                                      e.currentTarget.style.borderColor = '#e7e5e4'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (quantity !== option) {
                                      e.currentTarget.style.borderColor = '#f0e0ca'
                                    }
                                  }}
                                >
                                  {savings > 0 && (
                                    <div
                                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                                      style={{
                                        backgroundColor: 'white',
                                        borderWidth: '1px',
                                        borderColor: '#22c55e',
                                        color: '#22c55e'
                                      }}
                                    >
                                      Save £{savings.toFixed(2)}
                                    </div>
                                  )}
                                  <div className="font-bold text-base">{option}</div>
                                  <div className="text-xs" style={{ color: '#78716c' }}>
                                    £{optionPrice.toFixed(2)}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </>
                      )}

                      {/* Custom Amount */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-xs" style={{ color: '#78716c' }}>Custom Amount</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustQuantity(-1)}
                              disabled={quantity <= 1}
                              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              style={{ backgroundColor: '#FBEFDF' }}
                              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f0e0ca')}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FBEFDF'}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <div className="rounded px-3 py-1 font-bold text-lg min-w-[50px] text-center" style={{ backgroundColor: '#fff0e6', borderWidth: '1px', borderColor: '#f0e0ca' }}>
                              {quantity}
                            </div>
                            <button
                              onClick={() => adjustQuantity(1)}
                              disabled={quantity >= maxPurchase}
                              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              style={{ backgroundColor: '#FBEFDF' }}
                              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f0e0ca')}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FBEFDF'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="range"
                          min="1"
                          max={maxPurchase}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                          style={{ backgroundColor: '#e7e5e4', accentColor: '#496B71' }}
                        />
                        <div className="flex justify-between text-xs mt-1.5" style={{ color: '#a8a29e' }}>
                          <span>1</span>
                          <span>{maxPurchase}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="my-4" style={{ borderTopWidth: '1px', borderColor: '#f0e0ca' }}></div>

                      {/* Total and CTA */}
                      <div>
                        <div className="flex justify-between items-center pb-4 mb-4">
                          <div>
                            <span className="font-medium block text-xs" style={{ color: '#78716c' }}>Total Price</span>
                            {pricingDetails.savings > 0 && (
                              <span className="text-xs font-bold" style={{ color: '#22c55e' }}>
                                You save £{pricingDetails.savings.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="block text-2xl font-bold" style={{ color: '#496B71' }}>£{pricingDetails.total.toFixed(2)}</span>
                            {quantity > 1 && (
                              <span className="text-xs font-medium" style={{ color: '#78716c' }}>
                                £{pricingDetails.perTicket.toFixed(2)} per ticket
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleAddToCart}
                          className="w-full font-bold py-4 text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          style={{
                            backgroundColor: '#496B71',
                            color: 'white',
                            transition: 'background-color 200ms ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fa8c61'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
                          disabled={competition.status === 'scheduled'}
                        >
                          {competition.status === 'scheduled' ? 'Coming Soon' : 'Add to Basket'}
                        </button>
                        <p className="text-xs text-center mt-3" style={{ color: '#78716c' }}>
                          By entering, you agree to our Terms & Conditions
                        </p>
                      </div>
                    </>
                  )}

                  {/* Postal Entry Section */}
                  {entryMode === 'postal' && (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {/* Free Postal Entry Box */}
                      <div
                        className="rounded-lg p-4 text-center"
                        style={{
                          backgroundColor: '#e1eaec',
                          borderWidth: '2px',
                          borderColor: '#496B71'
                        }}
                      >
                        <p className="text-xs font-bold uppercase mb-2" style={{ color: '#78716c' }}>
                          FREE POSTAL ENTRY
                        </p>
                        <p className="text-4xl font-bold mb-2" style={{ color: '#496B71' }}>
                          {calculatePostalEntries()} {calculatePostalEntries() === 1 ? 'Entry' : 'Entries'}
                        </p>
                        <p className="text-xs" style={{ color: '#78716c' }}>
                          Based on ticket price of £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                        </p>
                      </div>

                      {/* Competition-level line */}
                      <div className="text-sm text-center" style={{ color: '#151e20' }}>
                        <p>
                          <strong>Postal entries to this competition receive {calculatePostalEntries()} {calculatePostalEntries() === 1 ? 'ticket' : 'tickets'}.</strong>
                        </p>
                      </div>

                      {/* Postal Entry Terms */}
                      <div className="space-y-3 text-xs" style={{ color: '#78716c' }}>
                        <div>
                          <h3 className="font-bold mb-2" style={{ color: '#151e20' }}>Postal Entry Route</h3>
                          <p>
                            You may enter a BabyBets competition for free using our Postal Entry Route by complying with the conditions below.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>1. Where to send your entry</h4>
                          <p className="mb-2">
                            Send your entry on an unenclosed postcard by First or Second Class post to:
                          </p>
                          <div className="pl-4 mb-2" style={{ color: '#151e20' }}>
                            <p className="font-medium">BabyBets</p>
                            <p>Unit B2, Beacon House</p>
                            <p>Cumberland Business Centre</p>
                            <p>Portsmouth, Hampshire</p>
                            <p>PO5 1DS</p>
                          </div>
                          <p className="italic">Hand delivered entries will not be accepted.</p>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>2. What to include on the postcard</h4>
                          <p className="mb-2">Your postcard must clearly include:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Your full name</li>
                            <li>Your full postal address</li>
                            <li>A contact telephone number</li>
                            <li>The email address linked to your BabyBets account</li>
                            <li>The name of the competition you want to enter</li>
                            <li>The answer to the competition question (where a question applies)</li>
                          </ul>
                          <p className="mt-2 italic">Incomplete or illegible entries will be disqualified.</p>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>3. Account requirement</h4>
                          <p className="mb-2">
                            Entrants must have created a BabyBets account for a free postal entry to be processed.
                          </p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>The details on the postcard must match the details on the account.</li>
                            <li>Postal entries received without a matching registered account cannot be processed.</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>4. One postcard per entry request (no bundles)</h4>
                          <p className="mb-2">Each postcard counts as one postal entry request.</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>You may make multiple free entries for any competition (up to any entry limit stated on the competition page).</li>
                            <li>Each free entry must be sent on a separate postcard and posted separately.</li>
                            <li>Bulk entries in one envelope will not be accepted as multiple entries. If bulk entries are received, they will be counted as one single entry request.</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>5. Entry limits still apply</h4>
                          <p className="mb-2">
                            If a competition has a maximum entry limit per person, that limit applies to postal entries too.
                          </p>
                          <p>If you send entries above the stated limit, we will only process entries up to the limit.</p>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>6. Closing dates, sell-outs and late entries</h4>
                          <p className="mb-2">
                            Your postcard must be received before the competition closing date and time shown on the competition page.
                          </p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Entries received after the closing date will not be entered into the competition.</li>
                            <li>If the competition sells out before your valid postal entry is received, your entry will not be entered.</li>
                            <li>Postal entries received after a competition has closed or sold out are void and will not be credited or transferred.</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>7. No confirmation of entry</h4>
                          <p className="mb-2">
                            We do not acknowledge receipt of postal entries and we do not confirm whether your entry has been successfully processed.
                          </p>
                          <p>
                            If your postal entry is valid and received before the closing date, it will be entered into the relevant competition automatically. You will only be contacted if you win.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold mb-1" style={{ color: '#151e20' }}>8. General</h4>
                          <p className="mb-2">
                            By entering using the Postal Entry Route, you confirm that you are eligible to enter and that you accept our Terms and Conditions.
                          </p>
                          <p>
                            For full details, please refer to our{' '}
                            <Link to="/legal/website-terms" className="font-bold underline cursor-pointer" style={{ color: '#496B71' }}>
                              Website Terms of Use
                            </Link>,{' '}
                            <Link to="/legal/terms" className="font-bold underline cursor-pointer" style={{ color: '#496B71' }}>
                              Terms and Conditions
                            </Link>{' '}and{' '}
                            <Link to="/legal/privacy" className="font-bold underline cursor-pointer" style={{ color: '#496B71' }}>
                              Privacy Policy
                            </Link>.
                          </p>
                        </div>

                        <div
                          className="mt-4 p-3 rounded-lg"
                          style={{ backgroundColor: '#fff0e6', borderWidth: '1px', borderColor: '#ffdec9' }}
                        >
                          <p className="font-bold mb-1" style={{ color: '#151e20' }}>Postal service disclaimer</p>
                          <p>
                            We are not responsible for postal entries that are lost, delayed, damaged, or misdirected in the post. Proof of posting is not proof of receipt. Only postal entries received by us before the competition closing date and time will be valid.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Button */}
              <div className="mt-auto flex justify-center">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm transition-colors cursor-pointer"
                  style={{ color: '#78716c' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#151e20'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#78716c'}
                >
                  <Share2 className="size-4" />
                  Share this competition
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Prize & Competition Details */}
        <div className="mt-8 max-w-5xl mx-auto px-4 sm:px-6">
          {/* Tab Navigation */}
          <div className="flex border-b mb-6" style={{ borderColor: '#e7e5e4' }}>
            {(competition.competition_type === 'instant_win' || competition.competition_type === 'instant_win_with_end_prize') && (
              <button
                onClick={() => setActiveTab('prize')}
                className="px-6 py-3 font-bold transition-all cursor-pointer"
                style={{
                  borderBottomWidth: '2px',
                  borderColor: activeTab === 'prize' ? '#496B71' : 'transparent',
                  color: activeTab === 'prize' ? '#496B71' : '#78716c'
                }}
              >
                Prize
              </button>
            )}
            <button
              onClick={() => setActiveTab('details')}
              className="px-6 py-3 font-bold transition-all cursor-pointer"
              style={{
                borderBottomWidth: '2px',
                borderColor: activeTab === 'details' ? '#496B71' : 'transparent',
                color: activeTab === 'details' ? '#496B71' : '#78716c'
              }}
            >
              Competition Details
            </button>
          </div>

          {/* Tab Content */}
          <div className="mb-12">
            {/* Prize Tab Content */}
            {activeTab === 'prize' && (
              <div className="space-y-3">
                {(competition.competition_type === 'instant_win' || competition.competition_type === 'instant_win_with_end_prize') && instantWinPrizes.length > 0 ? (
                  instantWinPrizes.map((prize) => {
                    const wonTickets = prize.winning_tickets?.filter(t => t.is_sold) || []
                    const allWon = prize.remaining_quantity === 0
                    const isExpanded = expandedPrizeId === prize.id
                    const currentPrizeTab = prizeTabs[prize.id] || 'tickets'

                    return (
                      <div
                        key={prize.id}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: 'white',
                          borderWidth: '1px',
                          borderColor: '#f0e0ca'
                        }}
                      >
                        {/* Collapsed Header - always visible */}
                        <button
                          onClick={() => setExpandedPrizeId(isExpanded ? null : prize.id)}
                          className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer text-left"
                          style={{ backgroundColor: allWon ? '#f9f9f9' : 'white' }}
                        >
                          {prize.prize_template.image_url && (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: '#FBEFDF' }}>
                              <img
                                src={prize.prize_template.image_url}
                                alt={prize.prize_template.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="grow min-w-0">
                            <p className="font-bold text-sm sm:text-base mb-1 truncate" style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}>
                              {prize.prize_template.name}
                            </p>
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase"
                              style={{
                                backgroundColor: allWon ? '#e7e5e4' : '#496B71',
                                color: allWon ? '#78716c' : 'white'
                              }}
                            >
                              {allWon ? 'Already Won' : wonTickets.length > 0 ? `${prize.remaining_quantity} of ${prize.total_quantity} Left` : 'To Be Won'}
                            </span>
                          </div>
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: allWon ? '#e7e5e4' : '#496B71',
                              transition: 'background-color 200ms ease'
                            }}
                          >
                            <ChevronDown
                              size={20}
                              className="transition-transform duration-200"
                              style={{
                                color: allWon ? '#78716c' : 'white',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}
                            />
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div>
                            {/* Tabs */}
                            <div className="flex" style={{ borderTopWidth: '1px', borderBottomWidth: '1px', borderColor: '#f0e0ca' }}>
                              <button
                                onClick={() => setPrizeTabs(prev => ({ ...prev, [prize.id]: 'tickets' }))}
                                className="flex-1 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: currentPrizeTab === 'tickets' ? 'white' : '#FBEFDF',
                                  color: currentPrizeTab === 'tickets' ? '#496B71' : '#78716c',
                                  borderBottomWidth: currentPrizeTab === 'tickets' ? '2px' : '0',
                                  borderColor: '#496B71'
                                }}
                              >
                                Tickets
                              </button>
                              <button
                                onClick={() => setPrizeTabs(prev => ({ ...prev, [prize.id]: 'description' }))}
                                className="flex-1 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: currentPrizeTab === 'description' ? 'white' : '#FBEFDF',
                                  color: currentPrizeTab === 'description' ? '#496B71' : '#78716c',
                                  borderBottomWidth: currentPrizeTab === 'description' ? '2px' : '0',
                                  borderColor: '#496B71'
                                }}
                              >
                                Description
                              </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4 sm:p-5">
                              {currentPrizeTab === 'tickets' && (
                                <div>
                                  {prize.winning_tickets && prize.winning_tickets.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                      {prize.winning_tickets.map((ticket) => (
                                        <div key={ticket.ticket_id} className="flex flex-col items-center gap-1">
                                          <span className="text-lg sm:text-xl font-bold" style={{ color: '#151e20' }}>
                                            {ticket.ticket_number}
                                          </span>
                                          <span
                                            className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap"
                                            style={{
                                              backgroundColor: ticket.is_sold ? '#22c55e' : '#496B71',
                                              color: 'white'
                                            }}
                                          >
                                            {ticket.is_sold ? 'Won' : 'Win Now'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm" style={{ color: '#78716c' }}>
                                      Ticket codes will appear here once the pool is generated.
                                    </p>
                                  )}
                                </div>
                              )}
                              {currentPrizeTab === 'description' && (
                                <div>
                                  {prize.prize_template.description ? (
                                    <p className="text-sm leading-relaxed" style={{ color: '#78716c' }}>
                                      {prize.prize_template.description}
                                    </p>
                                  ) : (
                                    <p className="text-sm" style={{ color: '#78716c' }}>
                                      No description available for this prize.
                                    </p>
                                  )}
                                  <div className="mt-3 text-sm" style={{ color: '#78716c' }}>
                                    <p>{prize.remaining_quantity} of {prize.total_quantity} remaining</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8" style={{ color: '#78716c' }}>
                    <p>Prize information will be displayed here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Competition Details Tab Content */}
            {activeTab === 'details' && (
              <div className="prose max-w-none">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#151e20' }}>About This Competition</h3>
                    {competition.description ? (
                      <RichTextDisplay content={competition.description} />
                    ) : (
                      <p style={{ color: '#78716c' }}>
                        Enter for a chance to win this amazing prize!
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#151e20' }}>Prize Value</h3>
                    <p style={{ color: '#78716c' }}>
                      Worth £{competition.total_value_gbp.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#151e20' }}>Total Tickets</h3>
                    <p style={{ color: '#78716c' }}>
                      {competition.max_tickets.toLocaleString()} tickets available
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#151e20' }}>Competition Closes</h3>
                    <p style={{ color: '#78716c' }}>
                      {formatDate(competition.end_datetime)} or when all tickets are sold
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How it Works Section */}
        <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}>
              How it works
            </h2>
            {(competition.competition_type === 'instant_win' || competition.competition_type === 'instant_win_with_end_prize') ? (
              <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#78716c' }}>
                Instantly find out if you are a lucky winner!
              </p>
            ) : (
              <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#78716c' }}>
                Enter our draw for a chance to win this amazing prize
              </p>
            )}
          </div>

          {(competition.competition_type === 'instant_win' || competition.competition_type === 'instant_win_with_end_prize') ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
              {/* Connector Lines - Hidden on mobile */}
              <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5" style={{
                background: 'linear-gradient(to right, transparent 0%, #e7e5e4 20%, #e7e5e4 80%, transparent 100%)',
                zIndex: 0
              }} />

              {/* Step 1 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">1</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Buy your tickets
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      Choose how many tickets you want to enter
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">2</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Reveal if you've won
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      Scratch your tickets to see if you're a winner
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">3</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Claim your prize
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      We'll contact you to arrange delivery
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative">
              {/* Connector Lines - Hidden on mobile */}
              <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5" style={{
                background: 'linear-gradient(to right, transparent 0%, #e7e5e4 12.5%, #e7e5e4 87.5%, transparent 100%)',
                zIndex: 0
              }} />

              {/* Step 1 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">1</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Buy your tickets
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      Choose how many tickets you want to enter
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">2</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Wait for the draw
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      The draw takes place on the closing date
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">3</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Winner announced
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      One lucky winner is randomly selected
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group cursor-pointer">
                <div
                  className="rounded-2xl p-8 h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '2px',
                    borderColor: '#FBEFDF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = '#496B71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#FBEFDF'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white font-bold text-2xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #496B71 0%, #3a565a 100%)',
                        boxShadow: '0 10px 20px -5px rgba(73, 107, 113, 0.4)'
                      }}
                    >
                      <span className="relative z-10">4</span>
                      <div
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#151e20' }}>
                      Claim your prize
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#78716c' }}>
                      Winner can claim prize or cash alternative
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Competition Closes Section */}
        <div className="mt-12 px-4 sm:px-6 max-w-5xl mx-auto">
          <div
            className="rounded-2xl py-12 sm:py-16 px-6 sm:px-8 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #496B71 0%, #3a565a 60%, #2c4044 100%)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{
                background: 'radial-gradient(circle, #FED0B9 0%, transparent 70%)',
                transform: 'translate(30%, -30%)'
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
              style={{
                background: 'radial-gradient(circle, #fa8c61 0%, transparent 70%)',
                transform: 'translate(-30%, 30%)'
              }}
            />
            <div className="relative z-10">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#FED0B9' }}>
                Don't miss out
              </p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: 'white', fontFamily: "'Fraunces', serif" }}>
                {formatDateTime(competition.end_datetime)}
              </p>
              <p className="text-sm sm:text-base" style={{ color: '#e1eaec' }}>
                Competition closes on this date or when all tickets are sold
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {showStickyBar && entryMode === 'paid' && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 shadow-lg transition-transform duration-300"
          style={{
            backgroundColor: 'white',
            borderTopWidth: '2px',
            borderColor: '#496B71'
          }}
        >
          <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#78716c' }}>
                From
              </p>
              <p className="text-xl font-bold" style={{ color: '#496B71' }}>
                £{(competition.base_ticket_price_pence / 100).toFixed(2)}
              </p>
              <p className="text-xs" style={{ color: '#78716c' }}>
                per ticket
              </p>
            </div>
            <button
              onClick={scrollToTicketSelector}
              className="flex-1 max-w-xs font-bold py-3 px-6 text-sm rounded-lg cursor-pointer"
              style={{
                backgroundColor: '#496B71',
                color: 'white',
                transition: 'background-color 200ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fa8c61'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
            >
              Enter Now
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default CompetitionEntry
