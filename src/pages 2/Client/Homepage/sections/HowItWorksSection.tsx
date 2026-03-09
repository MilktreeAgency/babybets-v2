import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Zap, Gift, Trophy } from 'lucide-react'

const steps = [
  {
    number: 1,
    icon: Ticket,
    title: "Choose a Competition",
    description: "Browse our live competitions across the site and pick the prize you want, then choose how many tickets you'd like.",
  },
  {
    number: 2,
    icon: Zap,
    title: "Buy Tickets or Enter by Post",
    description: "Checkout securely online, or use our free postal entry route. No subscription required. Enter as often or as little as you like.",
  },
  {
    number: 3,
    icon: Gift,
    title: "Instant Result or Live Draw",
    description: "Instant wins tell you straight away if you've won. For scheduled competitions, winners are picked either automatically at the close time or during a live draw.",
  },
  {
    number: 4,
    icon: Trophy,
    title: "Claim Your Prize",
    description: "If you win, follow the claim steps in your account. Choose delivery for physical prizes, or a cash alternative where available. You can also request a withdrawal to your bank account.",
  },
]

export default function HowItWorksSection() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden" style={{ backgroundColor: '#3d6068' }}>
      <div className="max-w-[1100px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <div className="inline-block mb-4">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
            >
              Instant Win
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
          >
            How It Works
          </h2>
          <p className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed" style={{ color: '#c8dde0' }}>
            Enter our instant win competition and discover if you've won straight away.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-14 relative">
          {/* Connector line desktop */}
          <div
            className="hidden lg:block absolute h-[1px] top-[52px] left-0 right-0"
            style={{
              background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 8px, transparent 8px, transparent 18px)',
              marginLeft: '90px',
              width: 'calc(100% - 180px)',
            }}
          />

          {steps.map((step) => {
            const Icon = step.icon
            const isHovered = hovered === step.number
            return (
              <div
                key={step.number}
                className="flex flex-col items-center text-center cursor-default"
                onMouseEnter={() => setHovered(step.number)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Icon box */}
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300 relative z-10"
                  style={{
                    backgroundColor: isHovered ? '#FED0B9' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Icon
                    size={36}
                    strokeWidth={1.5}
                    style={{ color: isHovered ? '#151e20' : '#FED0B9' }}
                    className="transition-colors duration-300"
                  />
                </div>

                {/* Text */}
                <h3
                  className="text-base sm:text-lg font-bold mb-2"
                  style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#c8dde0' }}>
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/how-it-works">
            <button
              className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-bold transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: '#ffffff', color: '#151e20' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
            >
              Learn More
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
