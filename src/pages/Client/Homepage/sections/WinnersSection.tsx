import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, ArrowRight, Star, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

export default function WinnersSection() {
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
        .eq('featured', true)
        .order('won_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setWinners((data || []) as Winner[])
    } catch (error) {
      console.error('Error fetching winners:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (winners.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: '#fffbf7' }}>
      <div className="max-w-[1300px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'rgba(254, 208, 185, 0.2)' }}>
            <Trophy size={20} style={{ color: '#496B71' }} />
            <span className="text-sm font-bold" style={{ color: '#496B71' }}>RECENT WINNERS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
            Meet Our Winners
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#78716c' }}>
            Real people winning amazing prizes every day
          </p>
        </div>

        {/* Winners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {winners.map((winner) => (
            <div
              key={winner.id}
              className="rounded-2xl overflow-hidden border transition-all duration-300"
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
                {winner.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#151e20' }}>
                    <Star size={12} fill="currentColor" style={{ color: '#fbbf24' }} />
                    Featured
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
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
                  <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(254, 208, 185, 0.2)' }}>
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

                <div className="text-xs" style={{ color: '#a8a29e' }}>
                  Won {new Date(winner.won_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/winners" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 cursor-pointer" style={{ backgroundColor: '#496B71', color: 'white' }}>
            View All Winners
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
