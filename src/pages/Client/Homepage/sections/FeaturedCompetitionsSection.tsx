import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import CompetitionCard from '@/components/CompetitionCard'

export default function FeaturedCompetitionsSection() {
  const { competitions, isLoading } = useCompetitions({ showOnHomepage: true, limit: 8 })

  // Hide section if loading or no competitions
  if (isLoading || competitions.length === 0) {
    return null
  }

  return (
    <section className="py-10 sm:py-12 md:py-14" id="competitions" style={{ backgroundColor: '#fffbf7' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg shadow-sm" style={{ backgroundColor: '#facc15', color: '#713f12' }}>
              <Zap size={18} className="sm:hidden" fill="currentColor" />
              <Zap size={20} className="hidden sm:block" fill="currentColor" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Featured Competitions
            </h2>
          </div>
          <Link
            to="/competitions"
            className="text-sm font-bold uppercase transition-colors cursor-pointer hidden sm:block"
            style={{ color: '#496B71' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#2c4044'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#496B71'}
          >
            View All
          </Link>
        </div>

        {/* Horizontal scrollable slider with snap */}
        <div className="relative -mx-4 px-4">
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {competitions.map((competition) => (
              <div key={competition.id} className="shrink-0 w-[260px] sm:w-[300px] md:w-[320px] snap-start">
                <CompetitionCard
                  competition={{
                    ...competition,
                    images: (competition.images as string[]) || []
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile view all link */}
        <div className="mt-5 sm:mt-6 text-center sm:hidden">
          <Link
            to="/competitions"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: 'transparent',
              color: '#496B71',
              borderWidth: '2px',
              borderColor: '#496B71'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#496B71'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#496B71'
            }}
          >
            View All Competitions
          </Link>
        </div>
      </div>
    </section>
  )
}
