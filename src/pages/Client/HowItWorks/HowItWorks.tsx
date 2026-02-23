import { Link } from 'react-router-dom'
import { Gift, ShoppingBasket, Play, Trophy, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

const steps = [
  {
    number: 1,
    icon: Gift,
    title: 'Choose a Competition',
    description: "Browse our live competitions across the site and pick the prize you want, then choose how many tickets you'd like.",
  },
  {
    number: 2,
    icon: ShoppingBasket,
    title: 'Buy Tickets or Enter by Post',
    description: 'Checkout securely online, or use our free postal entry route. No subscription required. Enter as often or as little as you like.',
  },
  {
    number: 3,
    icon: Play,
    title: 'Instant Result or Live Draw',
    description: "Instant wins tell you straight away if you've won. For scheduled competitions, winners are picked either automatically at the close time or during a live draw. You'll always see the draw type and date on the competition page, and we'll notify winners by email and in their account.",
  },
  {
    number: 4,
    icon: Trophy,
    title: 'Claim Your Prize',
    description: 'If you win, follow the claim steps in your account. Choose delivery for physical prizes, or a cash alternative where available. You can also request a withdrawal to your bank account.',
  },
]

const fairnessPoints = [
  'Clear draw type shown on every competition',
  'Instant wins reveal results immediately (where available)',
  'Automated draws select a winner randomly at the stated close time',
  'Live draws have a published draw date and can be watched live',
  'Winners notified by email and in their account',
  'Choose between the physical prize or cash alternative',
  'Free postal entry route available for all competition',
]

export default function HowItWorks() {
  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      {/* ── HERO — teal ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-24 md:pb-32" style={{ backgroundColor: '#496B71' }}>
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.1)' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.07)' }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Heading */}
          <div className="text-center mb-12 sm:mb-14 md:mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(254,208,185,0.2)', color: '#FED0B9', borderWidth: '1px', borderColor: 'rgba(254,208,185,0.3)' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest">Enter & Win</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
            >
              How It Works
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Enter any BabyBets competition in just a few taps. Choose a prize, grab your tickets, and you're in the draw. Some competitions include Instant Wins so you could win straight away by revealing a lucky ticket. If not, you're entered into the live draw with winners announced and shared on our social media.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-12">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                {/* Step number pill */}
                <div
                  className="absolute -top-3 left-5 z-10 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                >
                  Step {step.number}
                </div>

                <div
                  className="relative rounded-2xl p-5 sm:p-6 h-full flex flex-col pt-8 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    borderWidth: '1px',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(254,208,185,0.2)', color: '#FED0B9' }}
                  >
                    <step.icon size={20} strokeWidth={2} />
                  </div>
                  <h2
                    className="text-base sm:text-lg font-bold mb-2 leading-tight"
                    style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
                  >
                    {step.title}
                  </h2>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/competitions">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: '#FED0B9', color: '#151e20', boxShadow: '0 8px 32px rgba(254,208,185,0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc4a6'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Start Winning Today
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAIRNESS GUARANTEED — pink ────────────────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20" style={{ backgroundColor: '#FED0B9' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 lg:gap-20 items-center">

            {/* Left — heading + body */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ backgroundColor: 'rgba(73,107,113,0.15)', color: '#496B71' }}
              >
                <CheckCircle size={13} />
                <span className="text-xs font-bold uppercase tracking-widest">Transparency</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
                style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
              >
                Fairness Guaranteed
              </h2>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(21,30,32,0.7)' }}>
                Every BabyBets competition is run in a clear, transparent way, so you always know how winners are chosen. Whether it's an instant win, an automated draw, or a live draw, the entry method and draw type are shown on the competition page. Winners are selected at random or live draws are using a random number generator.
              </p>
            </div>

            {/* Right — checklist */}
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.9)' }}
            >
              <ul className="space-y-3.5">
                {fairnessPoints.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base font-medium" style={{ color: '#151e20' }}>
                    <div
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: '#496B71' }}
                    >
                      <CheckCircle size={12} color="white" strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── STILL HAVE QUESTIONS — teal ───────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 text-center" style={{ backgroundColor: '#496B71' }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.1)' }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.07)' }} />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-5"
            style={{ backgroundColor: 'rgba(254,208,185,0.2)', color: '#FED0B9' }}
          >
            <HelpCircle size={28} />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
          >
            Still have questions?
          </h2>
          <p className="text-sm sm:text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Check out our Frequently Asked Questions for more details on tickets, odds, and claiming prizes.
          </p>
          <Link to="/faq">
            <button
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: '#FED0B9', color: '#151e20', boxShadow: '0 8px 32px rgba(254,208,185,0.25)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc4a6'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Visit FAQ Page
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
