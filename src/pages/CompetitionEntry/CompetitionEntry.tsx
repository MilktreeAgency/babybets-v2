import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/common/Header'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { Trophy, Clock, Ticket, Plus, Minus, Share2, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

type Competition = Database['public']['Tables']['competitions']['Row']

interface TieredPrice {
  minQty: number
  maxQty: number
  pricePerTicketPence: number
}

function CompetitionEntry() {
  const { slug } = useParams()
  const { addItem, setCartOpen } = useCartStore()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(10)
  const [tieredPricing, setTieredPricing] = useState<TieredPrice[]>([])

  useEffect(() => {
    if (slug) {
      loadCompetition()
    }
  }, [slug])

  const loadCompetition = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error

      setCompetition(data)

      // Load tiered pricing if available
      if (data.tiered_pricing && Array.isArray(data.tiered_pricing)) {
        setTieredPricing(data.tiered_pricing as TieredPrice[])
      }
    } catch (error) {
      console.error('Error loading competition:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = (qty: number) => {
    if (!competition) return 0

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
    const perTicket = total / quantity
    const baseTotal = (quantity * competition.base_ticket_price_pence) / 100
    const savings = Math.max(0, baseTotal - total)

    return { total, perTicket, savings }
  }, [quantity, competition, tieredPricing])

  const getProgressPercentage = () => {
    if (!competition || competition.max_tickets === 0) return 0
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
    return Math.min(
      competition.max_tickets - competition.tickets_sold,
      competition.max_tickets_per_user
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

    addItem({
      competitionId: competition.id,
      competitionTitle: competition.title,
      competitionSlug: competition.slug,
      imageUrl: competition.image_url,
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

  const ticketsRemaining = competition.max_tickets - competition.tickets_sold

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
                  src={competition.image_url}
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
                    {competition.tickets_sold.toLocaleString()} / {competition.max_tickets.toLocaleString()}
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
