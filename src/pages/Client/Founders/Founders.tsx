import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Gift, Shield, Users, Heart, ArrowRight } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CompetitionCard from '@/components/CompetitionCard'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

export default function Founders() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showFullStory, setShowFullStory] = useState(false)

  useEffect(() => {
    loadCompetitions()
  }, [])

  const loadCompetitions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error
      setCompetitions(data || [])
    } catch (error) {
      console.error('Error loading competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#fffbf7', color: '#2D251E' }}>
      <Header />

      {/* Hero Section */}
      <section className="pt-12 sm:pt-14 md:pt-16 lg:pt-20 pb-10 sm:pb-11 md:pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden w-full aspect-[4/5] shadow-2xl" style={{ borderWidth: '4px', borderColor: 'white' }}>
                <img
                  src="/ShelleyxNick-hero-image.jpg"
                  alt="Nick & Shelley - BabyBets Founders"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mb-3 sm:mb-4 shadow-sm"
                style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
              >
                <Users size={14} className="sm:hidden" />
                <Users size={16} className="hidden sm:block" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">MEET THE FOUNDERS</span>
              </div>

              {/* Page Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Nick x Shelley
              </h1>

              {/* Our Story */}
              <div className="rounded-xl p-4 sm:p-6 mb-5 sm:mb-6" style={{ backgroundColor: '#FBEFDF', borderWidth: '1px', borderColor: '#f0e0ca' }}>
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                  Our Story
                </h2>
                <div className="text-sm sm:text-base leading-relaxed space-y-3 sm:space-y-4" style={{ color: '#151e20' }}>
                  <p>
                    Hi, we're Nick and Shelley. We're expecting our little boy in February.
                  </p>
                  <p>
                    One evening, Shelley was searching for a pram and stumbled across a competition site where you could win supercars for a few pounds. She looked at Nick and said, 'I don't need a supercar… why can't I win a pram?'
                  </p>
                  <p>
                    That was the lightbulb moment.
                  </p>

                  {/* Collapsible content for mobile */}
                  <div className={`${showFullStory ? 'block' : 'hidden'} md:block space-y-3 sm:space-y-4`}>
                    <p>
                      We searched everywhere and couldn't find a prize site built for parents, with prizes families actually want and need. And let's be honest, having a baby is expensive.
                    </p>
                    <p>
                      So we thought, what if parents could win the pram they actually want, a car seat, nursery essentials, or even a family holiday, for less than the price of a coffee?
                    </p>
                    <p>
                      That's why we built BabyBets.
                    </p>
                    <p>
                      We're here to run brilliant competitions, support good causes, work with parent creators, and build a community that feels positive and worth being part of.
                    </p>
                  </div>

                  {/* Read more toggle (mobile only) */}
                  <button
                    onClick={() => setShowFullStory(!showFullStory)}
                    className="md:hidden text-sm font-bold underline cursor-pointer"
                    style={{ color: '#496B71' }}
                  >
                    {showFullStory ? 'Read less' : 'Read more'}
                  </button>
                </div>
              </div>

              {/* Social Links */}
              <div className="mb-5 sm:mb-6">
                <a
                  href="https://www.instagram.com/the_houghtons_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                  style={{ backgroundColor: '#496B71', color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a565a'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#496B71'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Follow us on Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-10 sm:py-11 md:py-12 lg:py-14" style={{ backgroundColor: 'rgba(73, 107, 113, 0.05)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-center" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              More than just prizes
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: '#78716c' }}>
              BabyBets is more than a prize and competition site.
              <br className="hidden sm:block" />
              We're building a positive community for parents, with support, advice and feel-good content alongside our weekly giveaways.
              <br className="hidden sm:block" />
              <br className="hidden sm:block" />
              And as we grow, we'll be giving back too, raising money for children's charities, mum and baby charities, and causes that matter to families.
            </p>
          </div>
        </div>
      </section>

      {/* Top Picks Competitions Section */}
      <section className="py-10 sm:py-11 md:py-12 lg:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Nick x Shelley's Top Picks
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
              Our favorite competitions this week
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block size-10 sm:size-12 border-4 rounded-full animate-spin" style={{ borderColor: '#e7e5e4', borderTopColor: '#496B71' }}></div>
            </div>
          ) : competitions.length === 0 ? (
            <div
              className="text-center py-12 sm:py-14 md:py-16 rounded-2xl"
              style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}
            >
              <p className="text-base sm:text-lg" style={{ color: '#78716c' }}>
                No active competitions at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
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
          )}
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-10 sm:py-11 md:py-12 lg:py-14" style={{ backgroundColor: 'rgba(73, 107, 113, 0.05)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Our Mission
            </h2>
            <p className="text-sm sm:text-base max-w-3xl mx-auto" style={{ color: '#78716c' }}>
              Built for modern families, with premium prizes, transparent draws, and a positive community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {/* Tile 1 - Premium Prizes */}
            <div className="rounded-2xl p-6 sm:p-7 md:p-8 text-center transition-transform hover:scale-105" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}>
              <div className="mb-4 flex justify-center" style={{ color: '#496B71' }}>
                <Gift size={40} strokeWidth={1.5} className="sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Premium Prizes
              </h3>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
                Prams, car seats, nursery essentials, toys, and cash prizes.
              </p>
            </div>

            {/* Tile 2 - Transparent & Fair */}
            <div className="rounded-2xl p-6 sm:p-7 md:p-8 text-center transition-transform hover:scale-105" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}>
              <div className="mb-4 flex justify-center" style={{ color: '#496B71' }}>
                <Shield size={40} strokeWidth={1.5} className="sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Transparent & Fair
              </h3>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
                Amazing odds, guaranteed winners, always fair and transparent
              </p>
            </div>

            {/* Tile 3 - Parent Community */}
            <div className="rounded-2xl p-6 sm:p-7 md:p-8 text-center transition-transform hover:scale-105" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}>
              <div className="mb-4 flex justify-center" style={{ color: '#496B71' }}>
                <Users size={40} strokeWidth={1.5} className="sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Parent Community
              </h3>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
                A positive place for mums, dads, and families to join in and share the fun.
              </p>
            </div>

            {/* Tile 4 - Giving Back */}
            <div className="rounded-2xl p-6 sm:p-7 md:p-8 text-center transition-transform hover:scale-105" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}>
              <div className="mb-4 flex justify-center" style={{ color: '#496B71' }}>
                <Heart size={40} strokeWidth={1.5} className="sm:w-12 sm:h-12 opacity-20" fill="currentColor" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Giving Back
              </h3>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
                Supporting children's and family charities as BabyBets grows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ready To Win Section */}
      <section className="py-12 sm:py-14 md:py-16 lg:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
            Ready To Win?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 md:mb-10 leading-relaxed" style={{ color: '#78716c' }}>
            Browse our live competitions and enter for your chance to win premium prizes for you and your little ones.
          </p>
          <Link to="/competitions">
            <button
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
              style={{ backgroundColor: '#496B71', color: 'white' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3a565a'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#496B71'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>Browse Competitions</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
