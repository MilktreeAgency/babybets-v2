import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import WinnerTicker from '@/components/common/WinnerTicker'
import LiveTicker from '@/components/common/LiveTicker'
import HeroSection from './sections/HeroSection'
import FeaturedCompetitionsSection from './sections/FeaturedCompetitionsSection'
import InstantWinsSection from './sections/InstantWinsSection'
import HowItWorksSection from './sections/HowItWorksSection'
import JustLaunchedSection from './sections/JustLaunchedSection'
import MeetPartnerSection from './sections/MeetPartnerSection'
import WinAmazingPrizesSection from './sections/WinAmazingPrizesSection'
import WinnersSection from './sections/WinnersSection'

function Homepage() {
  const { isLoading } = useAuth()
  const { liveTicker, loading: settingsLoading } = useSystemSettings()

  if (isLoading || settingsLoading) {
    return null
  }

  // Show live ticker only if enabled and URL is provided
  const showLiveTicker = liveTicker?.enabled && liveTicker?.url

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />
      {showLiveTicker && (
        <LiveTicker
          url={liveTicker.url}
          text={liveTicker.text}
        />
      )}
      <WinnerTicker speed="fast" />
      <HeroSection />
      <FeaturedCompetitionsSection />
      <InstantWinsSection />
      <HowItWorksSection />
      <JustLaunchedSection />
      <MeetPartnerSection />
      <WinAmazingPrizesSection />
      <WinnersSection />
      <Footer />
    </div>
  )
}

export default Homepage
