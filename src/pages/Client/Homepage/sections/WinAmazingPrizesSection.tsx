import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Testimonial {
  id: string
  video_url: string
  quote: string
  author_name: string
  display_order: number
  url?: string | null
}

interface SectionSettings {
  headline: string
  description: string
}

interface TestimonialsSectionSettings {
  headline: string
  description: string
}

export default function WinAmazingPrizesSection() {
  const [videoTestimonials, setVideoTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionSettings, setSectionSettings] = useState<SectionSettings | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load testimonials
        const { data: testimonialsData, error: testimonialsError } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (testimonialsError) throw testimonialsError

        setVideoTestimonials(testimonialsData || [])

        // Load section settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'testimonials_section')
          .single()

        if (!settingsError && settingsData?.setting_value) {
          const settingValue = settingsData.setting_value as unknown as TestimonialsSectionSettings
          setSectionSettings({
            headline: settingValue.headline,
            description: settingValue.description
          })
        }
      } catch (error) {
        console.error('Error loading testimonials data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return null
  }

  // Only show section if we have both testimonials and section settings from backend
  if (videoTestimonials.length === 0 || !sectionSettings) {
    return null
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Headline */}
        <div className="text-center mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 max-w-6xl mx-auto px-4" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
            {sectionSettings.headline}
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: '#666666' }}>
            {sectionSettings.description}
          </p>
        </div>

        {/* Videos Grid - Desktop/Tablet */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {videoTestimonials.map((card) => (
            <div
              key={card.id}
              className={`relative aspect-9/16 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl ${card.url ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
              onClick={() => card.url && window.open(card.url, '_blank', 'noopener,noreferrer')}
              role={card.url ? 'button' : undefined}
              tabIndex={card.url ? 0 : undefined}
              onKeyDown={(e) => {
                if (card.url && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  window.open(card.url, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              <video
                src={card.video_url}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 text-white">
                <p className="text-xs sm:text-sm italic mb-1.5 sm:mb-2">"{card.quote}"</p>
                <p className="text-[10px] sm:text-xs font-semibold">{card.author_name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Video Carousel - Mobile */}
        {videoTestimonials.length > 0 && (
          <div className="sm:hidden relative">
            <div
              className={`relative aspect-9/16 rounded-2xl overflow-hidden shadow-xl max-w-xs mx-auto ${videoTestimonials[0].url ? 'cursor-pointer' : ''}`}
              onClick={() => videoTestimonials[0].url && window.open(videoTestimonials[0].url, '_blank', 'noopener,noreferrer')}
              role={videoTestimonials[0].url ? 'button' : undefined}
              tabIndex={videoTestimonials[0].url ? 0 : undefined}
              onKeyDown={(e) => {
                if (videoTestimonials[0].url && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  window.open(videoTestimonials[0].url, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              <video
                src={videoTestimonials[0].video_url}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-sm italic mb-2">"{videoTestimonials[0].quote}"</p>
                <p className="text-xs font-semibold">{videoTestimonials[0].author_name}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
