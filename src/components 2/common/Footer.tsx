import { Link } from 'react-router-dom'
import { Instagram, Facebook, Mail, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative" style={{ backgroundColor: '#4a6b71' }}>
      <div className="px-6">
        <div className="max-w-[1300px] mx-auto">
          {/* Main Footer Content */}
          <div className="pt-[60px] md:pt-[100px] pb-[30px] md:pb-[60px]">
            <div className="flex flex-wrap -mx-4">
              {/* Logo & Description - 32% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[32%] px-4 mb-[30px]">
                <div className="md:pr-[45px] md:pb-[100px]">
                  <div className="mb-6">
                    <img
                      src="/baby-bets-footer-logo.png"
                      alt="BabyBets"
                      className="h-[52px] object-contain"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#e1eaec' }}>
                    BabyBets is a prize platform built for parents. Enter for the chance to win premium baby and toddler prizes, plus cash prizes, with clear odds and real winners.
                  </p>

                  {/* Social Links */}
                  <div className="flex gap-3 mt-6">
                    <a
                      href="https://www.instagram.com/babybetsofficial/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                      aria-label="Follow BabyBets on Instagram"
                    >
                      <Instagram size={18} color="#ffffff" />
                    </a>
                    <a
                      href="https://www.facebook.com/babybetsofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                      aria-label="Follow BabyBets on Facebook"
                    >
                      <Facebook size={18} color="#ffffff" />
                    </a>
                    <a
                      href="https://www.tiktok.com/@babybetsofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                      aria-label="Follow BabyBets on TikTok"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Competitions - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-bold mb-6" style={{ color: '#FED0B9', fontFamily: "'Fraunces', serif" }}>Competitions</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/competitions?cat=toys" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Toys & Tech
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?cat=nursery" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Baby & Nursery
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?cat=cash" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Cash
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?cat=travel" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Travel & Getaways
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?filter=instant" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Instant Wins
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support & Trust - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-bold mb-6" style={{ color: '#FED0B9', fontFamily: "'Fraunces', serif" }}>Support & Trust</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/how-it-works" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      How it Works
                    </Link>
                  </li>
                  <li>
                    <Link to="/partners" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Influencer Program
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/free-postal-entry" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Free Postal Entry
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/website-terms" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Website Terms of Use
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/terms" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/privacy" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/acceptable-use" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Acceptable Use Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Categories - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-bold mb-6" style={{ color: '#FED0B9', fontFamily: "'Fraunces', serif" }}>Information</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/about" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/account" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/account?tab=orders" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      Order History
                    </Link>
                  </li>
                  <li>
                    <Link to="/account?tab=wallet" className="cursor-pointer text-[14px] font-normal transition-colors" style={{ color: '#e1eaec' }} onMouseEnter={e => (e.currentTarget.style.color = '#FED0B9')} onMouseLeave={e => (e.currentTarget.style.color = '#e1eaec')}>
                      My Wallet
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Get in Touch - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-bold mb-6" style={{ color: '#FED0B9', fontFamily: "'Fraunces', serif" }}>Get in Touch</h3>
                <p className="text-[14px] mb-4" style={{ color: '#e1eaec' }}>
                  Need help? Our parent support team is here Mon-Fri.
                </p>
                <a
                  href="mailto:hello@babybets.co.uk"
                  className="cursor-pointer inline-flex items-center text-[14px] font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: '#FED0B9' }}
                >
                  <Mail size={16} className="mr-2" aria-hidden="true" />
                  hello@babybets.co.uk
                </a>

                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#e1eaec' }}>
                    <ShieldCheck size={16} aria-hidden="true" />
                    <span>Secure SSL Encrypted Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright & Company Info */}
          <div
            className="py-[41px] text-center md:text-left"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', color: '#e1eaec' }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm">
                Copyright © {new Date().getFullYear()} <strong style={{ color: '#ffffff' }}>BabyBets</strong> All Rights Reserved.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span>Registered in UK: 16963672</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] max-w-2xl mx-auto md:mx-0 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                BabyBets allows you to enter competitions to win prizes. This is a prize draw site, not a lottery. Please play responsibly.
                <br />
                Free postal entry method is available for all competitions. See terms for details. 18+ UK Residents Only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
