import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Sparkles, Gift, DollarSign } from 'lucide-react'
import type { TicketWithDetails, TicketRevealResult } from '@/types'
import { UserPrizeClaimModal } from './UserPrizeClaimModal'
import { usePrizeFulfillments } from '@/hooks/usePrizeFulfillments'

interface ScratchCardProps {
  ticket: TicketWithDetails
  onReveal: (ticketId: string) => Promise<TicketRevealResult>
  disabled?: boolean
}

export function ScratchCard({ ticket, onReveal, disabled }: ScratchCardProps) {
  const [, setIsScratching] = useState(false)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [isRevealed, setIsRevealed] = useState(ticket.is_revealed || false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [revealResult, setRevealResult] = useState<TicketRevealResult | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMouseDown = useRef(false)
  const { fulfillments } = usePrizeFulfillments()

  const hasPrize = !!ticket.prize_id
  const prize = ticket.prize

  // Find the fulfillment for this ticket
  const fulfillment = fulfillments.find(f => f.ticket_id === ticket.id)

  // Sync isRevealed state with ticket prop to prevent re-reveal after refresh
  useEffect(() => {
    setIsRevealed(ticket.is_revealed || false)
  }, [ticket.is_revealed])

  useEffect(() => {
    if (!isRevealed && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Draw scratch-off surface
      ctx.fillStyle = '#c4c4c4'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add pattern
      ctx.fillStyle = '#a0a0a0'
      for (let i = 0; i < canvas.width; i += 10) {
        for (let j = 0; j < canvas.height; j += 10) {
          if ((i + j) % 20 === 0) {
            ctx.fillRect(i, j, 5, 5)
          }
        }
      }

      // Add "SCRATCH HERE" text
      ctx.fillStyle = '#666'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2)
    }
  }, [isRevealed])

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed || disabled || isRevealing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    // Clear a circle where user scratches
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++
    }
    const progress = (transparent / (pixels.length / 4)) * 100
    setScratchProgress(progress)

    // Auto-reveal if scratched enough
    if (progress > 50 && !isRevealing) {
      handleReveal()
    }
  }

  const handleReveal = async () => {
    if (isRevealed || isRevealing) return

    setIsRevealing(true)
    try {
      const result = await onReveal(ticket.id)
      setRevealResult(result)
      setIsRevealed(true)

      // Show confetti if won
      if (result.hasPrize) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f25100', '#FED0B9', '#496B71'],
        })

        // Show claim modal for non-SiteCredit prizes that need claiming
        // SiteCredit is auto-completed, so no need to show modal
        if (result.prize && result.prize.type !== 'SiteCredit') {
          // Wait a moment for confetti to show, then show modal
          setTimeout(() => {
            setShowClaimModal(true)
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Failed to reveal ticket:', error)
    } finally {
      setIsRevealing(false)
    }
  }

  return (
    <div className="relative bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Ticket Header */}
      <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium">Ticket #{ticket.ticket_number}</p>
            <h3 className="font-bold text-sm mt-0.5 line-clamp-1">{ticket.competition?.title}</h3>
          </div>
          {!isRevealed && (
            <div className="flex items-center gap-1 text-orange-600">
              <Sparkles className="size-4" />
              <span className="text-xs font-bold">SCRATCH</span>
            </div>
          )}
        </div>
      </div>

      {/* Scratch Area */}
      <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        {/* Prize/No Prize Content (underneath) */}
        <AnimatePresence>
          {(isRevealed || scratchProgress > 30) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              {hasPrize && prize ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <Gift className="size-16 text-orange-500 mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-center text-orange-600 mb-2">
                    YOU WON!
                  </h3>
                  <p className="text-lg font-bold text-center">{prize.short_name || prize.name}</p>
                  <div className="mt-2 flex items-center gap-1 text-green-600">
                    <DollarSign className="size-4" />
                    <span className="font-bold">£{prize.value_gbp}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <Gift className="size-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-600">Better Luck Next Time!</h3>
                  <p className="text-sm text-gray-500 mt-2">This ticket didn't win a prize</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scratch Canvas Overlay */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none"
            onMouseDown={() => {
              isMouseDown.current = true
              setIsScratching(true)
            }}
            onMouseUp={() => {
              isMouseDown.current = false
              setIsScratching(false)
            }}
            onMouseMove={(e) => isMouseDown.current && scratch(e)}
            onMouseLeave={() => {
              isMouseDown.current = false
              setIsScratching(false)
            }}
            onTouchStart={() => setIsScratching(true)}
            onTouchEnd={() => setIsScratching(false)}
            onTouchMove={scratch}
          />
        )}

        {/* Loading Overlay */}
        {isRevealing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>

      {/* Progress Bar (shown while scratching) */}
      {!isRevealed && scratchProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <motion.div
            className="h-full bg-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${scratchProgress}%` }}
          />
        </div>
      )}

      {/* Prize Claim Modal */}
      {showClaimModal && revealResult?.prize && fulfillment && (
        <UserPrizeClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          prize={revealResult.prize}
          fulfillmentId={fulfillment.id}
          onClaimed={() => {
            setShowClaimModal(false)
            // Refresh fulfillments handled by the hook
          }}
        />
      )}
    </div>
  )
}
