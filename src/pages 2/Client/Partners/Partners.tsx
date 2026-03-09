import { useState, useEffect } from 'react'
import { Check, Users, Gift, PoundSterling, Target, Rocket, Ticket, ClipboardList, Search, UserCheck, Share2, Video, Trophy, Sparkles, ArrowRight } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import PartnerApplicationForm from '@/pages/Client/PartnerApplication/PartnerApplicationForm'
import { supabase } from '@/lib/supabase'

export default function Partners() {
  const [salesVolume, setSalesVolume] = useState(2500)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stats, setStats] = useState({
    creatorsRegistered: 0,
    avgCommissionPaid: 0,
    liveCompetitions: 0
  })

  const getCommissionRate = (amount: number): number => {
    if (amount < 1000) return 0.10
    if (amount < 3000) return 0.15
    if (amount < 5000) return 0.20
    return 0.25
  }

  const rate = getCommissionRate(salesVolume)
  const earnings = salesVolume * rate

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: creatorsCount } = await supabase
          .from('influencers')
          .select('*', { count: 'exact', head: true })

        const { count: competitionsCount } = await supabase
          .from('competitions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        const { data: salesData } = await supabase
          .from('influencer_sales')
          .select('commission_pence')

        let avgCommission = 0
        if (salesData && salesData.length > 0) {
          const totalCommission = salesData.reduce((sum, sale) => sum + (sale.commission_pence || 0), 0)
          avgCommission = Math.round(totalCommission / salesData.length)
        }

        setStats({
          creatorsRegistered: creatorsCount || 0,
          avgCommissionPaid: avgCommission,
          liveCompetitions: competitionsCount || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      {/* ── HERO — teal ───────────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-24 overflow-hidden" style={{ backgroundColor: '#496B71' }}>
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.1)' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.07)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: 'rgba(254,208,185,0.2)', color: '#FED0B9', borderWidth: '1px', borderColor: 'rgba(254,208,185,0.3)' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest">Mum Creator Program</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1]"
            style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
          >
            Earn More & Grow Faster<br />With BabyBets
          </h1>

          <p className="text-base sm:text-lg md:text-xl mb-4 max-w-2xl mx-auto leading-relaxed px-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
            The partnership program paying more than TikTok Shop. Join the UK's fastest growing family prize platform and turn your content into cash.
          </p>

          <p className="font-bold text-xs sm:text-sm uppercase tracking-widest mb-8 animate-pulse" style={{ color: '#FED0B9' }}>
            Limited Spaces Available for Q1 2026
          </p>

          {/* Video */}
          <div
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto"
            style={{ aspectRatio: '16/9', backgroundColor: '#151e20', borderWidth: '4px', borderColor: 'rgba(255,255,255,0.15)' }}
          >
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

      {/* ── INTRO — cream ─────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20" style={{ backgroundColor: '#fffbf7' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: 'rgba(254,208,185,0.4)', color: '#151e20' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest">About the Program</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight"
            style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
          >
            BabyBets Influencer & Creator Partnership
          </h2>
          <p className="text-base sm:text-lg leading-relaxed mb-5" style={{ color: '#78716c' }}>
            BabyBets is a brand-new UK competition and raffle platform created specifically for mums and families.
            We give away the prizes parents actually want — pram bundles, nursery makeovers, car seats, toys, spa breaks, family holidays and more.
          </p>
          <p className="font-medium mb-8 text-sm sm:text-base" style={{ color: '#496B71' }}>
            We are building a partnership network of mum creators, influencers and everyday mums who want to:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
            {[
              'Earn from home',
              'Support other mums',
              'Be part of something new and exciting',
              'Grow with us as we scale',
              'Get rewarded for creating authentic content'
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#e7e5e4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#496B71' }}
                >
                  <Check size={12} strokeWidth={3} color="white" />
                </div>
                <span className="font-bold text-xs sm:text-sm" style={{ color: '#151e20' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS STEPS — teal ─────────────────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20 relative overflow-hidden" style={{ backgroundColor: '#496B71' }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.08)' }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(254,208,185,0.06)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(254,208,185,0.2)', color: '#FED0B9', borderWidth: '1px', borderColor: 'rgba(254,208,185,0.3)' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest">How It Works</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
            >
              Earn commission from every ticket sale
            </h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Join the BabyBets Creator Programme and earn commission when your audience enters through your link.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
            {[
              { num: 1, icon: ClipboardList, title: 'Step 1: Apply', desc: 'Fill out the quick form to apply to become a BabyBets Creator.' },
              { num: 2, icon: Search, title: 'Step 2: Review', desc: "We'll review your social media accounts and content to make sure you're a good fit for the brand." },
              { num: 3, icon: UserCheck, title: 'Step 3: Get Approved', desc: "If selected, you'll create your profile on our site and receive your unique tracking link." },
              { num: 4, icon: Share2, title: 'Step 4: Start Earning', desc: 'Share our competitions on your social channels by creating content and earn commission on every ticket sale made through your link.' },
            ].map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="relative">
                <div
                  className="absolute -top-3 left-5 z-10 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                >
                  Step {num}
                </div>
                <div
                  className="rounded-2xl p-5 sm:p-6 h-full flex flex-col pt-8 transition-all duration-300 hover:-translate-y-1"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(254,208,185,0.2)', color: '#FED0B9' }}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3
                    className="text-base sm:text-lg font-bold mb-2"
                    style={{ fontFamily: "'Fraunces', serif", color: 'white' }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 text-base sm:text-lg font-bold rounded-xl transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: '#FED0B9', color: '#151e20', boxShadow: '0 8px 32px rgba(254,208,185,0.3)' }}
              onClick={() => setIsModalOpen(true)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc4a6'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Apply Now
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS — pink ──────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20" style={{ backgroundColor: '#FED0B9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: 'rgba(73,107,113,0.15)', color: '#496B71' }}
          >
            <Ticket size={13} />
            <span className="text-xs font-bold uppercase tracking-widest">Affiliate Program</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-10 sm:mb-12 tracking-tight"
            style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
          >
            Earn £££ from Every Ticket Sale
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8">
            {[
              { label: 'Creators Registered', val: stats.creatorsRegistered.toLocaleString(), icon: Users },
              { label: 'Average Commission Paid', val: `£${stats.avgCommissionPaid.toLocaleString()}`, icon: PoundSterling },
              { label: 'Live Competitions', val: stats.liveCompetitions.toString(), icon: Gift }
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#496B71', color: 'white' }}
                >
                  <stat.icon size={22} strokeWidth={1.8} />
                </div>
                <div className="text-4xl sm:text-5xl font-bold mb-1.5" style={{ color: '#151e20' }}>{stat.val}</div>
                <div className="text-sm font-medium" style={{ color: '#4a4a4a' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="text-sm sm:text-base" style={{ color: 'rgba(21,30,32,0.65)' }}>
            Come & Join The BabyBets Brand - Start Earning Today From Your Existing Content
          </p>
        </div>
      </section>

      {/* ── CALCULATOR — cream (untouched internals) ──────────────────────── */}
      <section className="py-14 sm:py-16 md:py-20 lg:py-24" style={{ backgroundColor: '#fffbf7' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(254,208,185,0.4)', color: '#151e20' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest">Earnings Calculator</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Calculate Your Earnings
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>See what you could earn with BabyBets</p>
          </div>

          <div
            className="rounded-3xl shadow-xl border p-6 sm:p-8 md:p-12"
            style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}
          >
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
                      className="p-2 sm:p-2.5 md:p-3 rounded-xl transition border-2"
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
              <div
                className="absolute inset-0 flex items-end justify-center pb-6 sm:pb-8"
                style={{ background: 'linear-gradient(to top, rgba(73, 107, 113, 0.85), transparent)' }}
              >
                <button
                  className="px-7 py-3 text-sm sm:text-base font-bold rounded-xl cursor-pointer transition-all duration-300"
                  style={{ backgroundColor: '#FED0B9', color: '#151e20' }}
                  onClick={() => setIsModalOpen(true)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc4a6' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FED0B9' }}
                >
                  Start Earning Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIERS — light teal tint (untouched internals) ─────────────────── */}
      <section className="py-14 sm:py-16 md:py-20" style={{ backgroundColor: 'rgba(73, 107, 113, 0.05)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(254,208,185,0.4)', color: '#151e20' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest">Partnership Tiers</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
            >
              Choose Your Path
            </h2>
          </div>

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
                For established creators with 50k+ followers. Best suited to high-view creators and mum/parent content creators with strong reach and an engaged UK audience.
              </p>

              <div className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-7 md:mb-8 shadow-sm" style={{ backgroundColor: 'white' }}>
                <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#151e20' }}>10–25% Commission on Ticket Sales</div>
                <p className="text-xs sm:text-sm" style={{ color: '#78716c' }}>
                  Earn a percentage of ticket sales generated through your unique link. Add it to your bio, share in Stories, and tag BabyBets in your content.
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                {[
                  { icon: PoundSterling, text: 'Highest Earning Potential', desc: 'Tiered commission up to 25% based on ticket sales generated through your link.' },
                  { icon: Video, text: 'Get Paid Per 1,000 Views (5k+ views)', desc: 'Earn an additional £1 per 1,000 views on approved videos (capped at £1,000 per video). Upload videos in your portal for approval and payout.' },
                  { icon: Gift, text: 'Branded Collabs & Custom Prize Drops', desc: 'Access bespoke collaborations, including prizes tailored to your audience and a dedicated giveaway page.' },
                  { icon: Sparkles, text: 'Host Live Draws', desc: 'Opportunity to host BabyBets live draws in person for an additional fee.' },
                  { icon: Trophy, text: 'Exclusive Monthly Rewards', desc: 'Monthly rewards for top-performing creators based on views and ticket sales.' }
                ].map((item, i) => (
                  <li key={i} className="text-xs sm:text-sm" style={{ color: '#78716c' }}>
                    <div className="flex gap-2 items-start mb-1">
                      <div className="shrink-0 mt-0.5" style={{ color: '#FCA47E' }}>
                        <item.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <span className="font-bold" style={{ color: '#151e20' }}>{item.text}</span>
                    </div>
                    <p className="ml-6 sm:ml-7">{item.desc}</p>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl p-3 sm:p-4 text-[10px] sm:text-xs mb-6 sm:mb-7 md:mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', color: '#78716c' }}>
                <p className="font-bold mb-2 uppercase tracking-wide opacity-50">Requirements</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Typically 50,000+ followers across all platforms</li>
                  <li>Consistent engagement and high-quality content</li>
                  <li>UK-based audience</li>
                </ul>
              </div>

              <button
                className="w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-bold rounded-xl cursor-pointer transition-all duration-300"
                style={{ backgroundColor: '#496B71', color: 'white' }}
                onClick={() => setIsModalOpen(true)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a565a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#496B71' }}
              >
                Apply as a Brand Ambassador
              </button>
            </div>

            {/* Affiliate */}
            <div className="rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 border order-2 md:order-1" style={{ backgroundColor: 'white', borderColor: '#e7e5e4' }}>
              <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                Affiliate Partner
              </h3>
              <p className="mb-6 sm:mb-7 md:mb-8 text-xs sm:text-sm" style={{ color: '#78716c' }}>
                For growing creators who want to start earning by sharing BabyBets competitions. Perfect for mums, dads, and smaller creators building an engaged UK audience.
              </p>

              <div className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-7 md:mb-8 border" style={{ backgroundColor: '#f5f5f4', borderColor: '#e7e5e4' }}>
                <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#151e20' }}>10–20% Commission on Ticket Sales</div>
                <p className="text-xs sm:text-sm" style={{ color: '#78716c' }}>
                  Earn a percentage of ticket sales generated through your unique link. Share competitions in your content, add your link to your bio, and post in Stories.
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                {[
                  { icon: PoundSterling, text: 'Earn Commission on Every Sale', desc: 'Get paid for every ticket purchased through your unique tracking link.' },
                  { icon: Video, text: 'Get Paid Per 1,000 Views (2k+ views)', desc: 'Earn 50p per 1,000 views on approved videos (capped at £200 per video). Upload videos in your portal for approval and payout.' },
                  { icon: Sparkles, text: 'Go Live for Extra Rewards', desc: 'Go Live on Instagram or TikTok promoting BabyBets competitions and earn an additional fee.' },
                  { icon: Target, text: 'Track Clicks, Sales & Payouts', desc: 'Simple dashboard so you can see performance and earnings in real time.' },
                  { icon: Trophy, text: 'Exclusive Monthly Rewards', desc: 'Top affiliates can win additional monthly prizes and bonuses.' },
                  { icon: Rocket, text: 'Clear Path to Brand Ambassador', desc: 'As your audience grows, you can apply to move up to Brand Ambassador.' }
                ].map((item, i) => (
                  <li key={i} className="text-xs sm:text-sm" style={{ color: '#78716c' }}>
                    <div className="flex gap-2 items-start mb-1">
                      <div className="shrink-0 mt-0.5" style={{ color: '#496B71' }}>
                        <item.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <span className="font-bold" style={{ color: '#151e20' }}>{item.text}</span>
                    </div>
                    <p className="ml-6 sm:ml-7">{item.desc}</p>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl p-3 sm:p-4 text-[10px] sm:text-xs mb-6 sm:mb-7 md:mb-8" style={{ backgroundColor: '#f5f5f4', color: '#78716c' }}>
                <p className="font-bold mb-2 uppercase tracking-wide opacity-50">Requirements</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>1,000+ followers on any platform</li>
                  <li>Active, engaged UK audience</li>
                  <li>Genuine interest in parenting/family content</li>
                </ul>
              </div>

              <button
                className="w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-bold rounded-xl border-2 cursor-pointer transition-colors hover:bg-gray-50"
                style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                onClick={() => setIsModalOpen(true)}
              >
                Join the Affiliate Programme
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── AS SEEN IN — teal ─────────────────────────────────────────────── */}
      <section className="py-12 sm:py-14 md:py-16 relative overflow-hidden" style={{ backgroundColor: '#496B71' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-7" style={{ color: 'rgba(254,208,185,0.7)' }}>
            As Seen In
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12" style={{ opacity: 0.6 }}>
            <span className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: 'white' }}>Mama</span>
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight" style={{ color: 'white' }}>netmums</span>
            <span className="text-sm sm:text-base md:text-lg italic" style={{ fontFamily: "'Fraunces', serif", color: 'white' }}>MadeForMums</span>
            <span className="text-base sm:text-lg md:text-xl font-black uppercase" style={{ color: 'white' }}>DAILY EXPRESS</span>
            <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: 'white' }}>FamilyFirst</span>
          </div>
        </div>
      </section>

      {/* ── CONTACT STRIP — pink ──────────────────────────────────────────── */}
      <section className="py-10 sm:py-12 text-center px-4 sm:px-6" style={{ backgroundColor: '#FED0B9' }}>
        <p className="text-sm sm:text-base font-medium" style={{ color: '#151e20' }}>
          Have questions?{' '}
          <a
            href="mailto:sarah@babybets.co.uk"
            className="font-bold underline cursor-pointer transition-opacity hover:opacity-70"
            style={{ color: '#496B71' }}
          >
            Contact our partnership team.
          </a>
        </p>
      </section>

      <Footer />

      <PartnerApplicationForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
