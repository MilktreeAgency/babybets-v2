import { Link } from 'react-router-dom'
import { Ticket, CreditCard, Zap, Gift, ArrowRight } from 'lucide-react'

export default function HowItWorksSection() {
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#47676d' }}>
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
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight px-4"
            style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
          >
            How It Works
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed px-4"
            style={{ color: '#e1eaec' }}
          >
            Enter our instant win competition and discover if you've won straight away. Over 1,900 prizes available to win instantly!
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12 relative">
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
                className="relative rounded-xl sm:rounded-2xl p-5 sm:p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-2 cursor-pointer"
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
                  className="absolute -top-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg z-10"
                  style={{
                    backgroundColor: step.color,
                    color: step.number === 2 ? '#151e20' : '#ffffff'
                  }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300"
                  style={{
                    backgroundColor: `${step.color}15`,
                    color: step.color
                  }}
                >
                  <step.icon size={28} className="sm:hidden" strokeWidth={2} />
                  <step.icon size={32} className="hidden sm:block" strokeWidth={2} />
                </div>

                {/* Content */}
                <h3
                  className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 leading-tight"
                  style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
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
          <Link to="/how-it-works">
            <button
              className="inline-flex items-center justify-center rounded-xl px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 text-base sm:text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
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
              <span className="hidden sm:inline">Learn More About How It Works</span>
              <span className="sm:hidden">Learn More</span>
              <ArrowRight size={18} className="sm:hidden ml-2" />
              <ArrowRight size={20} className="hidden sm:block ml-2" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
