import { useState, useEffect } from 'react'
import { Trophy, MapPin, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import PageSection from '@/components/common/PageSection'

interface Winner {
  id: string
  display_name: string
  location: string | null
  prize_name: string
  prize_value_gbp: number | null
  prize_image_url: string | null
  winner_photo_url: string | null
  testimonial: string | null
  won_at: string
  featured: boolean
}

export default function Winners() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWinners()
  }, [])

  const fetchWinners = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('winners')
        .select('id, display_name, location, prize_name, prize_value_gbp, prize_image_url, winner_photo_url, testimonial, won_at, featured')
        .eq('is_public', true)
        .order('won_at', { ascending: false })

      if (error) throw error
      setWinners((data || []) as Winner[])
    } catch (error) {
      console.error('Error fetching winners:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <PageSection
        title="Winners Gallery"
        description="Celebrating our lucky winners and their amazing prizes"
      />

      <div className="py-12">
        <div className="max-w-[1300px] mx-auto ">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block size-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#e7e5e4', borderTopColor: '#496B71' }}></div>
                <p style={{ color: '#78716c' }}>Loading winners...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && winners.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)' }}>
                  <Trophy size={48} style={{ color: '#496B71', opacity: 0.5 }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                  No winners yet
                </h3>
                <p style={{ color: '#78716c' }}>Check back soon to see our lucky winners!</p>
              </div>
            </div>
          )}

          {/* Winners Grid */}
          {!loading && winners.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className="rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1"
                  style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden" style={{ backgroundColor: '#FBEFDF' }}>
                    {winner.winner_photo_url ? (
                      <img
                        src={winner.winner_photo_url}
                        alt={winner.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : winner.prize_image_url ? (
                      <img
                        src={winner.prize_image_url}
                        alt={winner.prize_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy size={64} style={{ color: '#496B71', opacity: 0.3 }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                          {winner.display_name}
                        </h3>
                        {winner.location && (
                          <div className="flex items-center gap-1 text-sm" style={{ color: '#78716c' }}>
                            <MapPin size={14} />
                            {winner.location}
                          </div>
                        )}
                      </div>
                      <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: 'rgba(254, 208, 185, 0.2)' }}>
                        <Trophy size={20} style={{ color: '#496B71' }} />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1" style={{ color: '#78716c' }}>Won</div>
                      <div className="font-bold" style={{ color: '#151e20' }}>{winner.prize_name}</div>
                      {winner.prize_value_gbp && winner.prize_value_gbp > 0 && (
                        <div className="text-lg font-bold mt-1" style={{ color: '#496B71' }}>
                          £{winner.prize_value_gbp.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {winner.testimonial && (
                      <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#FBEFDF' }}>
                        <p className="text-sm italic line-clamp-3" style={{ color: '#78716c' }}>
                          "{winner.testimonial}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs" style={{ color: '#a8a29e' }}>
                      <Calendar size={12} />
                      {new Date(winner.won_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
