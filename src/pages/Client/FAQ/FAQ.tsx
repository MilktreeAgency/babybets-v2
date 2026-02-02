import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b" style={{ borderColor: '#e7e5e4' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-6 text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <span
          className="text-lg font-bold transition-colors"
          style={{ color: isOpen ? '#496B71' : '#151e20' }}
        >
          {question}
        </span>
        <span
          className="p-2 rounded-full transition-colors"
          style={{
            backgroundColor: isOpen ? 'rgba(73, 107, 113, 0.1)' : '#f5f5f4',
            color: isOpen ? '#496B71' : '#78716c'
          }}
        >
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      {isOpen && (
        <div className="overflow-hidden pb-6 pr-8">
          <p className="leading-relaxed" style={{ color: '#78716c' }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  const faqs = [
    {
      q: 'Are BabyBets competitions legitimate?',
      a: "Yes, BabyBets is fully regulated and transparent. All draws are live-streamed on Facebook and winners are announced publicly. We've awarded over £10 million in prizes to 25,000+ families since 2021. We are a registered UK company and comply with all applicable regulations."
    },
    {
      q: 'How do I enter a competition?',
      a: 'Simply browse our active competitions, select the prize you want to win, and choose your ticket quantity. You can pick your own numbers or use the lucky dip. Proceed to checkout to complete your entry. You can also enter for free via our postal entry route.'
    },
    {
      q: 'How are winners chosen?',
      a: 'We use a 100% random number generator (Google Random Number Generator) during our live draws on Facebook. This ensures every draw is completely fair and transparent. All draws are recorded and available to watch afterwards.'
    },
    {
      q: 'When does the draw take place?',
      a: 'Each competition has a set draw date and time shown on the competition page. If a competition sells out early, we may bring the draw date forward, but we never extend it. Winners are contacted immediately after the draw.'
    },
    {
      q: "What if the competition doesn't sell out?",
      a: 'The draw goes ahead regardless of ticket sales! We guarantee to draw the prize on the specified date, even if we only sell 10% of the tickets. This is our guarantee to all entrants.'
    },
    {
      q: 'Is there a free entry method?',
      a: 'Yes, we offer a free postal entry route for all our competitions in compliance with UK law. Please see our Terms & Conditions for full details on how to enter by post. You can send a postcard with your details to enter any active competition.'
    },
    {
      q: 'What are instant win competitions?',
      a: "Instant win competitions have special lucky ticket numbers hidden in the draw. If you purchase a lucky number, you win instantly without waiting for the draw date! Look for the yellow 'Instant Win' badge on qualifying competitions."
    },
    {
      q: "How do I know if I've won?",
      a: 'We will contact you immediately by phone and email if you win. We also publish all results on our Winners page and social media channels within 24 hours of the draw. Make sure your contact details are up to date in your account.'
    },
    {
      q: 'How do I receive my prize?',
      a: 'Winners are contacted immediately by phone and email. Prizes are delivered free of charge to your door within 14 days. Cash prizes are transferred via bank transfer within 48 hours. We handle all delivery and logistics.'
    },
    {
      q: 'Can I buy multiple tickets?',
      a: "Yes! You can purchase multiple tickets to increase your chances of winning. We offer bundle discounts - the more tickets you buy, the cheaper the per-ticket price. There's no maximum limit on how many tickets you can buy."
    }
  ]

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <div className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Frequently Asked Questions
            </h1>
            <p className="text-lg" style={{ color: '#78716c' }}>
              Everything you need to know about entering BabyBets competitions.
            </p>
          </div>

          <div
            className="rounded-2xl p-8 md:p-12"
            style={{
              backgroundColor: 'white',
              borderWidth: '1px',
              borderColor: '#e7e5e4',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>

          {/* Additional Help Section */}
          <div className="mt-12 text-center">
            <p className="mb-4" style={{ color: '#78716c' }}>
              Still have questions? We're here to help!
            </p>
            <a
              href="mailto:hello@babybets.co.uk"
              className="inline-flex items-center gap-2 font-bold transition-colors cursor-pointer"
              style={{ color: '#496B71' }}
            >
              Contact us at hello@babybets.co.uk
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
