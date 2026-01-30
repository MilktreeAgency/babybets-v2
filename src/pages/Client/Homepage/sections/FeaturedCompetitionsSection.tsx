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
    <section className="py-12" id="competitions" style={{ backgroundColor: '#fffbf7' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shadow-sm" style={{ backgroundColor: '#facc15', color: '#713f12' }}>
              <Zap size={20} fill="currentColor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
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
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {competitions.map((competition) => (
              <div key={competition.id} className="shrink-0 w-[280px] sm:w-[320px] snap-start">
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
        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/competitions"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 cursor-pointer"
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
