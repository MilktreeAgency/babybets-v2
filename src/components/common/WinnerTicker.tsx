import { useState, useEffect, useRef } from 'react'
import { Trophy, Gift, Wallet, Banknote } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Winner {
  id: string
  display_name: string
  location?: string | null
  prize_name: string
  prize_value_gbp?: number | null
  won_at: string
}

interface WinnerTickerProps {
  speed?: 'slow' | 'normal' | 'fast'
  className?: string
}

const getPrizeIcon = (prizeName: string) => {
  const lower = prizeName.toLowerCase()
  if (lower.includes('credit')) return <Wallet size={14} style={{ color: '#496B71' }} />
  if (lower.includes('cash')) return <Banknote size={14} style={{ color: '#22c55e' }} />
  if (lower.includes('voucher')) return <Gift size={14} style={{ color: '#3b82f6' }} />
  return <Trophy size={14} style={{ color: '#eab308' }} />
}

const getTimeAgo = (dateStr: string) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function WinnerTicker({
  speed = 'normal',
  className = '',
}: WinnerTickerProps) {
  const [winners, setWinners] = useState<Winner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50)
  const tickerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState(0)

  // Fetch recent winners
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('recent_winners_view')
          .select('*')
          .order('won_at', { ascending: false })

        if (error) throw error

        // Set winners from database
        if (data && data.length > 0) {
          setWinners(data as Winner[])
        }
      } catch (error) {
        console.error('Error fetching winners:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWinners()
  }, [])

  useEffect(() => {
    // Set speed based on device and speed prop
    const isMobile = window.innerWidth < 768
    switch (speed) {
      case 'slow':
        setPixelsPerSecond(isMobile ? 30 : 40)
        break
      case 'fast':
        setPixelsPerSecond(isMobile ? 80 : 100)
        break
      default:
        setPixelsPerSecond(isMobile ? 50 : 60)
    }
  }, [speed])

  useEffect(() => {
    // Measure content width for perfect animation
    if (contentRef.current) {
      const width = contentRef.current.offsetWidth
      setContentWidth(width)
    }
  }, [winners])

  // Calculate animation duration based on content width
  const animationDuration = contentWidth > 0 ? contentWidth / pixelsPerSecond : 20

  // Render content - create single winner item component
  const WinnerItem = ({ winner, idx }: { winner: Winner; idx: number }) => (
    <div
      key={`${winner.id}-${idx}`}
      className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 shrink-0"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {getPrizeIcon(winner.prize_name)}
        <span className="font-bold whitespace-nowrap text-sm sm:text-base" style={{ color: '#151e20' }}>
          {winner.display_name}
        </span>
        {winner.location && (
          <span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: '#a8a29e' }}>
            from {winner.location}
          </span>
        )}
      </div>
      <span className="text-sm" style={{ color: '#a8a29e' }}>won</span>
      <span className="font-bold whitespace-nowrap text-sm sm:text-base" style={{ color: '#496B71' }}>
        {winner.prize_name}
      </span>
      {winner.prize_value_gbp && winner.prize_value_gbp >= 50 && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap" style={{ backgroundColor: '#fff0e6', color: '#e86e40' }}>
          £{winner.prize_value_gbp}
        </span>
      )}
      <span className="text-xs whitespace-nowrap" style={{ color: '#a8a29e' }}>
        {getTimeAgo(winner.won_at)}
      </span>
      <span className="mx-2 sm:mx-4" style={{ color: '#e7e5e4' }}>•</span>
    </div>
  )

  // Show nothing while loading
  if (isLoading) {
    return (
      <div className={`overflow-hidden border-y py-3 ${className}`} style={{ backgroundColor: '#fffbf7', borderColor: '#f0e0ca' }}>
        <div className="flex items-center justify-center">
          <span className="text-sm" style={{ color: '#78716c' }}>Loading recent winners...</span>
        </div>
      </div>
    )
  }

  // Don't render if no winners
  if (winners.length === 0) {
    return null
  }

  return (
    <div ref={tickerRef} className={`overflow-hidden border-y py-3 ${className}`} style={{ backgroundColor: '#fffbf7', borderColor: '#f0e0ca' }}>
      <style>{`
        @keyframes seamless-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .ticker-animate {
          display: flex;
          animation: seamless-scroll ${animationDuration}s linear infinite;
        }
        .ticker-animate:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-animate">
        {/* First set - this is what we measure */}
        <div ref={contentRef} className="flex shrink-0">
          {winners.map((winner, idx) => (
            <WinnerItem key={`set1-${winner.id}-${idx}`} winner={winner} idx={idx} />
          ))}
        </div>
        {/* Duplicate sets to ensure seamless infinite scroll */}
        <div className="flex shrink-0" aria-hidden="true">
          {winners.map((winner, idx) => (
            <WinnerItem key={`set2-${winner.id}-${idx}`} winner={winner} idx={idx} />
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {winners.map((winner, idx) => (
            <WinnerItem key={`set3-${winner.id}-${idx}`} winner={winner} idx={idx} />
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {winners.map((winner, idx) => (
            <WinnerItem key={`set4-${winner.id}-${idx}`} winner={winner} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}
