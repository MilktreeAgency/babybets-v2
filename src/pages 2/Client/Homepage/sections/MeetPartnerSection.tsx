import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Instagram, Youtube, Facebook } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Partner {
  id: string
  display_name: string
  slug: string
  bio: string | null
  page_bio: string | null
  profile_image_url: string | null
  page_image_url: string | null
  is_active: boolean
  is_ambassador: boolean | null
  total_sales_pence: number | null
  total_commission_pence: number | null
  social_profile_url: string | null
  primary_platform: string | null
}

export default function MeetPartnerSection() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(1) // Start at 1 (first real item)
  const [activeIndex, setActiveIndex] = useState(0) // Track which partner is actually shown
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollIntervalRef = useRef<number | null>(null)
  const isTransitioningRef = useRef(false)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        // Fetch all active partners
        const { data, error } = await supabase
          .from('influencers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error

        setPartners((data || []) as Partner[])
      } catch (error) {
        console.error('Error fetching partners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  // Create circular array with clones
  const circularPartners = partners.length > 0 ? [partners[partners.length - 1], ...partners, partners[0]] : []

  // Scroll to specific position
  const scrollToIndex = (index: number, smooth = true) => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const containerWidth = container.clientWidth
    const scrollPosition = containerWidth * index

    container.scrollTo({
      left: scrollPosition,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }

  // Handle scroll end to create infinite effect
  const handleScroll = () => {
    if (!scrollContainerRef.current || isTransitioningRef.current || partners.length <= 1) return

    const container = scrollContainerRef.current
    const scrollLeft = container.scrollLeft
    const containerWidth = container.clientWidth
    const scrollIndex = Math.round(scrollLeft / containerWidth)

    // Update active indicator
    if (scrollIndex === 0) {
      setActiveIndex(partners.length - 1)
    } else if (scrollIndex === circularPartners.length - 1) {
      setActiveIndex(0)
    } else {
      setActiveIndex(scrollIndex - 1)
    }

    setCurrentIndex(scrollIndex)
  }

  // Handle infinite loop transitions
  useEffect(() => {
    if (!scrollContainerRef.current || partners.length <= 1) return

    const container = scrollContainerRef.current

    const handleTransitionEnd = () => {
      isTransitioningRef.current = true

      // If at clone of last item (index 0), jump to real last item
      if (currentIndex === 0) {
        scrollToIndex(partners.length, false)
        setCurrentIndex(partners.length)
        setActiveIndex(partners.length - 1)
      }
      // If at clone of first item (last index), jump to real first item
      else if (currentIndex === circularPartners.length - 1) {
        scrollToIndex(1, false)
        setCurrentIndex(1)
        setActiveIndex(0)
      }

      setTimeout(() => {
        isTransitioningRef.current = false
      }, 50)
    }

    container.addEventListener('scrollend', handleTransitionEnd)

    return () => {
      container.removeEventListener('scrollend', handleTransitionEnd)
    }
  }, [currentIndex, partners.length, circularPartners.length])

  // Auto-scroll every 7 seconds
  useEffect(() => {
    if (partners.length <= 1) return

    const interval = setInterval(() => {
      if (!isTransitioningRef.current) {
        const nextIndex = currentIndex + 1
        scrollToIndex(nextIndex)
        setCurrentIndex(nextIndex)
      }
    }, 7000)

    autoScrollIntervalRef.current = interval

    return () => {
      clearInterval(interval)
    }
  }, [currentIndex, partners.length])

  const handleIndicatorClick = (index: number) => {
    // Clear auto-scroll when user manually clicks
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
      autoScrollIntervalRef.current = null
    }

    const scrollIndex = index + 1 // Account for clone at start
    setCurrentIndex(scrollIndex)
    setActiveIndex(index)
    scrollToIndex(scrollIndex)

    // Restart auto-scroll after 10 seconds of inactivity
    setTimeout(() => {
      if (partners.length > 1 && !autoScrollIntervalRef.current) {
        const interval = setInterval(() => {
          if (!isTransitioningRef.current) {
            setCurrentIndex((prev) => {
              const nextIndex = prev + 1
              scrollToIndex(nextIndex)
              return nextIndex
            })
          }
        }, 7000)
        autoScrollIntervalRef.current = interval
      }
    }, 10000)
  }

  // Initialize scroll position after mount
  useEffect(() => {
    if (partners.length > 0 && scrollContainerRef.current) {
      scrollToIndex(1, false)
    }
  }, [partners.length])

  // Don't render section if no partners found or still loading
  if (loading || partners.length === 0) {
    return null
  }

  // Get social media icon based on platform
  const getSocialIcon = (partner: Partner) => {
    const platform = partner.primary_platform?.toLowerCase()
    if (platform === 'instagram') return <Instagram size={18} />
    if (platform === 'youtube') return <Youtube size={18} />
    if (platform === 'facebook') return <Facebook size={18} />
    return <Heart size={18} />
  }

  const getSocialPlatformName = (partner: Partner) => {
    const platform = partner.primary_platform
    if (!platform) return 'Social Media'
    return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
  }

  return (
    <section className="py-12 sm:py-14 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
            Meet Our Partners
          </h2>
          <p className="text-base sm:text-lg" style={{ color: '#666666' }}>
            Discover the amazing creators and influencers we work with
          </p>
        </div>

        {/* Scrollable Partners Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {circularPartners.map((partner, idx) => {
              const partnerImage = partner.page_image_url || partner.profile_image_url || '/email-logo.png'
              const partnerBio = partner.page_bio || ''
              const hasSales = (partner.total_sales_pence ?? 0) > 0
              const hasCommission = (partner.total_commission_pence ?? 0) > 0
              const hasSalesData = hasSales || hasCommission
              const totalSales = (hasSales && partner.total_sales_pence && partner.total_sales_pence > 0) ? (partner.total_sales_pence / 100).toFixed(2) : null
              const totalCommission = (hasCommission && partner.total_commission_pence && partner.total_commission_pence > 0) ? (partner.total_commission_pence / 100).toFixed(2) : null

              return (
                <div
                  key={`${partner.id}-${idx}`}
                  className="shrink-0 w-full snap-center"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center h-full">
                    {/* Image */}
                    <div className="relative">
                      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden w-full aspect-square">
                        <img
                          src={partnerImage}
                          alt={partner.display_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 cursor-pointer" style={{ backgroundColor: '#ff4b5f', color: '#ffffff' }}>
                        <Heart size={12} className="fill-current" />
                        {partner.is_ambassador ? 'Brand Ambassador' : 'Official Partner'}
                      </div>

                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
                        Meet {partner.display_name}
                      </h3>

                      <div className="rounded-xl p-4 sm:p-5 mb-5" style={{ backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                        {partnerBio && (
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#333333' }}>
                                {partnerBio}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden" style={{ border: '2px solid #ffca24' }}>
                            <img
                              src={partner.profile_image_url || partnerImage}
                              alt={partner.display_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-bold" style={{ color: '#000000' }}>{partner.display_name}</div>
                            <div className="text-xs sm:text-sm" style={{ color: '#666666' }}>BabyBets Official {partner.is_ambassador ? 'Brand Ambassador' : 'Partner'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      {hasSalesData && (
                        <div className={`grid gap-3 mb-5 ${hasSales && hasCommission ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {totalSales && (
                            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                              <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: '#000000' }}>£{totalSales}</div>
                              <div className="text-[10px] sm:text-xs" style={{ color: '#666666' }}>Total Sales</div>
                            </div>
                          )}
                          {totalCommission && (
                            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                              <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: '#000000' }}>£{totalCommission}</div>
                              <div className="text-[10px] sm:text-xs" style={{ color: '#666666' }}>Total Earned</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          to={`/partner/${partner.slug}`}
                          className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 hover:opacity-90 group cursor-pointer"
                          style={{ backgroundColor: '#335761', color: '#ffffff' }}
                        >
                          <span>Visit Their Page</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        {partner.social_profile_url && (
                          <a
                            href={partner.social_profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 hover:opacity-90 cursor-pointer border-2"
                            style={{ borderColor: '#335761', color: '#335761', backgroundColor: 'transparent' }}
                          >
                            {getSocialIcon(partner)}
                            <span>Follow on {getSocialPlatformName(partner)}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scroll Indicator */}
          {partners.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {partners.map((partner, idx) => (
                <button
                  key={partner.id}
                  onClick={() => handleIndicatorClick(idx)}
                  className="w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-125"
                  style={{ backgroundColor: idx === activeIndex ? '#335761' : '#d1d5db' }}
                  aria-label={`Go to ${partner.display_name}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CSS to hide scrollbar */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}
