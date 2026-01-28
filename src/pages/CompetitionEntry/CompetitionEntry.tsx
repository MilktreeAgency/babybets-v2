import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/common/Header'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { Trophy, Clock, Plus, Minus, Share2, ArrowLeft, Gift, Sparkles } from 'lucide-react'
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
}

function CompetitionEntry() {
  const { slug } = useParams()
  const { addItem, setCartOpen } = useCartStore()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(10)
  const [tieredPricing, setTieredPricing] = useState<TieredPrice[]>([])
  const [instantWinPrizes, setInstantWinPrizes] = useState<InstantWinPrize[]>([])

  useEffect(() => {
    if (slug) {
      loadCompetition()
    }
  }, [slug])

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
          const mappedPrizes = prizes.map((p: Record<string, unknown>) => ({
            id: p.id,
            competition_id: p.competition_id,
            prize_code: p.prize_code,
            total_quantity: p.total_quantity,
            remaining_quantity: p.remaining_quantity,
            tier: p.tier,
            prize_template: p.prize_templates
          })) as InstantWinPrize[]

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

    let totalPence = 0
    const sortedTiers = [...tieredPricing].sort((a, b) => a.minQty - b.minQty)

    for (let i = 0; i < qty; i++) {
      const currentQty = i + 1
      // Find the tier that applies to this ticket
      const applicableTier = [...sortedTiers]
        .reverse()
        .find(tier => currentQty >= tier.minQty && currentQty <= tier.maxQty)

      totalPence += applicableTier
        ? applicableTier.pricePerTicketPence
        : competition.base_ticket_price_pence
    }

    return totalPence / 100
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
    const images = (competition.images as string[]) || []
    const displayImage = images.length > 0 ? images[0] : competition.image_url

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
            <div className="inline-block size-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
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

  const ticketsRemaining = competition.max_tickets - (competition.tickets_sold || 0)

  // Use first image from images array, or fallback to image_url
  const images = (competition.images as string[]) || []
  const displayImage = images.length > 0 ? images[0] : competition.image_url

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
      <Header />

      {/* Main Content */}
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Competitions
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Image and Description */}
            <div className="space-y-8">
              {/* Competition Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                <img
                  src={displayImage}
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
                {competition.is_featured && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                    Featured
                  </div>
                )}
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-3">Prize Description</h2>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {competition.description}
                </div>

                {/* Prize Value */}
                <div className="mt-6 p-4 bg-linear-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total Prize Value</span>
                    <span className="text-2xl font-bold" style={{ color: '#f25100' }}>
                      £{competition.total_value_gbp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Competition Type Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="size-5 text-orange-500" />
                  How It Works
                </h2>
                <div className="space-y-3">
                  {(competition.competition_type === 'instant_win' ||
                    competition.competition_type === 'instant_win_with_end_prize') && (
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Gift className="size-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Instant Win Prizes</p>
                        <p className="text-xs text-gray-600">
                          Scratch your tickets immediately after purchase to reveal instant prizes!
                        </p>
                      </div>
                    </div>
                  )}
                  {(competition.competition_type === 'standard' ||
                    competition.competition_type === 'instant_win_with_end_prize') && (
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Trophy className="size-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Main Prize Draw</p>
                        <p className="text-xs text-gray-600">
                          {competition.draw_datetime
                            ? `Draw on ${formatDate(competition.draw_datetime)}`
                            : `Draw on ${formatDate(competition.end_datetime)}`}
                        </p>
                        {competition.end_prize && (competition.end_prize as Record<string, unknown>).name ? (
                          <p className="text-xs text-gray-700 font-medium mt-1">
                            Win: {(competition.end_prize as Record<string, unknown>).name as string}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instant Win Prizes Section */}
              {instantWinPrizes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Gift className="size-5 text-orange-500" />
                    Instant Win Prizes
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Scratch your tickets to win these amazing prizes instantly!
                  </p>
                  <div className="space-y-3">
                    {instantWinPrizes.map((prize) => {
                      const claimed = prize.total_quantity - prize.remaining_quantity
                      const percentClaimed = (claimed / prize.total_quantity) * 100

                      return (
                        <div
                          key={prize.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-orange-200 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Prize Image */}
                            {prize.prize_template.image_url ? (
                              <img
                                src={prize.prize_template.image_url}
                                alt={prize.prize_template.name}
                                className="size-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="size-16 rounded-lg bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                                <Gift className="size-8 text-orange-600" />
                              </div>
                            )}

                            {/* Prize Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-bold text-sm">{prize.prize_template.name}</h3>
                                  {prize.prize_template.short_name && (
                                    <p className="text-xs text-gray-500">{prize.prize_template.short_name}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-bold text-green-600">
                                    £{prize.prize_template.value_gbp.toFixed(2)}
                                  </div>
                                  {prize.prize_template.cash_alternative_gbp && (
                                    <div className="text-xs text-gray-500">
                                      or £{prize.prize_template.cash_alternative_gbp.toFixed(2)} cash
                                    </div>
                                  )}
                                </div>
                              </div>

                              {prize.prize_template.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {prize.prize_template.description}
                                </p>
                              )}

                              {/* Prize Availability */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">
                                    {prize.remaining_quantity} of {prize.total_quantity} remaining
                                  </span>
                                  <span className="font-semibold text-gray-700">
                                    {claimed}/{prize.total_quantity} claimed
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-linear-to-r from-orange-400 to-orange-600 transition-all duration-300"
                                    style={{ width: `${percentClaimed}%` }}
                                  />
                                </div>
                              </div>

                              {/* Prize Type Badge */}
                              <div className="mt-2">
                                <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                  {prize.prize_template.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Total Prize Pool */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Total Instant Win Prizes
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {instantWinPrizes.reduce((sum, p) => sum + p.total_quantity, 0)} prizes
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">Total Value</span>
                      <span className="text-sm font-bold text-green-600">
                        £{instantWinPrizes.reduce((sum, p) => sum + (p.prize_template.value_gbp * p.total_quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Entry Form */}
            <div>
              {/* Category Badge */}
              <div className="mb-2">
                <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {competition.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Win {competition.title}
              </h1>

              {/* Price and Value */}
              <div className="flex items-center gap-6 mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">From</p>
                  <div className="text-3xl font-bold" style={{ color: '#f25100' }}>
                    £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">per ticket</p>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Draw Date</p>
                  <div className="text-base font-bold flex items-center gap-2">
                    <Clock className="size-4" />
                    <span className="text-sm">{formatDate(competition.end_datetime)}</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-8">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span>Tickets Sold</span>
                  <span>
                    {(competition.tickets_sold || 0).toLocaleString()} / {competition.max_tickets.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-orange-400 to-orange-600 transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  {ticketsRemaining.toLocaleString()} tickets remaining
                </p>
              </div>

              {/* Ticket Selector */}
              <div className="mb-8">
                <h3 className="font-bold text-base mb-4">Choose Your Tickets</h3>

                {/* Quick Select Buttons */}
                {quickSelectOptions.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {quickSelectOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setQuantity(option)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          quantity === option
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-orange-200'
                        }`}
                      >
                        <div className="font-bold text-lg">{option}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          £{calculatePrice(option).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Amount */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-sm">Custom Amount</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustQuantity(-1)}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="size-4" />
                      </button>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-xl min-w-[60px] text-center">
                        {quantity}
                      </div>
                      <button
                        onClick={() => adjustQuantity(1)}
                        disabled={quantity >= maxPurchase}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max={maxPurchase}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mt-2">
                    <span>1</span>
                    <span>{maxPurchase}</span>
                  </div>
                </div>
              </div>

              {/* Total and CTA */}
              <div className="bg-linear-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center border-b border-orange-400 pb-4 mb-4">
                  <div>
                    <span className="text-orange-100 font-medium block text-sm">Total Price</span>
                    {pricingDetails.savings > 0 && (
                      <span className="text-green-300 text-xs font-bold">
                        You save £{pricingDetails.savings.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block text-3xl font-bold">£{pricingDetails.total.toFixed(2)}</span>
                    {quantity > 1 && (
                      <span className="text-xs text-orange-200 font-medium">
                        £{pricingDetails.perTicket.toFixed(2)} per ticket
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-white text-orange-600 font-bold py-4 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={competition.status === 'scheduled'}
                >
                  {competition.status === 'scheduled' ? 'Coming Soon' : 'Enter Competition'}
                </button>
                <p className="text-xs text-orange-100 text-center mt-3">
                  By entering, you agree to our Terms & Conditions
                </p>
              </div>

              {/* Share Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Share2 className="size-4" />
                  Share this competition
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompetitionEntry
