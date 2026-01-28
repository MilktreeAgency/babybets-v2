import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'

interface CompetitionCardProps {
  competition: {
    id: string
    slug: string
    title: string
    image_url: string
    images?: string[]
    total_value_gbp: number
    base_ticket_price_pence: number
    max_tickets: number
    tickets_sold: number | null
    end_datetime: string
    competition_type: string
  }
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Ended'
    if (diffDays === 0) return 'Ends today'
    if (diffDays === 1) return 'Ends tomorrow'
    if (diffDays < 7) return `${diffDays} days left`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const getTicketsRemaining = (ticketsSold: number | null, maxTickets: number) => {
    const sold = ticketsSold || 0
    return maxTickets - sold
  }

  const ticketsRemaining = getTicketsRemaining(competition.tickets_sold, competition.max_tickets)
  const percentageSold = ((competition.tickets_sold || 0) / competition.max_tickets) * 100

  // Use first image from images array, or fallback to image_url
  const displayImage = competition.images && competition.images.length > 0
    ? competition.images[0]
    : competition.image_url

  return (
    <Link
      to={`/competitions/${competition.slug}`}
      className="block"
    >
      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: '#ffffff'
        }}
      >
        {/* Image Container */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
          <img
            src={displayImage}
            alt={competition.title}
            className="w-full h-full object-cover"
          />

          {/* Time Chip - Top Right */}
          <div className="absolute top-3 right-3">
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md"
              style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            >
              <Clock size={12} className="text-white" />
              <span className="text-xs text-white font-semibold">{formatEndDate(competition.end_datetime)}</span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          {/* Title - Centered */}
          <h3 className="font-bold text-base text-center line-clamp-2" style={{ color: '#1a1a1a' }}>
            {competition.title}
          </h3>

          {/* Entry Price - Centered */}
          <div className="text-center py-2">
            <div className="text-xs font-semibold mb-0.5" style={{ color: '#666' }}>
              ENTRY FROM
            </div>
            <div className="text-2xl font-bold" style={{ color: '#335761' }}>
              £{(competition.base_ticket_price_pence / 100).toFixed(2)}
            </div>
          </div>

          {/* Tickets Progress - Below Entry Price */}
          <div className="space-y-1.5">
            <div className="w-full h-1.5 overflow-hidden" style={{ background: '#e5e7eb' }}>
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${percentageSold}%`,
                  background: '#335761'
                }}
              />
            </div>
            <div className="text-center">
              <span className="text-xs font-semibold" style={{ color: '#335761' }}>
                {percentageSold.toFixed(0)}% Sold
              </span>
            </div>
          </div>

          {/* CTA Button - Full Width */}
          <button
            className="w-full py-3 text-sm font-bold uppercase transition-all duration-300"
            style={{
              background: '#335761',
              color: '#ffffff'
            }}
          >
            Enter Now
          </button>
        </div>
      </div>
    </Link>
  )
}
