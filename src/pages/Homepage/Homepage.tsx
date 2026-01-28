import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import HeroSection from './sections/HeroSection'
import HowItWorksSection from './sections/HowItWorksSection'
import MeetPartnerSection from './sections/MeetPartnerSection'
import ScrollingTextSection from './sections/ScrollingTextSection'
import FeaturedCompetitionsSection from './sections/FeaturedCompetitionsSection'
import WinAmazingPrizesSection from './sections/WinAmazingPrizesSection'
import FAQSection from './sections/FAQSection'
import FinalCTASection from './sections/FinalCTASection'

function Homepage() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <MeetPartnerSection />
      <ScrollingTextSection />
      <FeaturedCompetitionsSection />
      <WinAmazingPrizesSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}

export default Homepage
