import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Gift, Shield, Users, Heart, ArrowRight, ChevronDown } from 'lucide-react'
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
  const expandRef = useRef<HTMLDivElement>(null)

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

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="pt-28 sm:pt-32 md:pt-36 pb-14 sm:pb-16 md:pb-20 relative overflow-hidden"
        style={{ backgroundColor: '#fffbf7' }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-0"
          style={{ backgroundColor: 'rgba(254, 208, 185, 0.25)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none -z-0"
          style={{ backgroundColor: 'rgba(73, 107, 113, 0.07)' }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Centered headline */}
          <div className="text-center mb-10 sm:mb-14">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(254, 208, 185, 0.5)', color: '#151e20' }}
            >
              <Users size={13} />
              <span className="text-xs font-bold uppercase tracking-widest">Meet the Founders</span>
            </div>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Nick x Shelley
            </h1>
          </div>

          {/* Photo + quote side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Photo */}
            <div className="relative">
              <div
                className="relative rounded-3xl overflow-hidden w-full"
                style={{ aspectRatio: '4/5', boxShadow: '0 32px 64px -12px rgba(73,107,113,0.25)', border: '4px solid white' }}
              >
                <img
                  src="/ShelleyxNick-hero-image.jpg"
                  alt="Nick & Shelley - BabyBets Founders"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.8)' }}
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#496B71' }}>BabyBets Founders</p>
                    <p className="text-sm font-bold" style={{ color: '#151e20' }}>Nick & Shelley</p>
                  </div>
                  <a
                    href="https://www.instagram.com/the_houghtons_/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#496B71', color: 'white' }}
                  >
                    <Instagram size={12} />
                    Follow
                  </a>
                </div>
              </div>
            </div>

            {/* Quote + story */}
            <div className="space-y-6 sm:space-y-8">
              {/* Pull-quote */}
              <div
                className="border-l-4 pl-5 sm:pl-6 py-1"
                style={{ borderColor: '#FED0B9' }}
              >
                <p className="text-lg sm:text-xl md:text-2xl italic leading-relaxed" style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}>
                  "I don't need a supercar… why can't I win a pram?"
                </p>
                <p className="text-xs sm:text-sm mt-2 font-semibold" style={{ color: '#78716c' }}>— The lightbulb moment</p>
              </div>

              {/* Story */}
              <div className="text-sm sm:text-[15px] md:text-base leading-relaxed space-y-4" style={{ color: '#4a4a4a' }}>
                <p>Hi, we're Nick and Shelley. We're expecting our little boy in February.</p>
                <p>
                  One evening, Shelley was searching for a pram and stumbled across a competition site where you could win supercars for a few pounds. She looked at Nick and said, 'I don't need a supercar… why can't I win a pram?'
                </p>
                <p>That was the lightbulb moment.</p>
              </div>

              {/* Mobile expandable */}
              <div
                ref={expandRef}
                className="overflow-hidden transition-all duration-500 ease-in-out md:hidden"
                style={{
                  maxHeight: showFullStory ? `${expandRef.current?.scrollHeight ?? 600}px` : '0px',
                  opacity: showFullStory ? 1 : 0,
                }}
              >
                <div className="text-sm sm:text-[15px] leading-relaxed space-y-4" style={{ color: '#4a4a4a' }}>
                  <p>We searched everywhere and couldn't find a prize site built for parents, with prizes families actually want and need. And let's be honest, having a baby is expensive.</p>
                  <p>So we thought, what if parents could win the pram they actually want, a car seat, nursery essentials, or even a family holiday, for less than the price of a coffee?</p>
                  <p>That's why we built BabyBets.</p>
                  <p>We're here to run brilliant competitions, support good causes, work with parent creators, and build a community that feels positive and worth being part of.</p>
                </div>
              </div>

              {/* Desktop — always visible */}
              <div className="hidden md:block text-sm sm:text-[15px] md:text-base leading-relaxed space-y-4" style={{ color: '#4a4a4a' }}>
                <p>We searched everywhere and couldn't find a prize site built for parents, with prizes families actually want and need. And let's be honest, having a baby is expensive.</p>
                <p>So we thought, what if parents could win the pram they actually want, a car seat, nursery essentials, or even a family holiday, for less than the price of a coffee?</p>
                <p>That's why we built BabyBets.</p>
                <p>We're here to run brilliant competitions, support good causes, work with parent creators, and build a community that feels positive and worth being part of.</p>
              </div>

              {/* Mobile read more */}
              <button
                onClick={() => setShowFullStory(!showFullStory)}
                className="md:hidden flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer"
                style={{ color: '#496B71' }}
              >
                {showFullStory ? 'Read less' : 'Read the full story'}
                <ChevronDown
                  size={15}
                  className="transition-transform duration-300"
                  style={{ transform: showFullStory ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Instagram CTA */}
              <a
                href="https://www.instagram.com/the_houghtons_/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: '#496B71', color: 'white', boxShadow: '0 8px 24px rgba(73,107,113,0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a565a'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#496B71'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                Follow us on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MORE THAN PRIZES — teal background ───────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20" style={{ backgroundColor: '#496B71' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: 'rgba(254,208,185,0.25)', color: '#FED0B9' }}
          >
            <Heart size={13} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-widest">Our Purpose</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5"
            style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
          >
            More than just prizes
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            BabyBets is more than a prize and competition site.{' '}
            We're building a positive community for parents, with support, advice and feel-good content alongside our weekly giveaways.
          </p>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed mt-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
            And as we grow, we'll be giving back too, raising money for children's charities, mum and baby charities, and causes that matter to families.
          </p>
        </div>
      </section>

      {/* ── TOP PICKS — warm cream ────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20 lg:py-24" style={{ backgroundColor: '#fffbf7' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-10 sm:mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'rgba(254, 208, 185, 0.4)', color: '#151e20' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest">This week</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Nick x Shelley's Top Picks
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>
              Our favorite competitions this week
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block size-10 border-4 rounded-full animate-spin"
                style={{ borderColor: '#e7e5e4', borderTopColor: '#496B71' }} />
            </div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}>
              <p className="text-base sm:text-lg" style={{ color: '#78716c' }}>
                No active competitions at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {competitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={{ ...competition, images: (competition.images as string[]) || [] }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── OUR MISSION — pink background ────────────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20" style={{ backgroundColor: '#FED0B9' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-10 sm:mb-12">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Our Mission
            </h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: 'rgba(21,30,32,0.65)' }}>
              Built for modern families, with premium prizes, transparent draws, and a positive community.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {[
              { icon: Gift, label: 'Premium Prizes', desc: 'Prams, car seats, nursery essentials, toys, and cash prizes.' },
              { icon: Shield, label: 'Transparent & Fair', desc: 'Amazing odds, guaranteed winners, always fair and transparent.' },
              { icon: Users, label: 'Parent Community', desc: 'A positive place for mums, dads, and families to join in and share the fun.' },
              { icon: Heart, label: 'Giving Back', desc: "Supporting children's and family charities as BabyBets grows.", filled: true },
            ].map(({ icon: Icon, label, desc, filled }) => (
              <div
                key={label}
                className="rounded-2xl p-5 sm:p-6 md:p-8 text-center transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#496B71', color: 'white' }}
                >
                  <Icon size={20} strokeWidth={1.8} fill={filled ? 'currentColor' : 'none'} />
                </div>
                <h3
                  className="text-sm sm:text-base font-bold mb-1.5"
                  style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                >
                  {label}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#4a4a4a' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── READY TO WIN — teal background ───────────────────────────────── */}
      <section className="py-16 sm:py-20 md:py-24 text-center relative overflow-hidden" style={{ backgroundColor: '#496B71' }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.12)' }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.08)' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
          >
            Ready To Win?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Browse our live competitions and enter for your chance to win premium prizes for you and your little ones.
          </p>
          <Link to="/competitions">
            <button
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-xl transition-all duration-300 cursor-pointer group"
              style={{ backgroundColor: '#FED0B9', color: '#151e20', boxShadow: '0 8px 32px rgba(254,208,185,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc4a6'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Browse Competitions
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
