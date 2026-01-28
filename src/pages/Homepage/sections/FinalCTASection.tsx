import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function FinalCTASection() {
  return (
    <section className="py-16 px-6 mb-20">
      <div className="max-w-[1300px] mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background Image */}
          <img
            src="https://ap-guzal.myshopify.com/cdn/shop/files/banner3.png?v=1744862666&width=1410"
            alt="Special Deals"
            className="w-full h-auto"
            loading="lazy"
          />

          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-8 leading-tight"
              style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}
            >
              Ready to Win <br />
              Amazing{' '}
              <span className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 xl:w-24 xl:h-24 rounded-full bg-[#CADE7F] text-4xl md:text-5xl xl:text-6xl align-middle mx-1">
                🎁
              </span>
              {' '}Prizes <br />
              for Your Little One?
            </h2>

            <Link
              to="/competitions"
              className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-lg transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: '#335761' }}
            >
              <span>View Competitions</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
