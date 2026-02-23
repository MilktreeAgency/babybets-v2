import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Gift } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { PrizeTemplate } from '@/types'

interface WinCelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  prize: PrizeTemplate
}

export function WinCelebrationModal({ isOpen, onClose, prize }: WinCelebrationModalProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      // Fire confetti when modal opens
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  const handleShowPrize = () => {
    onClose()
    navigate('/account?tab=prizes')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors z-10 cursor-pointer"
          style={{ color: '#78716c' }}
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 text-center">
          {/* Congratulations text */}
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3"
            style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
          >
            🎉 Congratulations! 🎉
          </h2>

          <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{ color: '#78716c' }}>
            You've won an amazing prize!
          </p>

          {/* Prize card */}
          <div
            className="rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2"
            style={{ backgroundColor: 'rgba(254, 208, 185, 0.1)', borderColor: '#FED0B9' }}
          >
            {prize.image_url ? (
              <img
                src={prize.image_url}
                alt={prize.name}
                className="w-full h-32 sm:h-40 object-cover rounded-lg mb-3 sm:mb-4"
              />
            ) : (
              <div
                className="w-full h-32 sm:h-40 rounded-lg mb-3 sm:mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#f5f5f4' }}
              >
                <Gift size={48} className="sm:w-16 sm:h-16 text-gray-400" />
              </div>
            )}

            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2" style={{ color: '#151e20' }}>
              {prize.name}
            </h3>

            <p className="text-base sm:text-lg font-bold" style={{ color: '#496B71' }}>
              Worth £{prize.value_gbp.toFixed(2)}
            </p>

            {prize.cash_alternative_gbp && (
              <p className="text-xs sm:text-sm mt-1" style={{ color: '#78716c' }}>
                Cash alternative: £{prize.cash_alternative_gbp.toFixed(2)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleShowPrize}
              className="w-full px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#496B71', color: 'white' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3a565a'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#496B71'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              View My Prize
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              style={{ color: '#78716c' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#151e20'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#78716c'}
            >
              Continue Revealing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
