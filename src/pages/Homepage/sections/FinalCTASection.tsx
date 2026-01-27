import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function FinalCTASection() {
  return (
    <section className="py-16 px-6 mb-20">
      <div className="max-w-[1300px] mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
          Ready to Start Winning?
        </h2>
        <p className="text-lg mb-8" style={{ color: '#333333' }}>
          Join thousands of parents winning amazing prizes for their little ones
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/competitions"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: '#335761', color: '#ffffff' }}
          >
            <span>View Competitions</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:bg-gray-100"
            style={{ backgroundColor: 'transparent', color: '#335761', border: '2px solid #335761' }}
          >
            <span>How It Works</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
