import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'

export default function MeetFoundersSection() {
  return (
    <section id="meet-us" className="py-12 sm:py-14 md:py-16 lg:py-20 relative overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden w-full aspect-[4/5] shadow-2xl" style={{ borderWidth: '4px', borderColor: 'white' }}>
              <img
                src="/ShelleyxNick-hero-image.jpg"
                alt="Nick & Shelley - BabyBets Founders"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mb-3 sm:mb-4 shadow-sm"
              style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)', color: '#496B71' }}
            >
              <Users size={14} className="sm:hidden" />
              <Users size={16} className="hidden sm:block" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">MEET THE FOUNDERS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Meet Nick & Shelley
            </h2>

            <div className="rounded-xl p-4 sm:p-6 mb-5 sm:mb-6" style={{ backgroundColor: '#FBEFDF', borderWidth: '1px', borderColor: '#f0e0ca' }}>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: '#151e20' }}>
                Hi, we're Nick and Shelley, and we created BabyBets because we couldn't find a prize site built for parents. It started when Shelley was searching for a pram one evening and saw people winning supercars for a few pounds and said, "I don't need a supercar… why can't I win a pram?" That was the lightbulb moment. So we built BabyBets to give parents the chance to win baby stuff they actually want and need, for less than the price of a coffee. As well as building a positive community and supporting children's charities along the way.
              </p>
            </div>

            {/* CTA Button */}
            <div>
              <Link to="/partners">
                <button
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
                  style={{
                    backgroundColor: '#496B71',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a565a'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#496B71'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <span>Read more</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
