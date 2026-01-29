import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

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
  const percentSold = (((competition.tickets_sold || 0) / competition.max_tickets) * 100)
  const isEndingSoon = percentSold > 85

  // Use first image from images array, or fallback to image_url
  const displayImage = competition.images && competition.images.length > 0
    ? competition.images[0]
    : competition.image_url

  return (
    <Link to={`/competitions/${competition.slug}`} className="group h-full block cursor-pointer">
      <article
        className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative"
        style={{ backgroundColor: '#151e20', borderWidth: '1px', borderColor: '#e7e5e4' }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
          <img
            src={displayImage}
            alt={`Win ${competition.title}`}
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
            Win {competition.title}
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
            </div>

            {/* Value Check */}
            <div
              className="pt-3 flex items-center justify-between text-xs"
              style={{ borderTopWidth: '1px', borderColor: '#3a565a', color: '#e1eaec' }}
            >
              <span>Worth £{competition.total_value_gbp.toLocaleString()}</span>
              <span className="font-bold" style={{ color: '#facc15' }}>Tax Free</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
