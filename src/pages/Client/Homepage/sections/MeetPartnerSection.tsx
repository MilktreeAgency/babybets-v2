import { Link } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'

export default function MeetPartnerSection() {
  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Image */}
          <div className="relative order-2 lg:order-1">
            <div className  ="relative rounded-3xl overflow-hidden">
              <img
                src="/ShelleyxNick-hero-image.jpg"
                alt="Shelley and Nick"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: '#ff4b5f', color: '#ffffff' }}>
              <Heart size={12} className="fill-current" />
              Official Partner
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
              Meet Shelley & Nick
            </h2>

            <p className="text-lg mb-6 leading-relaxed" style={{ color: '#333333' }}>
              Join our amazing partner family in their journey to win premium baby gear! Shelley & Nick are parents just like you, sharing their love for BabyBets competitions.
            </p>

            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                  <p className="italic leading-relaxed" style={{ color: '#333333' }}>
                    "BabyBets is genuinely one of the best competition sites we have come across. Transparent draws, amazing prizes, and real winners!"
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '2px solid #ffca24' }}>
                  <img
                    src="/ShelleyxNick-hero-image.jpg"
                    alt="Shelley and Nick"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="font-bold" style={{ color: '#000000' }}>Shelley x Nick</div>
                  <div className="text-sm" style={{ color: '#666666' }}>BabyBets Official Partners</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#000000' }}>5+</div>
                <div className="text-xs" style={{ color: '#666666' }}>Years Parenting</div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#000000' }}>12</div>
                <div className="text-xs" style={{ color: '#666666' }}>Prizes Won</div>
              </div>
            </div>

            <Link
              to="/partner/shelleyxnick"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:opacity-90 group"
              style={{ backgroundColor: '#335761', color: '#ffffff' }}
            >
              <span>Visit Their Page</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
