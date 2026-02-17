import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { supabase } from '@/lib/supabase'
import TrustStatsSection from './TrustStatsSection'

export default function HeroSection() {
  // Fetch system settings for hero content
  const { heroContent } = useSystemSettings()

  // Fetch featured competitions for hero carousel
  const { competitions: heroCompetitions, isLoading: heroLoading } = useCompetitions({
    showOnHomepage: true,
    limit: 5
  })

  // Fetch total instant win prize count
  const [instantWinCount, setInstantWinCount] = useState(0)
  const [instantWinLoading, setInstantWinLoading] = useState(true)

  useEffect(() => {
    const fetchInstantWinPrizeCount = async () => {
      try {
        setInstantWinLoading(true)

        // Get all active instant win competitions
        const { data: activeComps, error: compError } = await supabase
          .from('competitions')
          .select('id')
          .eq('status', 'active')
          .eq('competition_type', 'instant_win')

        if (compError) throw compError

        const activeCompIds = new Set(activeComps?.map(c => c.id) || [])

        // Get all prizes for these competitions
        const { data: prizes, error: prizeError } = await supabase
          .from('competition_instant_win_prizes')
          .select('total_quantity, competition_id')

        if (prizeError) throw prizeError

        // Sum total_quantity for prizes in active instant win competitions
        const total = prizes
          ?.filter(prize => activeCompIds.has(prize.competition_id))
          .reduce((sum, prize) => sum + prize.total_quantity, 0) || 0

        setInstantWinCount(total)
      } catch (error) {
        console.error('Error fetching instant win prize count:', error)
        setInstantWinCount(0)
      } finally {
        setInstantWinLoading(false)
      }
    }

    fetchInstantWinPrizeCount()
  }, [])

  // Get hero text content from settings (with fallback defaults)
  const heroTitle = heroContent?.title || 'Win Premium Prizes For Parents & Little Ones'
  const heroDesc = heroContent?.description || 'Enter our instant win competitions for a chance to win iCandy prams, car seats, and cash prizes. Over 1,900 instant wins available now.'

  // Carousel state for competitions
  const [currentCompetitionIndex, setCurrentCompetitionIndex] = useState(0)

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50

  // Auto-rotate competition carousel
  useEffect(() => {
    if (!heroCompetitions || heroCompetitions.length <= 1) return

    const interval = setInterval(() => {
      setCurrentCompetitionIndex((prev) => (prev + 1) % heroCompetitions.length)
    }, 5000) // Change competition every 5 seconds

    return () => clearInterval(interval)
  }, [heroCompetitions?.length])

  // Get current competition being displayed
  const currentCompetition = heroCompetitions?.[currentCompetitionIndex]

  // Get primary image for current competition
  const currentCompetitionImage = currentCompetition?.images && Array.isArray(currentCompetition.images) && currentCompetition.images.length > 0
    ? currentCompetition.images[0]
    : currentCompetition?.image_url || '/images/competitions/PRIZE 1 ICANDY PEACH 7.png'

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!heroCompetitions || heroCompetitions.length <= 1) return
    setTouchEnd(0) // Reset touch end
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!heroCompetitions || heroCompetitions.length <= 1) return
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isTransitioning || !heroCompetitions || heroCompetitions.length <= 1) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      // Swipe left - go to next competition
      setIsTransitioning(true)
      setCurrentCompetitionIndex((prev) => (prev + 1) % heroCompetitions.length)
      setTimeout(() => setIsTransitioning(false), 500)
    } else if (isRightSwipe) {
      // Swipe right - go to previous competition
      setIsTransitioning(true)
      setCurrentCompetitionIndex((prev) => (prev - 1 + heroCompetitions.length) % heroCompetitions.length)
      setTimeout(() => setIsTransitioning(false), 500)
    }

    // Reset touch states
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!heroCompetitions || heroCompetitions.length <= 1) return
    e.preventDefault() // Prevent text/image selection
    setIsDragging(true)
    setTouchEnd(0)
    setTouchStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault() // Prevent default drag behavior
    setTouchEnd(e.clientX)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    setIsDragging(false)

    if (!touchStart || !touchEnd || isTransitioning || !heroCompetitions || heroCompetitions.length <= 1) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      // Drag left - go to next competition
      setIsTransitioning(true)
      setCurrentCompetitionIndex((prev) => (prev + 1) % heroCompetitions.length)
      setTimeout(() => setIsTransitioning(false), 500)
    } else if (isRightSwipe) {
      // Drag right - go to previous competition
      setIsTransitioning(true)
      setCurrentCompetitionIndex((prev) => (prev - 1 + heroCompetitions.length) % heroCompetitions.length)
      setTimeout(() => setIsTransitioning(false), 500)
    }

    // Reset states
    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setTouchStart(0)
      setTouchEnd(0)
    }
  }

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

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="flex flex-col-reverse lg:flex-row gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left Column - Text content */}
          <div className="w-full lg:w-[55%] text-left z-10 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Social Proof - Trustpilot */}
            <div className="flex items-center">
              <a
                href="https://uk.trustpilot.com/review/www.babybets.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer transition-opacity hover:opacity-80"
              >
                <img
                  src="https://cdn.trustpilot.net/brand-assets/4.1.0/logo-black.svg"
                  alt="Trustpilot"
                  className="h-6 sm:h-7"
                  loading="lazy"
                />
              </a>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-0"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              {heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="relative inline-block" style={{ color: '#496B71' }}>
                {heroTitle.split(' ').slice(-1)[0]}
                <span
                  className="absolute bottom-2 sm:bottom-3 left-0 w-full h-3 sm:h-4 rounded-full -z-10"
                  style={{ backgroundColor: 'rgba(254, 208, 185, 0.4)' }}
                />
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl pt-2 sm:pt-3"
              style={{ color: '#78716c' }}
            >
              {heroDesc}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Link to="/competitions" className="shrink-0">
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold transition-all duration-300 shadow-2xl hover:shadow-xl cursor-pointer"
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
              <Link to="/how-it-works" className="shrink-0">
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold transition-all duration-300 cursor-pointer"
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
          </div>

          {/* Right Column - Hero Image */}
          <div
            className="w-full lg:w-[45%] relative touch-pan-y select-none"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
              style={{
                borderWidth: '4px',
                borderColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(34, 48, 51, 0.2)'
              }}
            >
              {heroLoading ? (
                <div className="w-full h-auto aspect-4/5 animate-pulse" style={{ backgroundColor: '#FBEFDF' }} />
              ) : !currentCompetition ? (
                /* Coming Soon State */
                <div
                  className="w-full h-auto aspect-4/5 flex flex-col items-center justify-center p-8 text-center pointer-events-none"
                  style={{ backgroundColor: '#FBEFDF' }}
                >
                  <div className="space-y-6">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                      style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)' }}
                    >
                      <Zap size={48} style={{ color: '#496B71' }} />
                    </div>
                    <div>
                      <h3
                        className="text-3xl font-bold mb-3"
                        style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                      >
                        Coming Soon
                      </h3>
                      <p
                        className="text-xl font-medium leading-relaxed"
                        style={{ color: '#78716c' }}
                      >
                        Competitions will be live soon.
                        <br />
                        Check back later!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={currentCompetitionImage as string}
                    alt={currentCompetition.title}
                    loading="eager"
                    draggable="false"
                    className="w-full h-auto object-cover aspect-4/5 transition-all duration-500 ease-in-out pointer-events-none"
                    style={{
                      backgroundColor: '#FBEFDF',
                      opacity: isTransitioning ? 0.7 : 1,
                      userSelect: 'none'
                    } as React.CSSProperties}
                  />

                  {/* Competition Carousel Navigation Dots */}
                  {heroCompetitions && heroCompetitions.length > 1 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 pointer-events-auto">
                      {heroCompetitions.map((_comp, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentCompetitionIndex(index)
                          }}
                          className="w-2 h-2 rounded-full transition-all cursor-pointer"
                          style={{
                            backgroundColor: index === currentCompetitionIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            width: index === currentCompetitionIndex ? '24px' : '8px'
                          }}
                          aria-label={`View competition ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Bottom CTA Overlay */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 pt-24 sm:pt-32 text-white transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(34, 48, 51, 0.95), rgba(34, 48, 51, 0.8), transparent)',
                      opacity: isTransitioning ? 0.7 : 1
                    }}
                  >
                    <div className="flex justify-between items-end gap-3 sm:gap-4">
                      <div className="grow">
                        <div
                          className="text-[10px] sm:text-xs font-bold uppercase mb-1 sm:mb-2 tracking-wider"
                          style={{ color: '#FED0B9' }}
                        >
                          Featured Competition
                        </div>
                        <div className="text-base sm:text-xl md:text-2xl font-bold leading-tight">
                          {`${currentCompetition.title} - £${currentCompetition.total_value_gbp.toLocaleString()}`}
                        </div>
                      </div>
                      <Link to={`/competitions/${currentCompetition.slug}`} className="shrink-0 pointer-events-auto">
                        <div
                          className="rounded-full p-2.5 sm:p-3 md:p-4 shadow-lg cursor-pointer transition-all duration-300"
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
                          <ArrowRight size={18} className="sm:hidden" strokeWidth={2.5} />
                          <ArrowRight size={22} className="hidden sm:block" strokeWidth={2.5} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Floating Winner Badge */}
            {!instantWinLoading && instantWinCount > 0 && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full z-10 flex items-center gap-1.5 sm:gap-2 shadow-lg pointer-events-none"
                style={{
                  backgroundColor: 'white'
                }}
              >
                <Zap size={16} className="sm:hidden" style={{ color: '#ef4444' }} fill="#ef4444" />
                <Zap size={18} className="hidden sm:block md:hidden" style={{ color: '#ef4444' }} fill="#ef4444" />
                <Zap size={20} className="hidden md:block" style={{ color: '#ef4444' }} fill="#ef4444" />
                <div
                  className="text-sm sm:text-base md:text-lg font-bold text-center whitespace-nowrap"
                  style={{ color: '#151e20' }}
                >
                  {instantWinCount}+ prizes to be won instantly!
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
