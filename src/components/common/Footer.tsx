import { Link } from 'react-router-dom'
import { Instagram, Facebook, MonitorPlay, Mail, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer
      className="relative pt-[85px]"
      style={{
        backgroundImage: 'url(/bg_footer_top.png)',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: '-160px top'
      }}
    >
      <div
        className="px-6"
        style={{
          backgroundColor: '#124c4b'
        }}
      >
        <div className="max-w-[1300px] mx-auto">
          {/* Main Footer Content */}
          <div className="pt-[60px] md:pt-[100px] pb-[30px] md:pb-[60px]">
            <div className="flex flex-wrap -mx-4">
              {/* Logo & Description - 32% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[32%] px-4 mb-[30px]">
                <div className="md:pr-[45px] md:pb-[100px]">
                  <div className="mb-6">
                    <img
                      src="/babybets-logo.png"
                      alt="babybets"
                      className="h-[42px] brightness-0 invert"
                      style={{ filter: 'brightness(0) invert(1)', width: '165px' }}
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#ffffffb3' }}>
                    Shop Now and Let Us Make Your <br className="hidden md:block" />
                    Parenting Journey a Breeze
                  </p>

                  {/* Social Links */}
                  <div className="flex gap-3 mt-6">
                    <a
                      href="https://www.instagram.com/babybetsofficial/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      aria-label="Follow BabyBets on Instagram"
                    >
                      <Instagram size={18} color="#ffffff" />
                    </a>
                    <a
                      href="https://www.facebook.com/babybetsofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      aria-label="Follow BabyBets on Facebook"
                    >
                      <Facebook size={18} color="#ffffff" />
                    </a>
                    <a
                      href="https://www.tiktok.com/@babybetsofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
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
                <h3 className="text-base font-medium mb-6 text-white">Competitions</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/competitions?cat=nursery" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Nursery & Gear
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?cat=toys" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Tech & Toys
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?cat=cash" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Tax Free Cash
                    </Link>
                  </li>
                  <li>
                    <Link to="/competitions?filter=instant" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Instant Wins
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://www.facebook.com/babybetsofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-normal transition-opacity hover:opacity-80 inline-flex items-center gap-2"
                      style={{ color: '#ffffff' }}
                    >
                      <MonitorPlay size={16} aria-hidden="true" />
                      Watch Live Draws
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support & Trust - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-medium mb-6 text-white">Support & Trust</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/how-it-works" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      How it Works
                    </Link>
                  </li>
                  <li>
                    <Link to="/partners" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Influencer Program
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/privacy" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/terms" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/terms" className="text-[14px] font-normal transition-opacity hover:opacity-80 underline" style={{ color: '#ffffff' }}>
                      Free Postal Entry
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Get in Touch - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-medium mb-6 text-white">Get in Touch</h3>
                <p className="text-[14px] mb-4" style={{ color: '#ffffffb3' }}>
                  Need help? Our parent support team is here Mon-Fri.
                </p>
                <a
                  href="mailto:hello@babybets.co.uk"
                  className="inline-flex items-center text-[14px] font-semibold text-white hover:opacity-80 transition-opacity"
                >
                  <Mail size={16} className="mr-2" aria-hidden="true" />
                  hello@babybets.co.uk
                </a>

                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#ffffffb3' }}>
                    <ShieldCheck size={16} aria-hidden="true" />
                    <span>Secure SSL Encrypted Checkout</span>
                  </div>
                </div>
              </div>

              {/* Categories - 17% */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-[17%] px-4 mb-[30px]">
                <h3 className="text-base font-medium mb-6 text-white">Information</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/about" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/account" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/account?tab=orders" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      Order History
                    </Link>
                  </li>
                  <li>
                    <Link to="/account?tab=wallet" className="text-[14px] font-normal transition-opacity hover:opacity-80" style={{ color: '#ffffff' }}>
                      My Wallet
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright & Company Info */}
          <div
            className="py-[41px] text-center md:text-left"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffffb3' }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm">
                Copyright © {new Date().getFullYear()} <strong style={{ color: '#fff' }}>BabyBets</strong> All Rights Reserved.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span>Registered in UK: 12345678</span>
                <Link to="/admin" className="opacity-40 hover:opacity-100 transition-opacity">Admin</Link>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] max-w-2xl mx-auto md:mx-0 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
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
