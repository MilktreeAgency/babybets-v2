import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CompetitionCard from '@/components/CompetitionCard'
import { useCompetitions } from '@/hooks/useCompetitions'

export default function Competitions() {
  const { competitions, isLoading } = useCompetitions({})

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <section className="py-16 px-6">
        <div className="max-w-[1300px] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
              All Competitions
            </h1>
            <p className="text-lg" style={{ color: '#666666' }}>
              Browse all our amazing competitions and win incredible prizes
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
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
              <p className="text-lg" style={{ color: '#666666' }}>
                No competitions available at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {competitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={{
                  ...competition,
                  images: (competition.images as string[]) || []
                }} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
