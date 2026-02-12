import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, TrendingUp, Users, Gift, PoundSterling, Target, Rocket, ShieldCheck, Ticket, Star } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import PartnerApplicationForm from '@/pages/Client/PartnerApplication/PartnerApplicationForm'

export default function Partners() {
  const [salesVolume, setSalesVolume] = useState(2500)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate commission based on tiered rates
  const getCommissionRate = (amount: number): number => {
    if (amount < 1000) return 0.10
    if (amount < 3000) return 0.15
    if (amount < 5000) return 0.20
    return 0.25
  }

  const rate = getCommissionRate(salesVolume)
  const earnings = salesVolume * rate

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4 pointer-events-none" style={{ backgroundColor: 'rgba(254, 208, 185, 0.4)' }} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full blur-[80px] -z-10 -translate-x-1/3 pointer-events-none" style={{ backgroundColor: 'rgba(73, 107, 113, 0.3)' }} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block mb-4 sm:mb-5 md:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold tracking-widest shadow-sm" style={{ backgroundColor: '#FED0B9', color: '#151e20' }}>
            MUM CREATOR PROGRAM
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 tracking-tight leading-[1.1]" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
            Earn More & Grow Faster<br /> With <span className="relative inline-block" style={{ color: '#496B71' }}>
              BabyBets
              <span className="absolute bottom-2 left-0 w-full h-3 rounded-full -z-10" style={{ backgroundColor: 'rgba(254, 208, 185, 0.3)' }}></span>
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-4" style={{ color: '#78716c' }}>
            The partnership program paying more than TikTok Shop. Join the UK's fastest growing family prize platform and turn your content into cash.
          </p>

          <p className="font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 sm:mb-7 md:mb-8 animate-pulse" style={{ color: '#dc2626' }}>
            Limited Spaces Available for Q1 2026
          </p>

          {/* Video */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 sm:border-6 md:border-8 border-white aspect-video max-w-4xl mx-auto" style={{ backgroundColor: '#151e20' }}>
            <iframe
              src="https://player.vimeo.com/video/1138594596?badge=0&autopause=0&player_id=0&app_id=58479"
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
              title="BabyBets Partnership Video"
            />
          </div>
        </div>
      </section>

      {/* Spots Tracker */}
      <section className="py-6 sm:py-8 border-y" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide" style={{ color: '#151e20' }}>Brand Ambassador Spots</span>
            <span className="text-xs sm:text-sm font-bold" style={{ color: '#dc2626' }}>30 / 50 Taken</span>
          </div>
          <div className="w-full h-3 sm:h-4 rounded-full overflow-hidden border" style={{ backgroundColor: '#f5f5f4', borderColor: '#e7e5e4' }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '60%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full relative"
              style={{ background: 'linear-gradient(to right, #FED0B9, #FCA47E)' }}
            >
              <div className="absolute inset-0 bg-white/20"></div>
            </motion.div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ color: '#496B71', backgroundColor: 'rgba(73, 107, 113, 0.1)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#496B71' }}></span> Filling fast
            </span>
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <button
              className="w-full sm:w-auto px-8 sm:px-10 md:px-12 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl shadow-xl transform hover:-translate-y-1 transition-all cursor-pointer"
              style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
              onClick={() => setIsModalOpen(true)}
            >
              Apply Now
            </button>
          </div>
        </div>
      </section>

      {/* Intro Text */}
      <section className="py-12 sm:py-16 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 md:mb-6 tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
          BabyBets Influencer & Creator Partnership
        </h2>
        <p className="text-base sm:text-lg leading-relaxed mb-6 sm:mb-7 md:mb-8" style={{ color: '#78716c' }}>
          BabyBets is a brand-new UK competition and raffle platform created specifically for mums and families.
          We give away the prizes parents actually want — pram bundles, nursery makeovers, car seats, toys, spa breaks, family holidays and more.
        </p>
        <p className="font-medium mb-8 sm:mb-9 md:mb-10 text-sm sm:text-base" style={{ color: '#496B71' }}>
          We are building a partnership network of mum creators, influencers and everyday mums who want to:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-left max-w-2xl mx-auto">
          {[
            'Earn from home',
            'Support other mums',
            'Be part of something new and exciting',
            'Grow with us as we scale',
            'Get rewarded for creating authentic content'
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl shadow-sm border" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
              <div className="p-1 rounded-full shrink-0" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' }}>
                <Check size={12} strokeWidth={3} className="sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="font-bold text-xs sm:text-sm" style={{ color: '#151e20' }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-12 sm:py-16 md:py-20 text-white relative overflow-hidden" style={{ backgroundColor: '#496B71' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-5 md:mb-6" style={{ backgroundColor: '#FED0B9', color: '#151e20' }}>
            <Ticket size={14} className="sm:w-4 sm:h-4" /> Affiliate Program
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-10 sm:mb-12 md:mb-16 tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Earn £££ from Every Ticket Sale
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {[
              { label: 'Creators Registered', val: '774', icon: Users },
              { label: 'Average Commission Paid', val: '£652', icon: PoundSterling },
              { label: 'Live Competitions', val: '19', icon: Gift }
            ].map((stat, i) => (
              <div key={i} className="backdrop-blur-md rounded-[2.5rem] p-6 sm:p-7 md:p-8 border hover:bg-white/10 transition duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="mb-3 sm:mb-4 flex justify-center" style={{ color: '#FED0B9' }}>
                  <stat.icon size={32} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
                </div>
                <div className="text-4xl sm:text-5xl font-bold mb-1.5 sm:mb-2">{stat.val}</div>
                <div className="font-medium text-base sm:text-lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 sm:mt-10 md:mt-12 text-base sm:text-lg px-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Come & Join The BabyBets Brand - Start Earning Today From Your Existing Content
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-[3rem] shadow-xl border p-6 sm:p-8 md:p-12 lg:p-16 text-center" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Calculate Your Earnings
            </h2>
            <p className="text-sm sm:text-base mb-8 sm:mb-10 md:mb-12" style={{ color: '#78716c' }}>See what you could earn with BabyBets</p>

            <div className="rounded-3xl p-6 sm:p-7 md:p-8 mb-8 sm:mb-10 border" style={{ backgroundColor: '#f5f5f4', borderColor: '#e7e5e4' }}>
              <div className="mb-6 sm:mb-7 md:mb-8">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: '#78716c' }}>
                  Monthly sales through your links
                </p>
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: '#151e20' }}>£{salesVolume.toLocaleString()}</p>
              </div>

              <div className="relative mb-4 sm:mb-5 md:mb-6 pt-4 sm:pt-5 md:pt-6">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={salesVolume}
                  onChange={(e) => setSalesVolume(parseInt(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer transition-all"
                  style={{ backgroundColor: '#e7e5e4', accentColor: '#FED0B9' }}
                />
                <div className="flex justify-between text-xs font-bold mt-4" style={{ color: '#78716c' }}>
                  <span>£100</span>
                  <span>£10,000</span>
                </div>
              </div>

              <div className="border-t pt-6 sm:pt-7 md:pt-8" style={{ borderColor: '#e7e5e4' }}>
                <p className="text-4xl sm:text-5xl font-bold mb-1.5 sm:mb-2" style={{ color: '#FCA47E' }}>£{earnings.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs" style={{ color: '#78716c' }}>
                  Your monthly earnings at {(rate * 100).toFixed(0)}% commission
                </p>
              </div>

              {/* Commission Tier Display */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-6 sm:mt-7 md:mt-8 text-center">
                {[
                  { range: '£0-£999', rate: '10%' },
                  { range: '£1,000-£2,999', rate: '15%' },
                  { range: '£3,000-£4,999', rate: '20%' },
                  { range: '£5,000+', rate: '25%' }
                ].map((tier, i) => {
                  const isActive =
                    (i === 0 && salesVolume < 1000) ||
                    (i === 1 && salesVolume >= 1000 && salesVolume < 3000) ||
                    (i === 2 && salesVolume >= 3000 && salesVolume < 5000) ||
                    (i === 3 && salesVolume >= 5000)
                  return (
                    <div
                      key={i}
                      className={`p-2 sm:p-2.5 md:p-3 rounded-xl transition border-2`}
                      style={{
                        backgroundColor: isActive ? 'rgba(73, 107, 113, 0.1)' : '#f5f5f4',
                        borderColor: isActive ? '#496B71' : '#e7e5e4'
                      }}
                    >
                      <p className="text-[10px] sm:text-xs font-medium" style={{ color: isActive ? '#496B71' : '#78716c' }}>
                        {tier.range}
                      </p>
                      <p className="text-base sm:text-lg font-bold" style={{ color: isActive ? '#151e20' : '#78716c' }}>
                        {tier.rate}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden relative h-48 sm:h-56 md:h-64 lg:h-80">
              <img
                src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200"
                className="w-full h-full object-cover"
                alt="Mum and baby"
              />
              <div className="absolute inset-0 flex items-end justify-center pb-6 sm:pb-8" style={{ background: 'linear-gradient(to top, rgba(73, 107, 113, 0.8), transparent)' }}>
                <button
                  className="px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl shadow-lg cursor-pointer"
                  style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  Start Earning Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Tiers */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: 'rgba(73, 107, 113, 0.05)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 md:gap-8 items-start">
            {/* Brand Ambassador */}
            <div className="rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 border-2 relative overflow-hidden order-1 md:order-2" style={{ backgroundColor: 'rgba(254, 208, 185, 0.2)', borderColor: '#FED0B9' }}>
              <div className="absolute top-0 right-0 text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-bl-2xl" style={{ backgroundColor: '#FED0B9', color: '#151e20' }}>
                RECOMMENDED
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Brand Ambassador
              </h3>
              <p className="mb-6 sm:mb-7 md:mb-8 text-xs sm:text-sm" style={{ color: '#78716c' }}>
                For established creators with larger, highly engaged audiences.
              </p>

              <div className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-7 md:mb-8 shadow-sm" style={{ backgroundColor: 'white' }}>
                <div className="text-3xl sm:text-4xl font-bold mb-0.5 sm:mb-1" style={{ color: '#151e20' }}>20–25%</div>
                <p className="text-[10px] sm:text-xs font-medium" style={{ color: '#78716c' }}>
                  + £1 CPM on approved videos over 5,000 views (capped per video)
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                {[
                  { icon: Star, text: 'Highest earning potential with tiered commission up to 25%.' },
                  { icon: Gift, text: 'Priority access to our biggest prize drops for your audience.' },
                  { icon: Users, text: 'Closer support from our team on launches, collabs & campaigns.' },
                  { icon: TrendingUp, text: 'Extra £1 per 1,000 views on approved videos (5k+ views).' }
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 sm:gap-3 text-xs sm:text-sm" style={{ color: '#78716c' }}>
                    <div className="shrink-0" style={{ color: '#FCA47E' }}>
                      <item.icon size={16} fill="currentColor" className="opacity-20 sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl p-3 sm:p-4 text-[10px] sm:text-xs mb-6 sm:mb-7 md:mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', color: '#78716c' }}>
                <p className="font-bold mb-2 uppercase tracking-wide opacity-50">Requirements</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Typically 10k+ followers across main platforms</li>
                  <li>Consistent engagement & quality content</li>
                  <li>UK-based audience</li>
                </ul>
              </div>

              <button
                className="w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#496B71', color: 'white' }}
                onClick={() => setIsModalOpen(true)}
              >
                Apply for Ambassador
              </button>
            </div>

            {/* Affiliate */}
            <div className="rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 border order-2 md:order-1" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
              <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Affiliate Programme
              </h3>
              <p className="mb-6 sm:mb-7 md:mb-8 text-xs sm:text-sm" style={{ color: '#78716c' }}>
                For growing creators who want to start earning by sharing our competitions.
              </p>

              <div className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-7 md:mb-8 border" style={{ backgroundColor: '#f5f5f4', borderColor: '#e7e5e4' }}>
                <div className="text-3xl sm:text-4xl font-bold mb-0.5 sm:mb-1" style={{ color: '#151e20' }}>10–15%</div>
                <p className="text-[10px] sm:text-xs font-medium" style={{ color: '#78716c' }}>
                  Tiered by monthly ticket value – the more you sell, the higher your rate.
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                {[
                  { icon: Rocket, text: 'Strong commission on every ticket sold through your custom link.' },
                  { icon: Target, text: 'Ready-to-use content ideas, captions, scripts & assets.' },
                  { icon: TrendingUp, text: 'Tracking dashboard so you can see clicks, sales & payouts.' },
                  { icon: ShieldCheck, text: 'Clear pathway to Brand Ambassador status as you grow.' }
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 sm:gap-3 text-xs sm:text-sm" style={{ color: '#78716c' }}>
                    <div className="shrink-0" style={{ color: '#496B71' }}>
                      <item.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl p-3 sm:p-4 text-[10px] sm:text-xs mb-6 sm:mb-7 md:mb-8" style={{ backgroundColor: '#f5f5f4', color: '#78716c' }}>
                <p className="font-bold mb-2 uppercase tracking-wide opacity-50">Requirements</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>1,000+ followers on any platform</li>
                  <li>Active & engaged UK audience</li>
                  <li>Genuine passion for helping mums</li>
                </ul>
              </div>

              <button
                className="w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-bold rounded-xl border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                onClick={() => setIsModalOpen(true)}
              >
                Join Affiliate Program
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* As Seen In */}
      <section className="py-12 sm:py-16 text-center border-t" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-6 sm:mb-7 md:mb-8" style={{ color: '#78716c' }}>
          As Seen In
        </p>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 opacity-40">
          <span className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>Mama</span>
          <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight" style={{ color: '#dc2626' }}>netmums</span>
          <span className="text-sm sm:text-base md:text-lg italic" style={{ fontFamily: "'Fraunces', serif", color: '#78716c' }}>MadeForMums</span>
          <span className="text-base sm:text-lg md:text-xl font-black uppercase" style={{ color: '#151e20' }}>DAILY EXPRESS</span>
          <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#0284c7' }}>FamilyFirst</span>
        </div>
      </section>

      <section className="py-8 sm:py-10 md:py-12 text-center px-4 sm:px-6" style={{ backgroundColor: 'rgba(73, 107, 113, 0.05)' }}>
        <a href="mailto:hello@babybets.co.uk" className="text-sm sm:text-base font-bold hover:underline cursor-pointer" style={{ color: '#496B71' }}>
          Have questions? Contact our partnership team.
        </a>
      </section>

      <Footer />

      {/* Application Form Modal */}
      <PartnerApplicationForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
