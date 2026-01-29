import { Link } from 'react-router-dom'
import { ArrowRight, Star, Zap } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import TrustStatsSection from './TrustStatsSection'

export default function HeroSection() {
  // Fetch featured competition for hero
  const { competitions: heroCompetitions, isLoading: heroLoading } = useCompetitions({
    showOnHomepage: true,
    limit: 1
  })

  // Fetch instant win count
  const { competitions: instantWinComps, isLoading: instantWinLoading } = useCompetitions({
    competitionType: 'instant_win'
  })

  const heroCompetition = heroCompetitions[0]
  const instantWinCount = instantWinComps.length

  // Get the display image
  const heroImage = heroCompetition?.images && Array.isArray(heroCompetition.images) && heroCompetition.images.length > 0
    ? (heroCompetition.images[0] as string)
    : heroCompetition?.image_url || '/images/competitions/PRIZE 1 ICANDY PEACH 7.png'

  return (
    <section className="relative overflow-hidden border-b" style={{
      background: 'linear-gradient(to bottom right, #fffbf7, #FBEFDF, rgba(254, 208, 185, 0.3))',
      borderColor: '#f0e0ca'
    }}>
      {/* Enhanced decorative circles */}
      <div
        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(254, 208, 185, 0.4)' }}
      />
      <div
        className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[700px] h-[700px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(225, 234, 236, 0.4)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl -z-10"
        style={{ backgroundColor: 'rgba(255, 240, 230, 0.2)' }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-28 lg:py-32">
        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-20 items-center">
          {/* Left Column - Text content */}
          <div className="w-full lg:w-[55%] text-left z-10 space-y-6 lg:space-y-8">
            {/* Badge */}
            <div>
              <span
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                style={{
                  backgroundColor: '#fff0e6',
                  color: '#151e20',
                  borderWidth: '1px',
                  borderColor: '#ffdec9'
                }}
              >
                ⚡ Instant Win Competitions Live
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05] mb-0"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Win Premium Baby Gear{' '}
              <span className="relative inline-block" style={{ color: '#496B71' }}>
                Instantly
                <span
                  className="absolute bottom-3 left-0 w-full h-4 rounded-full -z-10"
                  style={{ backgroundColor: 'rgba(254, 208, 185, 0.4)' }}
                />
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl pt-3"
              style={{ color: '#78716c' }}
            >
              Enter our instant win competitions for a chance to win iCandy prams, car seats, and cash prizes. Over{' '}
              <span className="font-bold" style={{ color: '#2c4044' }}>
                1,900 instant wins
              </span>{' '}
              available now.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/competitions" className="flex-shrink-0">
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-10 py-6 text-lg font-bold transition-all duration-300 shadow-2xl hover:shadow-xl cursor-pointer"
                  style={{
                    backgroundColor: '#496B71',
                    color: 'white',
                    boxShadow: '0 20px 50px -12px rgba(73, 107, 113, 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a565a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
                >
                  View Competitions
                  <ArrowRight size={20} className="ml-2" />
                </button>
              </Link>
              <Link to="/how-it-works" className="flex-shrink-0">
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-10 py-6 text-lg font-bold transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#2c4044',
                    borderWidth: '2px',
                    borderColor: '#2c4044'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2c4044'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#2c4044'
                  }}
                >
                  How It Works
                </button>
              </Link>
            </div>

            {/* Social Proof - Reviews */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 20}`}
                    className="w-12 h-12 rounded-full shadow-md"
                    style={{ borderWidth: '3px', borderColor: 'white' }}
                    alt={`BabyBets winner ${i}`}
                    loading="lazy"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-1" style={{ color: '#fa8c61' }}>
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                </div>
                <span className="text-sm font-bold" style={{ color: '#78716c' }}>
                  4.9/5 from 200+ reviews
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="w-full lg:w-[45%] relative">
            <div
              className="relative rounded-[2.5rem] overflow-hidden shadow-2xl"
              style={{
                borderWidth: '8px',
                borderColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(34, 48, 51, 0.2)'
              }}
            >
              {heroLoading ? (
                <div className="w-full h-auto aspect-[4/5] animate-pulse" style={{ backgroundColor: '#FBEFDF' }} />
              ) : (
                <img
                  src={heroImage}
                  alt={heroCompetition ? `Win ${heroCompetition.title}` : 'Win premium baby gear with BabyBets instant win competitions'}
                  loading="eager"
                  className="w-full h-auto object-cover aspect-[4/5]"
                  style={{ backgroundColor: '#FBEFDF' }}
                />
              )}

              {/* Floating Winner Badge */}
              {!instantWinLoading && instantWinCount > 0 && (
                <div
                  className="absolute top-6 right-6 p-5 rounded-2xl shadow-xl max-w-[220px]"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderWidth: '1px',
                    borderColor: '#FBEFDF',
                    animation: 'bounce 4s infinite'
                  }}
                >
                  <div className="flex gap-3 items-center mb-2">
                    <div
                      className="p-2.5 rounded-full"
                      style={{ backgroundColor: '#fef3c7', color: '#ca8a04' }}
                    >
                      <Zap size={20} />
                    </div>
                    <div
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: '#a8a29e' }}
                    >
                      Instant Win
                    </div>
                  </div>
                  <div
                    className="text-base font-bold leading-tight"
                    style={{ color: '#151e20' }}
                  >
                    {instantWinCount.toLocaleString()}+ prizes to be won instantly!
                  </div>
                </div>
              )}

              {/* Bottom CTA Overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 pt-32 text-white"
                style={{
                  background: 'linear-gradient(to top, rgba(34, 48, 51, 0.95), rgba(34, 48, 51, 0.8), transparent)'
                }}
              >
                <div className="flex justify-between items-end gap-4">
                  <div className="flex-grow">
                    <div
                      className="text-xs font-bold uppercase mb-2 tracking-wider"
                      style={{ color: '#FED0B9' }}
                    >
                      Live Now
                    </div>
                    <div className="text-xl sm:text-2xl font-bold leading-tight">
                      {heroLoading ? 'Loading...' : heroCompetition ? `${heroCompetition.title} - £${heroCompetition.total_value_gbp.toLocaleString()}` : 'Amazing Prizes Available'}
                    </div>
                  </div>
                  <Link to={heroCompetition ? `/competitions/${heroCompetition.slug}` : '/competitions'} className="flex-shrink-0">
                    <div
                      className="rounded-full p-3 sm:p-4 shadow-lg cursor-pointer transition-all duration-300"
                      style={{ backgroundColor: 'white', color: '#151e20' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FED0B9'
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <ArrowRight size={22} strokeWidth={2.5} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Stats Card */}
            {!instantWinLoading && instantWinCount > 0 && (
              <div
                className="absolute -bottom-8 -left-8 p-6 rounded-2xl shadow-2xl hidden lg:block"
                style={{
                  backgroundColor: 'white',
                  borderWidth: '1px',
                  borderColor: '#f0e0ca',
                  animation: 'float 5s ease-in-out infinite'
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: '#facc15', color: '#713f12' }}
                  >
                    <Zap size={28} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold" style={{ color: '#151e20' }}>
                      {instantWinCount.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#78716c' }}>
                      Instant Wins
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust Stats Section */}
      <TrustStatsSection />
    </section>
  )
}
