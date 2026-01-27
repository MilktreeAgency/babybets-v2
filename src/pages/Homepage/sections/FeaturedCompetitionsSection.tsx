import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import CompetitionCard from '@/components/CompetitionCard'

export default function FeaturedCompetitionsSection() {
  const { competitions, isLoading } = useCompetitions({ showOnHomepage: true, limit: 4 })

  return (
    <section className="py-16 px-6" id="competitions">
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#666666' }}>
            Explore Trendy Kids'
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
            Best Selling Competitions
          </h2>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl"
                style={{
                  background: '#ffffff'
                }}
              >
                <div className="animate-pulse">
                  <div className="bg-gray-200 w-full" style={{ aspectRatio: '1/1' }} />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 w-3/4 mx-auto" />
                    <div className="h-10 bg-gray-200 w-full" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-gray-200 w-full" />
                      <div className="h-3 bg-gray-200 w-16 mx-auto" />
                    </div>
                    <div className="h-10 bg-gray-200 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: '#666666' }}>No competitions available at the moment. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Competitions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {competitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-12">
              <Link
                to="/competitions"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:opacity-90"
                style={{ backgroundColor: '#335761', color: '#ffffff' }}
              >
                <span>View All Competitions</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
