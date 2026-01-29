import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import WinnerTicker from '@/components/common/WinnerTicker'
import HeroSection from './sections/HeroSection'
import FeaturedCompetitionsSection from './sections/FeaturedCompetitionsSection'
import InstantWinsSection from './sections/InstantWinsSection'
import HowItWorksSection from './sections/HowItWorksSection'
import JustLaunchedSection from './sections/JustLaunchedSection'
import MeetPartnerSection from './sections/MeetPartnerSection'
import WinAmazingPrizesSection from './sections/WinAmazingPrizesSection'
import NewsletterSection from './sections/NewsletterSection'

function Homepage() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />
      <WinnerTicker speed="fast" />
      <HeroSection />
      <FeaturedCompetitionsSection />
      <InstantWinsSection />
      <HowItWorksSection />
      <JustLaunchedSection />
      <MeetPartnerSection />
      <WinAmazingPrizesSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}

export default Homepage
