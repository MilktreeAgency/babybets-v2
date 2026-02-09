import { Mail } from 'lucide-react'
import { useState } from 'react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add newsletter subscription logic
  }

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: '#FED0B9' }}>
      {/* Decorative blur circles */}
      <div
        className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: '#9DB4B8' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: '#496B71' }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 py-16 md:py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-8 shadow-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            color: '#151e20',
            borderWidth: '1px',
            borderColor: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <Mail size={16} />
          <span>Join the Club</span>
        </div>

        {/* Headline */}
        <h2
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-6"
          style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
        >
          Never Miss a Draw
        </h2>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed"
          style={{ color: 'rgba(21, 30, 32, 0.8)' }}
        >
          Subscribe to get exclusive discounts, flash draw alerts, and winner announcements sent straight to your inbox.
        </p>

        {/* Form */}
        <form
          className="max-w-md mx-auto flex flex-col sm:flex-row gap-3"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-grow px-6 py-4 rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'white',
              color: '#151e20',
              borderWidth: '2px',
              borderColor: 'transparent',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#496B71'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
          />
          <button
            type="submit"
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            style={{
              backgroundColor: '#496B71',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3a565a'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#496B71'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Subscribe
          </button>
        </form>

        {/* Privacy Notice */}
        <p className="text-xs mt-6" style={{ color: 'rgba(21, 30, 32, 0.6)' }}>
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
