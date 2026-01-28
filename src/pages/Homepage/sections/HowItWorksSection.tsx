import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function HowItWorksSection() {
  return (
    <section className="py-16 px-6 mb-20">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <p className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#ff4b5f' }}>
              INSTANT WIN
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-12" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
              How It Works
            </h2>

            {/* Process List */}
            <div className="space-y-8">
              {/* Step 01 */}
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#335761' }}>
                  01
                </div>
                <div>
                  <h5 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
                    Choose a Competition
                  </h5>
                  <p className="text-base leading-relaxed" style={{ color: '#333333' }}>
                    Browse our instant wins or scheduled draws. Pick your competition and enter.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#4a6c76' }}>
                  02
                </div>
                <div>
                  <h5 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
                    Tap to Reveal
                  </h5>
                  <p className="text-base leading-relaxed" style={{ color: '#333333' }}>
                    For instant wins, tap to reveal your result immediately after purchase.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#5f8189' }}>
                  03
                </div>
                <div>
                  <h5 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
                    Claim Prize
                  </h5>
                  <p className="text-base leading-relaxed" style={{ color: '#333333' }}>
                    Won a prize? Choose the physical item, cash alternative, or withdraw to your bank.
                  </p>
                </div>
              </div>

              {/* Step 04 */}
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#74969d' }}>
                  04
                </div>
                <div>
                  <h5 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
                    Scheduled Draw
                  </h5>
                  <p className="text-base leading-relaxed" style={{ color: '#333333' }}>
                    Every ticket also enters the end prize draw at competition close.
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="mt-10">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:opacity-90"
                style={{ backgroundColor: '#335761', color: '#ffffff' }}
              >
                <span>Learn More</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <img
              src="https://ap-guzal.myshopify.com/cdn/shop/files/Group_1321314543.png?v=1740975105&width=661"
              alt="How it works"
              className="w-full h-auto rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
