import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Instagram } from 'lucide-react'

export default function MeetFoundersSection() {
  return (
    <section id="meet-us" className="py-14 sm:py-16 md:py-20 relative overflow-hidden" style={{ backgroundColor: '#3d6068' }}>
      <div className="max-w-[1100px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: Content ── */}
          <div className="order-1">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(254, 208, 185, 0.2)', color: '#FED0B9', borderWidth: '1px', borderColor: 'rgba(254,208,185,0.3)' }}
            >
              <Heart size={12} fill="currentColor" />
              Meet The Founders
            </div>

            {/* Heading */}
            <h2
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Fraunces', serif", color: '#ffffff' }}
            >
              Meet Nick &amp; Shelley
            </h2>

            {/* Body copy */}
            <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: '#c8dde0' }}>
              Hi, we're Nick and Shelley, and we created BabyBets because we couldn't find a prize site built for parents. It started when Shelley was searching for a pram one evening and saw people winning supercars for a few pounds and said, "I don't need a supercar… why can't I win a pram?" That was the lightbulb moment. So we built BabyBets to give parents the chance to win baby stuff they actually want and need, for less than the price of a coffee. As well as building a positive community and supporting children's charities along the way.
            </p>

            {/* CTA */}
            <Link to="/partners">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcb08e' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9' }}
              >
                Learn More
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>

          {/* ── Right: Image ── */}
          <div className="order-2 relative">
            <div
              className="relative rounded-2xl overflow-hidden w-full aspect-[4/5]"
              style={{ borderWidth: '3px', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <img
                src="/ShelleyxNick-hero-image.jpg"
                alt="Nick & Shelley - BabyBets Founders"
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Instagram badge */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af)' }}
              >
                <Instagram size={20} color="white" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
