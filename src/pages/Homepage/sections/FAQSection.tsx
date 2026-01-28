import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'Are BabyBets competitions legitimate?',
    answer: 'Yes, BabyBets is fully regulated and transparent. All draws are live-streamed on Facebook and winners are announced publicly. We\'ve awarded over £10 million in prizes to 25,000+ families since 2021. We are a registered UK company and comply with all applicable regulations.'
  },
  {
    question: 'How do I enter a competition?',
    answer: 'Simply browse our active competitions, select the prize you want to win, and choose your ticket quantity. You can pick your own numbers or use the lucky dip. Proceed to checkout to complete your entry. You can also enter for free via our postal entry route.'
  },
  {
    question: 'How are winners chosen?',
    answer: 'We use a 100% random number generator (Google Random Number Generator) during our live draws on Facebook. This ensures every draw is completely fair and transparent. All draws are recorded and available to watch afterwards.'
  },
  {
    question: 'What are instant win competitions?',
    answer: 'Instant win competitions have special lucky ticket numbers hidden in the draw. If you purchase a lucky number, you win instantly without waiting for the draw date! Look for the yellow \'Instant Win\' badge on qualifying competitions.'
  },
  {
    question: 'How do I know if I\'ve won?',
    answer: 'We will contact you immediately by phone and email if you win. We also publish all results on our Winners page and social media channels within 24 hours of the draw. Make sure your contact details are up to date in your account.'
  },
  {
    question: 'How do I receive my prize?',
    answer: 'Winners are contacted immediately by phone and email. Prizes are delivered free of charge to your door within 14 days. Cash prizes are transferred via bank transfer within 48 hours. We handle all delivery and logistics.'
  },
  {
    question: 'Can I buy multiple tickets?',
    answer: 'Yes! You can purchase multiple tickets to increase your chances of winning. We offer bundle discounts - the more tickets you buy, the cheaper the per-ticket price. There\'s no maximum limit on how many tickets you can buy.'
  },
  {
    question: 'Is there a free entry method?',
    answer: 'Yes, we offer a free postal entry route for all our competitions in compliance with UK law. Please see our Terms & Conditions for full details on how to enter by post. You can send a postcard with your details to enter any active competition.'
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 px-6 mb-20">
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#ff4b5f' }}>
            GOT QUESTIONS?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#333333' }}>
            Everything you need to know about winning prizes for your little one
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-3">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden transition-all duration-300 border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb'
              }}
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer transition-all duration-300 hover:bg-gray-50"
                aria-expanded={openIndex === index}
              >
                <div className="flex items-center gap-4 flex-1">
                  <h3 className="text-lg md:text-xl font-semibold" style={{ color: '#2D251E' }}>
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown
                  className="shrink-0 w-5 h-5 transition-transform duration-300"
                  style={{
                    color: '#335761',
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: openIndex === index ? '500px' : '0px',
                  opacity: openIndex === index ? 1 : 0
                }}
              >
                <div className="px-6 pb-6 pt-0">
                  <p className="text-base leading-relaxed" style={{ color: '#666666' }}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-base mb-4" style={{ color: '#333333' }}>
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all duration-300 hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#335761', color: '#ffffff' }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  )
}
