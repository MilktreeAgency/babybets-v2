import { Link } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import CompetitionCard from '@/components/CompetitionCard'

export default function InstantWinsSection() {
  const { competitions, isLoading } = useCompetitions({
    competitionType: 'instant_win',
    limit: 4
  })

  if (isLoading || competitions.length === 0) {
    return null
  }

  return (
    <section className="py-12 sm:py-14 md:py-16 lg:py-20 relative overflow-hidden border-y" style={{
      background: 'linear-gradient(to bottom right, #FBEFDF, #fffbf7, rgba(157, 180, 184, 0.1))',
      borderColor: '#f0e0ca'
    }}>
      {/* Decorative blur circles */}
      <div
        className="absolute top-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: '#FED0B9' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: '#9DB4B8' }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mb-3 sm:mb-4 shadow-sm"
            style={{ backgroundColor: '#facc15', color: '#713f12' }}
          >
            <Zap size={14} className="sm:hidden" fill="currentColor" />
            <Zap size={16} className="hidden sm:block" fill="currentColor" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Flash Prizes</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight"
            style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
          >
            Instant Wins
          </h2>

          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-5 sm:mb-6 px-4" style={{ color: '#78716c' }}>
            Find a lucky ticket number and win these prizes instantly. No need to wait for the draw date!
          </p>

          <Link to="/competitions?type=instant_win">
            <button
              className="inline-flex items-center justify-center rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer"
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
              View All Instant Wins
              <ArrowRight size={16} className="sm:hidden ml-2" />
              <ArrowRight size={18} className="hidden sm:block ml-2" />
            </button>
          </Link>
        </div>

        {/* Competition Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {competitions.map((competition) => (
            <div key={competition.id}>
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
    </section>
  )
}
