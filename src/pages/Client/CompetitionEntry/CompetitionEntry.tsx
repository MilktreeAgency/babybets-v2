import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { Trophy, Plus, Minus, Share2, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

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
  const [currentImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'prize' | 'details'>('details')

  useEffect(() => {
    if (slug) {
      loadCompetition()
    }
  }, [slug])

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

  // Keyboard navigation for image modal
  useEffect(() => {
    if (!isImageModalOpen || !competition) return

    const images = (competition.images as string[]) || []
    const allImages = images.length > 0 ? images : [competition.image_url]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false)
      } else if (e.key === 'ArrowLeft') {
        setModalImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight') {
        setModalImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isImageModalOpen, competition])

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
          .eq('competition_id', data.id)
          .order('tier', { ascending: true })

        if (!prizesError && prizes) {
          // Fetch winning tickets for each prize
          const { data: winningTickets } = await supabase
            .from('ticket_allocations')
            .select('id, ticket_number, prize_id')
            .eq('competition_id', data.id)
            .not('prize_id', 'is', null)
            .eq('is_sold', true)

          const mappedPrizes = prizes.map((p: Record<string, unknown>) => {
            const wonTickets = winningTickets?.filter(
              (ticket) => ticket.prize_id === p.id
            ).map((ticket) => ({
              ticket_number: ticket.ticket_number,
              ticket_id: ticket.id
            })) || []

            return {
              id: p.id,
              competition_id: p.competition_id,
              prize_code: p.prize_code,
              total_quantity: p.total_quantity,
              remaining_quantity: p.remaining_quantity,
              tier: p.tier,
              prize_template: p.prize_templates,
              winning_tickets: wonTickets
            }
          }) as InstantWinPrize[]

          setInstantWinPrizes(mappedPrizes)
        }
      }
    } catch (error) {
      console.error('Error loading competition:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
      <Header />

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Image and Description */}
            <div className="space-y-4">
              {/* Main Competition Image */}
              <div
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: '#FBEFDF',
                  borderWidth: '1px',
                  borderColor: '#f0e0ca'
                }}
                onClick={() => {
                  setModalImageIndex(currentImageIndex)
                  setIsImageModalOpen(true)
                }}
              >
                <img
                  src={allImages[currentImageIndex]}
                  alt={competition.title}
                  className="w-full h-full object-cover"
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
                  {allImages.slice(1).map((image, index) => (
                    <button
                      key={index + 1}
                      onClick={() => {
                        setModalImageIndex(index + 1)
                        setIsImageModalOpen(true)
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all"
                      style={{
                        backgroundColor: '#FBEFDF',
                        borderWidth: '1px',
                        borderColor: '#f0e0ca'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e7e5e4'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#f0e0ca'}
                    >
                      <img
                        src={image}
                        alt={`${competition.title} - Image ${index + 2}`}
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
              <h1 className="text-2xl md:text-3xl font-bold mb-6 leading-tight text-center">
                {competition.title}
              </h1>

              {/* Price - Centered */}
              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase mb-1" style={{ color: '#78716c' }}>From</p>
                <div className="text-3xl font-bold" style={{ color: '#496B71' }}>
                  £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                </div>
                <p className="text-xs mt-1" style={{ color: '#78716c' }}>per ticket</p>
              </div>

              {/* Progress - Simple */}
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

              {/* Ticket Selector */}
              <div className="mb-6">
                <div className="rounded-lg p-4" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#f0e0ca' }}>
                  <h3 className="font-bold text-sm mb-3">Choose Your Tickets</h3>

                  {/* Quick Select Buttons */}
                  {quickSelectOptions.length > 0 && (
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
                          <Minus className="size-3" />
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
                          <Plus className="size-3" />
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
                      className="w-full font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      style={{
                        backgroundColor: '#496B71',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a565a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
                      disabled={competition.status === 'scheduled'}
                    >
                      {competition.status === 'scheduled' ? 'Coming Soon' : 'Add to Basket'}
                    </button>
                    <p className="text-xs text-center mt-3" style={{ color: '#78716c' }}>
                      By entering, you agree to our Terms & Conditions
                    </p>
                  </div>
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
        </div>

        {/* Competition Closes Section */}
        <div className="mt-8 px-4 sm:px-6">
          <div className="rounded-lg py-16 px-4 text-center" style={{ backgroundColor: '#f5f6f7' }}>
            <p className="text-2xl font-semibold mb-1" style={{ color: '#151e20' }}>
              Competition Closes {formatDateTime(competition.end_datetime)}
            </p>
            <p className="text-xl" style={{ color: '#78716c' }}>
              or when all tickets are sold
            </p>
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

        {/* Tabs Section */}
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
              <div className="space-y-4">
                {/* Instant Win Prizes */}
                {(competition.competition_type === 'instant_win' || competition.competition_type === 'instant_win_with_end_prize') && instantWinPrizes.length > 0 ? (
                  <div className="space-y-3">
                    {instantWinPrizes.map((prize) => {
                      const isWon = prize.winning_tickets && prize.winning_tickets.length > 0
                      const wonCount = prize.total_quantity - prize.remaining_quantity

                      return (
                        <div
                          key={prize.id}
                          className="flex items-center gap-4 p-4 rounded-xl transition-all"
                          style={{
                            backgroundColor: isWon ? '#dcfce7' : 'white',
                            borderWidth: '1px',
                            borderColor: isWon ? '#86efac' : '#e7e5e4'
                          }}
                        >
                          {prize.prize_template.image_url && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: '#FBEFDF' }}>
                              <img
                                src={prize.prize_template.image_url}
                                alt={prize.prize_template.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="grow">
                            <p className="font-bold mb-1" style={{ color: '#151e20' }}>
                              {prize.prize_template.name}
                            </p>
                            <p className="text-sm" style={{ color: '#78716c' }}>
                              Quantity: {prize.remaining_quantity}/{prize.total_quantity}
                            </p>
                            {isWon && prize.winning_tickets && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {prize.winning_tickets.map((ticket) => (
                                  <span
                                    key={ticket.ticket_id}
                                    className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                    style={{ backgroundColor: '#22c55e', color: 'white' }}
                                  >
                                    #{ticket.ticket_number}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {isWon ? (
                              <>
                                <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap" style={{ backgroundColor: '#22c55e', color: 'white' }}>
                                  Won ({wonCount})
                                </span>
                                {prize.remaining_quantity > 0 && (
                                  <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap" style={{ backgroundColor: '#496B71', color: 'white' }}>
                                    {prize.remaining_quantity} Left
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap" style={{ backgroundColor: '#496B71', color: 'white' }}>
                                To Be Won
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                    <p style={{ color: '#78716c' }}>
                      {competition.description || 'Enter for a chance to win this amazing prize!'}
                    </p>
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
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 cursor-pointer"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer z-50"
            aria-label="Close modal"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModalImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
              }}
              className="absolute left-4 text-white hover:text-gray-300 cursor-pointer z-50"
              aria-label="Previous image"
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allImages[modalImageIndex]}
              alt={`${competition.title} - Image ${modalImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
              {modalImageIndex + 1} / {allImages.length}
            </div>
          </div>

          {/* Next Button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModalImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
              }}
              className="absolute right-4 text-white hover:text-gray-300 cursor-pointer z-50"
              aria-label="Next image"
            >
              <ChevronRight size={48} />
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default CompetitionEntry
