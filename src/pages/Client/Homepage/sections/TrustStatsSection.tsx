import { ShieldCheck, Gift, Trophy, Clock } from 'lucide-react'

export default function TrustStatsSection() {
  const trustItems = [
    {
      icon: Gift,
      title: "Premium Prizes",
      desc: "Daily and weekly giveaways. Enter any live competition on the site for your chance to win."
    },
    {
      icon: ShieldCheck,
      title: "Fair & Transparent Competitions",
      desc: "Every competition clearly shows how it's run, when it closes, and how the winner is chosen. Whether it's an instant win, an automated draw, or a live draw, it's all laid out upfront so you know exactly what you're entering."
    },
    {
      icon: Trophy,
      title: "Real Winners",
      desc: "Winners every day. Watch our live draws online. Prizes delivered to your door."
    },
    {
      icon: Clock,
      title: "Guaranteed Draw",
      desc: "The main prize draw happens regardless of ticket sales. Amazing chances to win."
    },
  ]

  return (
    <div className="w-full border-t" style={{ backgroundColor: '#ffffff', borderColor: '#f0e0ca' }}>
      {/* Desktop/Tablet - Grid Layout */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 max-w-[1400px] mx-auto">
        {trustItems.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-4 sm:p-5 md:p-4"
            style={{
              borderRightWidth: (idx < trustItems.length - 1 && idx % 2 === 0 && window.innerWidth < 768) || (idx < trustItems.length - 1 && window.innerWidth >= 768) ? '1px' : '0',
              borderBottomWidth: idx < 2 && window.innerWidth < 768 ? '1px' : '0',
              borderColor: '#f0e0ca'
            }}
          >
            <div
              className="p-3 sm:p-4 rounded-full mb-3 sm:mb-4"
              style={{ backgroundColor: '#FBEFDF', color: '#496B71' }}
            >
              <item.icon />
            </div>
            <h4 className="font-bold text-base sm:text-lg mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
              {item.title}
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed max-w-[220px]" style={{ color: '#78716c' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile - Horizontal Scroll */}
      <div
        className="sm:hidden flex overflow-x-auto gap-3 px-4 py-5 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {trustItems.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-4 min-w-[180px] rounded-xl"
            style={{ backgroundColor: '#FBEFDF' }}
          >
            <div
              className="p-3 rounded-full mb-3"
              style={{ backgroundColor: 'white', color: '#496B71' }}
            >
              <item.icon />
            </div>
            <h4 className="font-bold text-sm mb-1.5" style={{ color: '#151e20' }}>
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
