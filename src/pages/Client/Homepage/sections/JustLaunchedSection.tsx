import { Star } from 'lucide-react'
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
    <section className="py-12 sm:py-14 md:py-16 lg:py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div
              className="p-1.5 sm:p-2 rounded-full"
              style={{ backgroundColor: '#496B71', color: 'white' }}
            >
              <Star size={18} className="sm:hidden" fill="currentColor" />
              <Star size={20} className="hidden sm:block" fill="currentColor" />
            </div>
            <h2
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Just Launched
            </h2>
          </div>
        </div>

        {/* Competition Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
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
