import { Link } from 'react-router-dom'
import { Ticket, CreditCard, Zap, Gift, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Ticket,
      title: "Choose a Competition",
      description: "Browse our instant wins or scheduled draws. Pick your competition and decide how many tickets to enter with.",
      color: '#496B71'
    },
    {
      number: 2,
      icon: CreditCard,
      title: "Buy Tickets or Enter by Post",
      description: "Pay securely online or use our free postal entry route. No subscription required - enter as many or as few as you like.",
      color: '#FED0B9'
    },
    {
      number: 3,
      icon: Zap,
      title: "Instant Result",
      description: "For instant wins, tap to reveal your result immediately. For scheduled draws, wait for the draw date to find out if you've won.",
      color: '#facc15'
    },
    {
      number: 4,
      icon: Gift,
      title: "Claim Your Prize",
      description: "Won a prize? Choose the physical item, cash alternative, or withdraw your winnings to your bank account.",
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
                ⚡ Instant Win
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
              Enter our instant win competition and discover if you've won straight away. Over 1,900 prizes available to win instantly!
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
              Our instant win system is completely fair and transparent. Winning ticket codes are pre-assigned before the competition goes live, so every ticket has a genuine chance to win.
            </p>

            <ul className="space-y-3 sm:space-y-4 inline-block text-left">
              {[
                'Winning codes pre-assigned before competition starts',
                'Instant reveal - find out immediately if you\'ve won',
                'Choose between prize or cash alternative',
                'End prize draw for all ticket holders',
                'Free postal entry route available'
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
