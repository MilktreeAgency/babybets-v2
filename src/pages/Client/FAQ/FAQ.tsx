import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

interface FAQItemProps {
  question: string
  answer: React.ReactNode
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b" style={{ borderColor: '#e7e5e4' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 sm:py-5 md:py-6 text-left group cursor-pointer gap-3"
        aria-expanded={isOpen}
      >
        <span
          className="text-base sm:text-lg font-bold transition-colors"
          style={{ color: isOpen ? '#496B71' : '#151e20' }}
        >
          {question}
        </span>
        <span
          className="p-1.5 sm:p-2 rounded-full transition-colors shrink-0"
          style={{
            backgroundColor: isOpen ? 'rgba(73, 107, 113, 0.1)' : '#f5f5f4',
            color: isOpen ? '#496B71' : '#78716c'
          }}
        >
          {isOpen ? <Minus size={18} className="sm:w-5 sm:h-5" /> : <Plus size={18} className="sm:w-5 sm:h-5" />}
        </span>
      </button>
      {isOpen && (
        <div className="overflow-hidden pb-4 sm:pb-5 md:pb-6 pr-6 sm:pr-8">
          <div className="text-sm sm:text-base leading-relaxed" style={{ color: '#78716c' }}>
            {answer}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  const faqs = [
    {
      q: 'Are BabyBets competitions legitimate?',
      a: (
        <>
          <p className="mb-3">Yes. BabyBets is a registered UK company and we run our competitions in line with UK requirements, including providing a free postal entry route where applicable. We focus on transparency, with clear entry details, closing times, and winner selection methods shown on every competition page.</p>
          <p>We also follow the Advertising Standards Authority (ASA) rules for marketing and promotions.</p>
        </>
      )
    },
    {
      q: 'How do I enter a competition?',
      a: (
        <>
          <p className="mb-3">Browse the live competitions, pick the prize you want to win, and choose how many tickets you would like. You will be automatically allocated a ticket number. Then complete checkout to confirm your entry.</p>
          <p>You can also enter for free via our postal entry route. See our Terms and Conditions for details.</p>
        </>
      )
    },
    {
      q: 'How are winners chosen?',
      a: (
        <>
          <p className="mb-3">The winner selection method is shown on each competition page. Depending on the competition type, it will be one of the following:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Instant Win:</strong> you see the result straight away by revealing each ticket.</li>
            <li><strong>Live Draw:</strong> the winner is selected live using a random number generator.</li>
            <li><strong>Automated Draw:</strong> the winner is selected automatically at the end of the competition using a random selection process.</li>
          </ul>
        </>
      )
    },
    {
      q: 'When does the draw take place?',
      a: 'Each competition shows a closing date and the draw date or result timing on the competition page. If a competition sells out early, we may bring the draw forward. We do not extend competitions beyond the advertised closing date.'
    },
    {
      q: "What if the competition doesn't sell out?",
      a: 'Regardless of ticket sales the draw will still go ahead as scheduled as per the Terms and Conditions.'
    },
    {
      q: 'Is there a free entry method?',
      a: 'Yes. We offer a free postal entry route for our competitions. Full instructions are in our Terms and Conditions and Free Postal Entry page.'
    },
    {
      q: 'What are Instant Win competitions?',
      a: 'Instant Win competitions show your result immediately after entry. Look for the Instant Win badge on qualifying competitions.'
    },
    {
      q: "How do I know if I've won?",
      a: 'Winners are notified using the contact details on their account, usually by email. We also publish winners on our Winners page and may share results on our social channels.'
    },
    {
      q: 'How do I receive my prize?',
      a: "We'll contact you with next steps. Physical prizes are delivered to your nominated UK address. Cash alternatives, where offered, are paid by bank transfer usually within 48 hours once your details are confirmed. Delivery and payout timelines can vary by prize and will be explained when we contact you."
    },
    {
      q: 'Can I buy multiple tickets?',
      a: 'Yes. You can buy more than one ticket to increase your chances. Some competitions may have a maximum entry limit per person which will be shown on the competition page.'
    },
    {
      q: "Can I sell the prize if I don't want it?",
      a: 'Yes. If you win, the prize is yours. You can keep it, gift it, or sell it.'
    },
    {
      q: 'How do you use my personal data?',
      a: (
        <>
          <p className="mb-3">We use your data to run the competition, contact winners, and deliver prizes. We do not sell your personal data. We only share it with third parties where needed to administer the competition, for example delivery partners, payment providers, or compliance checks.</p>
          <p>More detail is available in our Privacy Policy.</p>
        </>
      )
    },
    {
      q: 'If I win, do I have to take part in promotion?',
      a: "No. Winner photos are optional and only used with your permission. We do ask winners to leave us a review if you'd be kind enough to. We may still need to retain basic winner records for compliance purposes."
    },
    {
      q: 'Can I get a refund of my entry fee?',
      a: 'Entry fees are non-refundable except where required by law or where our Terms and Conditions state otherwise. Please check the Terms and Conditions for full details.'
    },
    {
      q: 'Can I collect my prize if I win?',
      a: 'Collection may be available for some prizes by prior arrangement. Please contact us to discuss options.'
    },
    {
      q: 'Can I exchange my prize?',
      a: 'Prizes are fixed for each competition. Some competitions may offer a cash alternative, where stated on the competition page.'
    },
    {
      q: 'When will the competition close?',
      a: 'Each competition has a countdown timer and a stated closing time on the competition page. Competitions close when the timer ends or when tickets sell out, depending on the competition setup.'
    },
    {
      q: 'Do I need to be over 18 to enter?',
      a: 'Yes. You must be 18 or over to enter. We may request age verification. If an entry is found to be ineligible, the competition may be redrawn in line with our Terms and Conditions.'
    }
  ]

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg" style={{ color: '#78716c' }}>
              Everything you need to know about entering BabyBets competitions.
            </p>
          </div>

          <div
            className="rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12"
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
          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: '#78716c' }}>
              Still have questions? We're here to help!
            </p>
            <a
              href="mailto:hello@babybets.co.uk"
              className="inline-flex items-center gap-2 font-bold text-sm sm:text-base transition-colors cursor-pointer"
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
