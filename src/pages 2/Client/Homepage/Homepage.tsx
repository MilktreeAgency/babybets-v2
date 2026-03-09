import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useSpinWheelModal } from '@/hooks/useSpinWheelModal'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import WinnerTicker from '@/components/common/WinnerTicker'
import LiveTicker from '@/components/common/LiveTicker'
import { SpinWheelModal } from '@/components/ui/SpinWheelModal'
import HeroSection from './sections/HeroSection'
import FeaturedCompetitionsSection from './sections/FeaturedCompetitionsSection'
import AllCompetitionsSection from './sections/AllCompetitionsSection'
import HowItWorksSection from './sections/HowItWorksSection'
import JustLaunchedSection from './sections/JustLaunchedSection'
import MeetFoundersSection from './sections/MeetFoundersSection'
import WinAmazingPrizesSection from './sections/WinAmazingPrizesSection'
import WinnersSection from './sections/WinnersSection'
import NewsletterSection from './sections/NewsletterSection'

function Homepage() {
  const { isLoading } = useAuth()
  const { liveTicker, loading: settingsLoading } = useSystemSettings()
  const { isOpen: isWheelOpen, closeModal: closeWheel } = useSpinWheelModal()

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
      <AllCompetitionsSection />
      <HowItWorksSection />
      <JustLaunchedSection />
      <MeetFoundersSection />
      <WinAmazingPrizesSection />
      <WinnersSection />
      <NewsletterSection />
      <Footer />
      <SpinWheelModal isOpen={isWheelOpen} onClose={closeWheel} />
    </div>
  )
}

export default Homepage
