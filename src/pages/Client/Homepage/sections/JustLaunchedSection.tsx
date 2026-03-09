import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import CompetitionCard from '@/components/CompetitionCard'

export default function JustLaunchedSection() {
  const { competitions, isLoading } = useCompetitions({
    featured: true,
    limit: 4
  })

  if (isLoading || competitions.length <= 1) {
    return null
  }

  return (
    <section className="py-14 sm:py-16 md:py-20 lg:py-24" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 sm:mb-10 md:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(254, 208, 185, 0.4)', color: '#151e20' }}
              >
                <Star size={16} fill="currentColor" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#496B71' }}>
                New In
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Just Launched
            </h2>
          </div>

          <Link
            to="/competitions"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold transition-colors cursor-pointer shrink-0 mb-1"
            style={{ color: '#496B71' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#2c4044'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#496B71'}
          >
            View All
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {competitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={{
                ...competition,
                images: (competition.images as string[]) || []
              }}
            />
          ))}
        </div>

        {/* Mobile — view all button */}
        <div className="mt-8 sm:mt-10 text-center sm:hidden">
          <Link
            to="/competitions"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer"
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
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  )
}
