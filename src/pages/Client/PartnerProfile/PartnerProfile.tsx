import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Instagram, Youtube, ExternalLink, Copy, Check } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CompetitionCard from '@/components/CompetitionCard'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { setReferral } from '@/lib/referralTracking'
import { hasAffiliateTrackingConsent } from '@/components/CookieConsent'

type Influencer = Database['public']['Tables']['influencers']['Row']
type Competition = Database['public']['Tables']['competitions']['Row']

export default function PartnerProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (slug) {
      loadInfluencerData()
    }
  }, [slug])

  const loadInfluencerData = async () => {
    try {
      setLoading(true)

      // Load influencer details
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (influencerError) throw influencerError
      setInfluencer(influencerData)

      // Set referral tracking (GDPR-compliant)
      if (influencerData && hasAffiliateTrackingConsent()) {
        setReferral(influencerData.id, influencerData.slug)
      }

      // Load active competitions
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (competitionsError) throw competitionsError
      setCompetitions(competitionsData || [])
    } catch (error) {
      console.error('Error loading influencer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="size-5" />
      case 'YouTube':
        return <Youtube className="size-5" />
      case 'TikTok':
        return (
          <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
          </svg>
        )
      default:
        return <ExternalLink className="size-5" />
    }
  }

  const handleCopyCode = async () => {
    if (!influencer?.slug) return

    try {
      await navigator.clipboard.writeText(influencer.slug)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fffbf7', color: '#2D251E' }}>
        <Header />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block size-12 border-4 rounded-full animate-spin" style={{ borderColor: '#e7e5e4', borderTopColor: '#496B71' }}></div>
            <p className="mt-4 text-gray-600">Loading partner profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!influencer) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fffbf7', color: '#2D251E' }}>
        <Header />
        <div className="pt-32 px-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Partner Not Found</h1>
          <p className="text-gray-600 mb-6">The partner profile you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer"
            style={{ backgroundColor: '#496B71', color: 'white' }}
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fffbf7', color: '#2D251E' }}>
      <Header />

      {/* Profile Section */}
      <div className="pt-16 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
            {/* Profile Image */}
            <div className="flex flex-col items-center md:items-start">
              <div className="relative mb-4">
                {influencer.profile_image_url ? (
                  <img
                    src={influencer.profile_image_url}
                    alt={influencer.display_name}
                    className="size-40 rounded-full object-cover shadow-lg"
                    style={{ borderWidth: '4px', borderColor: 'white' }}
                  />
                ) : (
                  <div
                    className="size-40 rounded-full shadow-lg flex items-center justify-center text-4xl font-bold"
                    style={{
                      borderWidth: '4px',
                      borderColor: 'white',
                      backgroundColor: '#496B71',
                      color: 'white'
                    }}
                  >
                    {getInitials(influencer.display_name)}
                  </div>
                )}
              </div>

              {/* Social Link */}
              {influencer.social_profile_url && (
                <a
                  href={influencer.social_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer w-full justify-center"
                  style={{ backgroundColor: '#496B71', color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a565a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
                >
                  {getPlatformIcon(influencer.primary_platform || 'Instagram')}
                  Follow
                </a>
              )}
            </div>

            {/* Bio & Info */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                {influencer.display_name}
              </h1>

              <p className="text-base leading-relaxed mb-4" style={{ color: '#78716c' }}>
                {influencer.page_bio || `Hi, I'm ${influencer.display_name}! I'm excited to share amazing BabyBets competitions with my community. Check out the competitions below and enter for a chance to win!`}
              </p>

              {/* Referral Code */}
              <div className="inline-flex items-center gap-2">
                <div>
                  <span className="text-xs font-medium" style={{ color: '#78716c' }}>
                    Code:
                  </span>
                  <span className="text-sm font-bold ml-1" style={{ color: '#151e20' }}>
                    {influencer.slug}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded transition-colors cursor-pointer"
                  style={{
                    backgroundColor: copied ? '#22c55e' : 'transparent',
                    color: copied ? 'white' : '#496B71'
                  }}
                  title={copied ? 'Copied!' : 'Copy code'}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Section */}
      <div className="pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Active Competitions
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#78716c' }}>
              Enter these competitions shared by {influencer.display_name}
            </p>
          </div>

          {competitions.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl"
              style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4' }}
            >
              <p className="text-lg" style={{ color: '#78716c' }}>
                No active competitions at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      </div>

      <Footer />
    </div>
  )
}
