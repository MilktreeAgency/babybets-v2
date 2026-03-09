import { ShieldCheck, Gift, Trophy, Clock } from 'lucide-react'

const trustItems = [
  { icon: Gift, title: "Premium Prizes", desc: "Daily and weekly giveaways" },
  { icon: ShieldCheck, title: "Fair & Transparent", desc: "Clear terms on every competition" },
  { icon: Trophy, title: "Real Winners", desc: "Prizes delivered to your door" },
  { icon: Clock, title: "Guaranteed Draw", desc: "Draws happen regardless of ticket sales" },
]

// Duplicate items to create seamless infinite loop
const marqueeItems = [...trustItems, ...trustItems]

export default function TrustStatsSection() {
  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      {/* Desktop — static grid, no dividers */}
      <div className="hidden md:grid md:grid-cols-4 max-w-[1400px] mx-auto">
        {trustItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 px-8 py-8 lg:px-10">
            <div
              className="shrink-0 p-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(254, 208, 185, 0.25)', color: '#151e20' }}
            >
              <item.icon size={22} />
            </div>
            <div>
              <h4 className="font-bold text-sm lg:text-base leading-tight mb-0.5" style={{ color: '#151e20' }}>
                {item.title}
              </h4>
              <p className="text-xs lg:text-sm leading-relaxed" style={{ color: '#78716c' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile & tablet — seamless infinite marquee */}
      <div className="md:hidden relative py-4">
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #ffffff, transparent)' }}
        />

        <div className="flex animate-scroll" style={{ width: 'max-content' }}>
          {marqueeItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-6">
              <div
                className="shrink-0 p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(254, 208, 185, 0.25)', color: '#151e20' }}
              >
                <item.icon size={18} />
              </div>
              <div className="whitespace-nowrap">
                <span className="font-bold text-sm" style={{ color: '#151e20' }}>{item.title}</span>
                <span className="text-xs ml-1.5" style={{ color: '#78716c' }}>— {item.desc}</span>
              </div>
              {/* Pink dot separator */}
              <span className="ml-4 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#FED0B9' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
