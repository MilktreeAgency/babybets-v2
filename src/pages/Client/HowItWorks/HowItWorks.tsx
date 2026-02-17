import { Link } from 'react-router-dom'
import { Gift, ShoppingBasket, Play, Trophy, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Gift,
      title: "Choose a Competition",
      description: "Browse our live competitions across the site and pick the prize you want, then choose how many tickets you'd like.",
      color: '#496B71'
    },
    {
      number: 2,
      icon: ShoppingBasket,
      title: "Buy Tickets or Enter by Post",
      description: "Checkout securely online, or use our free postal entry route. No subscription required. Enter as often or as little as you like.",
      color: '#FED0B9'
    },
    {
      number: 3,
      icon: Play,
      title: "Instant Result or Live Draw",
      description: "Instant wins tell you straight away if you've won. For scheduled competitions, winners are picked either automatically at the close time or during a live draw. You'll always see the draw type and date on the competition page, and we'll notify winners by email and in their account.",
      color: '#facc15'
    },
    {
      number: 4,
      icon: Trophy,
      title: "Claim Your Prize",
      description: "If you win, follow the claim steps in your account. Choose delivery for physical prizes, or a cash alternative where available. You can also request a withdrawal to your bank account.",
      color: '#9DB4B8'
    }
  ]

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      {/* Hero Section with Steps */}
      <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: '#47676d' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-block mb-3 sm:mb-4">
              <span
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm"
                style={{
                  backgroundColor: 'rgba(254, 208, 185, 0.2)',
                  color: '#FED0B9',
                  borderWidth: '1px',
                  borderColor: 'rgba(254, 208, 185, 0.3)'
                }}
              >
                Enter & Win
              </span>
            </div>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
            >
              How It Works
            </h1>
            <p
              className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed px-4"
              style={{ color: '#e1eaec' }}
            >
              Enter any BabyBets competition in just a few taps. Choose a prize, grab your tickets, and you're in the draw. Some competitions include Instant Wins so you could win straight away by revealing a lucky ticket. If not, you're entered into the live draw with winners announced and shared on our social media.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-8 mb-10 sm:mb-12 relative">
            {/* Connector line - desktop only */}
            <div
              className="hidden lg:block absolute top-16 left-0 right-0 h-[2px] mx-auto"
              style={{
                background: 'repeating-linear-gradient(to right, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 8px, transparent 8px, transparent 16px)',
                width: 'calc(100% - 180px)',
                marginLeft: '90px',
                zIndex: 0
              }}
            />

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative group"
              >
                {/* Card */}
                <div
                  className="relative rounded-2xl p-4 sm:p-5 md:p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                  style={{
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    borderWidth: '2px',
                    borderColor: '#f5f5f4'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    e.currentTarget.style.borderColor = step.color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    e.currentTarget.style.borderColor = '#f5f5f4'
                  }}
                >
                  {/* Number badge */}
                  <div
                    className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg z-10"
                    style={{
                      backgroundColor: step.color,
                      color: step.number === 2 ? '#151e20' : '#ffffff'
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 transition-all duration-300"
                    style={{
                      backgroundColor: `${step.color}15`,
                      color: step.color
                    }}
                  >
                    <step.icon size={28} strokeWidth={2} className="sm:w-8 sm:h-8" />
                  </div>

                  {/* Content */}
                  <h2
                    className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 leading-tight"
                    style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                  >
                    {step.title}
                  </h2>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: '#78716c' }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center px-4">
            <Link to="/competitions" className="block sm:inline-block">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 sm:px-10 py-4 sm:py-5 md:py-6 text-base sm:text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                style={{
                  backgroundColor: '#FED0B9',
                  color: '#151e20'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fcb08e'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FED0B9'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                Start Winning Today
                <ArrowRight size={18} className="ml-2 sm:w-5 sm:h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Fairness Section */}
      <section className="py-12 sm:py-16 md:py-20 border-t" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-5 md:mb-6" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Fairness Guaranteed
            </h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-7 md:mb-8 leading-relaxed" style={{ color: '#78716c' }}>
              Every BabyBets competition is run in a clear, transparent way, so you always know how winners are chosen. Whether it's an instant win, an automated draw, or a live draw, the entry method and draw type are shown on the competition page. Winners are selected at random or live draws are using a random number generator.
            </p>

            <ul className="space-y-3 sm:space-y-4 inline-block text-left">
              {[
                'Clear draw type shown on every competition',
                'Instant wins reveal results immediately (where available)',
                'Automated draws select a winner randomly at the stated close time',
                'Live draws have a published draw date and can be watched live',
                'Winners notified by email and in their account',
                'Choose between the physical prize or cash alternative',
                'Free postal entry route available for all competition'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 sm:gap-3 font-medium text-sm sm:text-base" style={{ color: '#151e20' }}>
                  <CheckCircle className="shrink-0 sm:w-5 sm:h-5" size={18} style={{ color: '#496B71' }} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Teaser Section */}
      <section className="py-12 sm:py-16 md:py-20 text-center" style={{ backgroundColor: '#fffbf7' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <HelpCircle className="mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" size={40} style={{ color: '#78716c' }} aria-hidden="true" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
            Still have questions?
          </h2>
          <p className="text-sm sm:text-base mb-6 sm:mb-7 md:mb-8" style={{ color: '#78716c' }}>
            Check out our Frequently Asked Questions for more details on tickets, odds, and claiming prizes.
          </p>
          <Link to="/faq" className="block sm:inline-block">
            <button
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-colors cursor-pointer"
              style={{
                backgroundColor: 'white',
                color: '#151e20',
                borderWidth: '1px',
                borderColor: '#e7e5e4'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              Visit FAQ Page
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
