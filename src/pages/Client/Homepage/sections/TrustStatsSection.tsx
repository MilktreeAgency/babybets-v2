import { Zap } from 'lucide-react'

export default function TrustStatsSection() {
  const trustItems = [
    {
      icon: Zap,
      title: "Instant Wins",
      desc: "Win prizes immediately when you enter"
    },
    {
      icon: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M8 8V5a4 4 0 0 1 8 0v3" />
          <circle cx="12" cy="15" r="1" />
        </svg>
      ),
      title: "1,900+ Prizes",
      desc: "Available in our current competition"
    },
    {
      icon: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      title: "Guaranteed Draw",
      desc: "End prize draw regardless of sales"
    },
    {
      icon: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
      title: "Real Winners",
      desc: "Prizes delivered free to your door"
    },
  ]

  return (
    <div className="w-full border-t" style={{ backgroundColor: '#ffffff', borderColor: '#f0e0ca' }}>
      {/* Desktop - Grid Layout */}
      <div className="hidden md:grid md:grid-cols-4 max-w-[1400px] mx-auto">
        {trustItems.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-4"
            style={{
              borderRightWidth: idx < trustItems.length - 1 ? '1px' : '0',
              borderColor: '#f0e0ca'
            }}
          >
            <div
              className="p-4 rounded-full mb-4"
              style={{ backgroundColor: '#FBEFDF', color: '#496B71' }}
            >
              <item.icon />
            </div>
            <h4 className="font-bold text-lg mb-2" style={{ color: '#151e20' }}>
              {item.title}
            </h4>
            <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: '#78716c' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile - Horizontal Scroll */}
      <div
        className="md:hidden flex overflow-x-auto gap-4 px-4 py-6 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {trustItems.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-4 min-w-[200px] rounded-xl"
            style={{ backgroundColor: '#FBEFDF' }}
          >
            <div
              className="p-4 rounded-full mb-3"
              style={{ backgroundColor: 'white', color: '#496B71' }}
            >
              <item.icon />
            </div>
            <h4 className="font-bold text-base mb-2" style={{ color: '#151e20' }}>
              {item.title}
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
