import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    setEmail('')
  }

  return (
    <section className="w-full py-16 sm:py-20 md:py-24 relative overflow-hidden" style={{ backgroundColor: '#f9c5b0' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 border" style={{ backgroundColor: 'white', borderColor: 'rgba(0,0,0,0.08)' }}>
          <Mail size={15} style={{ color: '#2D251E' }} />
          <span className="text-sm font-medium" style={{ color: '#2D251E' }}>Join the Club</span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
          Never Miss a Draw
        </h2>

        {/* Subtext */}
        <p className="text-base sm:text-lg mb-8" style={{ color: '#2D251E', opacity: 0.75 }}>
          Subscribe to get exclusive discounts, flash draw alerts, and winner announcements sent straight to your inbox.
        </p>

        {/* Form */}
        {submitted ? (
          <p className="text-base font-semibold" style={{ color: '#151e20' }}>
            Thanks for subscribing! We'll be in touch.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex items-center gap-0 rounded-xl overflow-hidden shadow-sm max-w-md mx-auto" style={{ backgroundColor: 'white' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-4 text-sm bg-transparent outline-none"
                style={{ color: '#151e20' }}
              />
              <button
                type="submit"
                className="px-6 py-4 text-sm font-bold transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ backgroundColor: '#151e20', color: 'white' }}
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-xs" style={{ color: '#2D251E', opacity: 0.55 }}>
              We respect your privacy. Unsubscribe at any time.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
