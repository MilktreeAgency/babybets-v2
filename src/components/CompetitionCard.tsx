import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    created_at?: string | null
  }
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const percentSold = (((competition.tickets_sold || 0) / competition.max_tickets) * 100)
  const isEndingSoon = percentSold > 85
  const isInstantWin = competition.competition_type === 'instant_win'

  // Check if competition is closing today
  const closingInfo = (() => {
    if (!competition.end_datetime) return null
    const endDate = new Date(competition.end_datetime)
    const now = new Date()

    const endDay = endDate.toDateString()
    const nowDay = now.toDateString()

    if (endDay === nowDay) {
      const time12hr = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      })
      return `Closing Today ${time12hr} GMT`
    }
    return null
  })()

  // Check if competition is just launched (7 days or less)
  const isJustLaunched = (() => {
    if (!competition.created_at) return false
    const createdDate = new Date(competition.created_at)
    const now = new Date()
    const daysDifference = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDifference <= 7
  })()

  // Fetch prize count for instant win competitions
  const [prizeCount, setPrizeCount] = useState(0)
  const [prizeLoading, setPrizeLoading] = useState(true)

  useEffect(() => {
    if (isInstantWin) {
      const fetchPrizeCount = async () => {
        try {
          setPrizeLoading(true)
          const { data, error } = await supabase
            .from('competition_instant_win_prizes')
            .select('total_quantity')
            .eq('competition_id', competition.id)

          if (error) throw error

          const total = data?.reduce((sum, prize) => sum + prize.total_quantity, 0) || 0
          setPrizeCount(total)
        } catch (error) {
          console.error('Error fetching prize count:', error)
          setPrizeCount(0)
        } finally {
          setPrizeLoading(false)
        }
      }

      fetchPrizeCount()
    }
  }, [isInstantWin, competition.id])

  // Use first image from images array, or fallback to image_url
  const displayImage = competition.images && competition.images.length > 0
    ? competition.images[0]
    : competition.image_url

  // Check if all tickets are sold
  const isAllTicketsSold = percentSold >= 100

  return (
    <Link to={`/competitions/${competition.slug}`} className="group h-full block cursor-pointer relative pt-3">
      {/* Badge - Priority: Closing Today > All Tickets Sold > Instant Win Prize Count > Just Launched */}
      {(closingInfo || isAllTicketsSold || (isInstantWin && !prizeLoading && prizeCount > 0) || (!isInstantWin && isJustLaunched)) && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full cursor-pointer z-20 flex items-center gap-2"
          style={{
            backgroundColor: closingInfo || isAllTicketsSold ? '#ef4444' : 'white',
            borderWidth: '1px',
            borderColor: closingInfo || isAllTicketsSold ? '#ef4444' : '#d1d5db',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Zap size={16} style={{ color: closingInfo || isAllTicketsSold ? 'white' : '#ef4444' }} fill={closingInfo || isAllTicketsSold ? 'white' : '#ef4444'} />
          <div
            className="text-sm font-bold whitespace-nowrap"
            style={{ color: closingInfo || isAllTicketsSold ? 'white' : '#151e20' }}
          >
            {closingInfo || (isAllTicketsSold ? 'All Tickets Sold' : (isInstantWin ? `${prizeCount}+ prizes` : 'Just Launched'))}
          </div>
        </div>
      )}

      <article
        className="rounded-2xl overflow-hidden shadow-sm h-full flex flex-col relative"
        style={{ backgroundColor: '#151e20', borderWidth: '1px', borderColor: '#e7e5e4' }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
          <img
            src={displayImage}
            alt={competition.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay Price */}
          <div
            className="absolute bottom-3 left-3 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold text-lg shadow-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: '#151e20',
              borderWidth: '1px',
              borderColor: '#FBEFDF'
            }}
          >
            £{(competition.base_ticket_price_pence / 100).toFixed(2)}
          </div>
          <div className="absolute bottom-3 right-3">
            <div
              className="rounded-full p-2 shadow-lg transition-colors"
              style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcb08e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FED0B9'}
            >
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <h3
            className="font-bold font-serif mb-2 line-clamp-2 leading-tight min-h-[2.5rem] text-sm md:text-base"
            style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
          >
            {competition.title}
          </h3>

          <div className="mt-auto space-y-3">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#e1eaec' }}>
                <span>{percentSold.toFixed(0)}% Sold</span>
              </div>
              <div
                className="w-full rounded-full h-2 overflow-hidden"
                style={{ backgroundColor: '#2c4044' }}
                role="progressbar"
                aria-valuenow={percentSold}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${percentSold.toFixed(0)}% of tickets sold`}
              >
                <div
                  style={{
                    width: `${percentSold}%`,
                    backgroundColor: isEndingSoon ? '#fa8c61' : '#facc15'
                  }}
                  className="h-full rounded-full"
                />
              </div>
              <div className="text-[10px] font-bold mt-1.5 text-center" style={{ color: '#9ca3af' }}>
                {competition.tickets_sold || 0}/{competition.max_tickets}
              </div>
            </div>

            {/* Value Check */}
            <div
              className="pt-3 flex items-center justify-between text-xs"
              style={{ borderTopWidth: '1px', borderColor: '#3a565a', color: '#e1eaec' }}
            >
              <span>Worth £{competition.total_value_gbp.toLocaleString()}</span>
              <span className="font-bold" style={{ color: '#facc15' }}>Tax Free</span>
            </div>

            {/* Enter Now Button */}
            <button
              className="w-full py-3 rounded-xl font-bold text-base transition-colors cursor-pointer"
              style={{
                backgroundColor: isAllTicketsSold ? '#9ca3af' : '#496B71',
                color: 'white',
                cursor: isAllTicketsSold ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => !isAllTicketsSold && (e.currentTarget.style.backgroundColor = '#3a565a')}
              onMouseLeave={(e) => !isAllTicketsSold && (e.currentTarget.style.backgroundColor = '#496B71')}
              disabled={isAllTicketsSold}
            >
              {isAllTicketsSold ? 'Closed' : 'Enter Now'}
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
