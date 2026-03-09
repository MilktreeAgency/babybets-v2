import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Frown, ArrowRight, Zap, CheckCircle, Wallet, Gift, Banknote, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTickets } from '@/hooks/useTickets'
import { usePrizeFulfillments } from '@/hooks/usePrizeFulfillments'
import type { TicketWithDetails, PrizeTemplate } from '@/types'
import { UserPrizeClaimModal } from '@/components/UserPrizeClaimModal'

export default function ScratchReveal() {
  const { tickets, revealTicket } = useTickets()
  const { fulfillments } = usePrizeFulfillments()
  const navigate = useNavigate()

  // Filter for unrevealed instant win tickets
  const unrevealedTickets = tickets.filter(
    (t) => t.competition?.competition_type === 'instant_win' && !t.is_revealed
  )

  const [currentTicketIndex] = useState(0)
  const [, setIsScratching] = useState(false)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [revealResult, setRevealResult] = useState<{
    hasPrize: boolean
    prize?: PrizeTemplate
  } | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [autoScratching, setAutoScratching] = useState(false)
  const [lockedTicket, setLockedTicket] = useState<TicketWithDetails | null>(null)
  const [canvasReady, setCanvasReady] = useState(true) // Start as true for initial card
  const [isScratchingAll, setIsScratchingAll] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Use locked ticket while showing result to prevent animation restart when query refetches
  const currentTicket = showResult && lockedTicket ? lockedTicket : unrevealedTickets[currentTicketIndex]

  // Log when currentTicket changes
  useEffect(() => {
    console.log('Current ticket changed:', {
      ticketId: currentTicket?.id,
      ticketNumber: currentTicket?.ticket_number,
      index: currentTicketIndex,
      totalUnrevealed: unrevealedTickets.length
    })
  }, [currentTicket?.id])

  // Log when showResult changes
  useEffect(() => {
    console.log('showResult changed:', showResult, 'for ticket:', currentTicket?.ticket_number)
  }, [showResult])

  // Initialize canvas with scratch surface
  useEffect(() => {
    console.log('Canvas initialization effect triggered', {
      showResult,
      hasCanvas: !!canvasRef.current,
      ticketId: currentTicket?.id,
      ticketNumber: currentTicket?.ticket_number,
      lockedTicket: lockedTicket?.ticket_number,
      canvasReady
    })

    if (!showResult && canvasRef.current && currentTicket && canvasReady) {
      console.log('Initializing canvas for ticket', currentTicket.ticket_number)

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.log('No canvas context available')
        return
      }

      // Set canvas size
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      console.log('Canvas dimensions:', canvas.width, canvas.height)

      // Draw scratch-off surface with gradient (teal to darker teal)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#6B8E93')
      gradient.addColorStop(1, '#496B71')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add pattern for texture
      ctx.fillStyle = '#2D4B50'
      ctx.globalAlpha = 0.15
      for (let i = 0; i < canvas.width; i += 15) {
        for (let j = 0; j < canvas.height; j += 15) {
          if ((i + j) % 30 === 0) {
            ctx.fillRect(i, j, 8, 8)
          }
        }
      }
      ctx.globalAlpha = 1

      // Add "TAP HERE" text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillText('TAP HERE', canvas.width / 2, canvas.height / 2 - 30)

      // Add "TO SCRATCH" text
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = '#ffffffcc'
      ctx.fillText('TO SCRATCH', canvas.width / 2, canvas.height / 2 + 10)

      // Add smaller text
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = '#ffffff88'
      ctx.shadowBlur = 0
      ctx.fillText(`Ticket #${currentTicket.ticket_number}`, canvas.width / 2, canvas.height / 2 + 45)

      // Reset scratch progress
      setScratchProgress(0)

      console.log('Canvas initialized successfully')
    } else {
      console.log('Canvas initialization skipped', {
        showResult,
        hasCanvas: !!canvasRef.current,
        hasTicket: !!currentTicket,
        canvasReady
      })
    }
  }, [currentTicket?.id, showResult, canvasReady])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // If no tickets to reveal, show summary or redirect
  if (unrevealedTickets.length === 0 && tickets.some((t) => t.competition?.competition_type === 'instant_win')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
        {/* Soft background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(73, 107, 113, 0.08)' }}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(242, 81, 0, 0.08)' }}></div>

        <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full text-center relative z-10 shadow-xl" style={{ borderWidth: '1px', borderColor: '#d1d5db' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)', color: '#496B71' }}>
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#2D251E' }}>All Done!</h2>
          <p className="text-stone-500 mb-8">
            You've scratched all your instant win tickets. Check your account to view your prizes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/account?tab=tickets">
              <button className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 cursor-pointer" style={{ backgroundColor: '#496B71', color: 'white' }}>
                Go to My Account
              </button>
            </Link>
            <Link to="/">
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer">
                Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  } else if (tickets.length === 0 || !tickets.some((t) => t.competition?.competition_type === 'instant_win')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Redirecting... {setTimeout(() => navigate('/'), 1000) && ''}
      </div>
    )
  }


  // Auto-scratch animation
  const autoScratch = () => {
    console.log('autoScratch called', {
      autoScratching,
      showResult,
      isRevealing,
      hasCanvas: !!canvasRef.current,
      ticketId: currentTicket?.id
    })

    if (autoScratching || showResult || isRevealing) {
      console.log('Auto-scratch blocked', { autoScratching, showResult, isRevealing })
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      console.log('No canvas or context for scratch')
      return
    }

    console.log('Starting auto-scratch animation')
    setAutoScratching(true)
    setIsScratching(true)

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }

    const scratchPoints: Array<{ x: number; y: number }> = []
    const numLines = 12
    const numPointsPerLine = 40

    // Generate scratch pattern (multiple diagonal and horizontal lines)
    for (let line = 0; line < numLines; line++) {
      const startY = (line / numLines) * canvas.height
      for (let i = 0; i <= numPointsPerLine; i++) {
        const progress = i / numPointsPerLine
        scratchPoints.push({
          x: progress * canvas.width,
          y: startY + progress * (canvas.height / numLines) * 0.5,
        })
      }
    }

    // Add some random scratch points for more natural look
    for (let i = 0; i < 50; i++) {
      scratchPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      })
    }

    let currentPointIndex = 0
    const scratchSpeed = 8 // Points to scratch per frame

    const animate = () => {
      if (!canvas || !ctx || currentPointIndex >= scratchPoints.length) {
        console.log('Auto-scratch animation complete', {
          totalPoints: scratchPoints.length,
          currentIndex: currentPointIndex
        })
        setAutoScratching(false)
        setIsScratching(false)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        // Complete the reveal after a brief delay to show full scratch
        setTimeout(() => {
          console.log('Calling handleReveal after scratch complete')
          handleReveal()
        }, 200)
        return
      }

      ctx.globalCompositeOperation = 'destination-out'

      // Scratch multiple points per frame for smoother animation
      for (let i = 0; i < scratchSpeed && currentPointIndex < scratchPoints.length; i++) {
        const point = scratchPoints[currentPointIndex]
        ctx.beginPath()
        ctx.arc(point.x, point.y, 35, 0, Math.PI * 2)
        ctx.fill()
        currentPointIndex++
      }

      // Update progress
      const progress = (currentPointIndex / scratchPoints.length) * 100
      setScratchProgress(progress)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const handleReveal = async () => {
    if (isRevealing || showResult) return

    // Lock the current ticket to prevent it from changing when query refetches
    setLockedTicket(currentTicket)
    setIsRevealing(true)

    // Haptic feedback on scratch start
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }

    try {
      const result = await revealTicket(currentTicket.id)
      console.log('Setting reveal result and showing result card:', result)
      setRevealResult(result)
      setShowResult(true)
      console.log('showResult set to true')

      if (result.hasPrize && result.prize) {
        // Strong haptic feedback on win
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 30, 100, 30, 150])
        }

        // Dramatic confetti for wins
        const duration = 2000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min
        }

        const interval: ReturnType<typeof setInterval> = setInterval(function () {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)

          // Launch confetti from multiple positions
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#f25100', '#FED0B9', '#496B71', '#FFD700', '#FF6347'],
          })
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#f25100', '#FED0B9', '#496B71', '#FFD700', '#FF6347'],
          })
        }, 250)

        // Show claim modal for non-SiteCredit prizes
        if (result.prize.type !== 'SiteCredit') {
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

  const handleScratchAll = async () => {
    if (isScratchingAll || isRevealing) return

    setIsScratchingAll(true)
    console.log('Scratching all tickets without animation')

    // Reveal all unrevealed tickets
    for (const ticket of unrevealedTickets) {
      try {
        await revealTicket(ticket.id)
        console.log('Revealed ticket:', ticket.ticket_number)
      } catch (error) {
        console.error('Failed to reveal ticket:', ticket.ticket_number, error)
      }
    }

    setIsScratchingAll(false)
    console.log('All tickets scratched, redirecting to account')

    // Navigate to account page after revealing all
    navigate('/account?tab=tickets')
  }

  const handleNext = () => {
    console.log('handleNext called', {
      currentTicketId: currentTicket?.id,
      unrevealedCount: unrevealedTickets.length,
      autoScratching,
      showResult
    })

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Reset all scratch states
    console.log('Resetting states...')
    setShowResult(false)
    setRevealResult(null)
    setShowClaimModal(false)
    setAutoScratching(false)
    setIsScratching(false)
    setScratchProgress(0)
    setIsRevealing(false)
    setLockedTicket(null)
    setCanvasReady(false)

    console.log('Next ticket will be:', unrevealedTickets[0]?.ticket_number)

    // The unrevealedTickets list updates automatically from the store
    // The canvas will be reinitialized by the useEffect when currentTicket changes
    // The key on the canvas ensures it completely remounts for each new ticket
  }

  // Get prize icon color
  const getPrizeIconColor = (prizeType?: string): string => {
    if (!prizeType) return '#496B71'

    if (prizeType === 'SiteCredit') return '#496B71' // Teal
    if (prizeType === 'Cash') return '#f25100' // Orange
    if (prizeType === 'Voucher') return '#f25100' // Orange
    return '#496B71' // Teal for physical prizes
  }

  const currentFulfillment = fulfillments.find((f) => f.ticket_id === currentTicket?.id)

  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[150px]" style={{ backgroundColor: 'rgba(73, 107, 113, 0.08)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[150px]" style={{ backgroundColor: 'rgba(242, 81, 0, 0.08)' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(251, 239, 223, 0.5)' }}></div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => navigate('/account?tab=tickets')}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
        style={{ borderWidth: '1px', borderColor: '#d1d5db' }}
        aria-label="Close"
      >
        <X size={20} className="text-gray-600" />
      </button>

      {/* Scratch All Button */}
      <button
        onClick={handleScratchAll}
        disabled={isScratchingAll || isRevealing}
        className="absolute top-4 left-4 z-20 px-4 py-2 rounded-full bg-white shadow-lg flex items-center gap-2 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderWidth: '1px', borderColor: '#d1d5db' }}
      >
        {isScratchingAll ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#496B71' }}></div>
            <span className="text-sm font-semibold" style={{ color: '#496B71' }}>Revealing...</span>
          </>
        ) : (
          <>
            <Zap size={16} style={{ color: '#496B71' }} />
            <span className="text-sm font-semibold" style={{ color: '#496B71' }}>Scratch All</span>
          </>
        )}
      </button>

      <div className="relative z-10 max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm mb-4 shadow-lg animate-pulse" style={{ backgroundColor: '#496B71', color: 'white' }}>
            <Zap size={16} fill="currentColor" /> Instant Win
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2D251E' }}>Tap to Scratch</h1>
          <p className="text-stone-500 font-medium">
            Ticket #{currentTicket?.ticket_number}
          </p>
          <p className="text-sm text-stone-400 mt-1">{currentTicket?.competition?.title}</p>
        </div>

        <AnimatePresence mode="wait" onExitComplete={() => {
          console.log('Exit animation complete - ready to show next card')
        }}>
          {!showResult ? (
            <motion.div
              key={`card-${currentTicket?.id}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onAnimationStart={() => console.log('Scratch card animation started for ticket:', currentTicket?.ticket_number)}
              onAnimationComplete={() => {
                console.log('Scratch card animation complete for ticket:', currentTicket?.ticket_number)
                setCanvasReady(true)
              }}
              className="bg-white rounded-[2rem] p-2 shadow-2xl relative aspect-3/4"
              style={{ borderWidth: '1px', borderColor: '#d1d5db' }}
            >
              <div className="h-full w-full rounded-[1.5rem] relative overflow-hidden flex flex-col items-center justify-center border-4 border-dashed" style={{ backgroundColor: '#FBEFDF', borderColor: '#d1d5db' }}>
                {/* Content Underneath (Visually hidden until revealed) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="font-bold text-6xl mb-4" style={{ color: '#496B7166' }}>?</div>
                  <p className="text-stone-400 text-sm">Tap to reveal</p>
                </div>

                {/* Scratch Canvas Overlay */}
                <canvas
                  key={`canvas-${currentTicket?.id}`}
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                  onClick={autoScratch}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    autoScratch()
                  }}
                />

                {/* Loading Overlay */}
                {(isRevealing && !autoScratching) && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#496B71' }}></div>
                  </div>
                )}

                {/* Progress Bar */}
                {scratchProgress > 0 && scratchProgress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 z-20">
                    <motion.div
                      className="h-full"
                      style={{ backgroundColor: '#496B71' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${scratchProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`result-${currentTicket?.id}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
              onAnimationStart={(definition) => console.log('Result card animation started:', definition)}
              onAnimationComplete={(definition) => console.log('Result card animation complete:', definition)}
              className="bg-white rounded-[2rem] p-8 shadow-2xl relative flex flex-col items-center justify-center text-center"
              style={{ minHeight: '480px', borderWidth: '1px', borderColor: '#d1d5db' }}
            >
              {revealResult?.hasPrize && revealResult.prize ? (
                <>
                  {/* Prize Type Icon */}
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg"
                    style={{ backgroundColor: `${getPrizeIconColor(revealResult.prize.type)}15` }}
                  >
                    {revealResult.prize.type === 'SiteCredit' ? (
                      <Wallet size={48} style={{ color: getPrizeIconColor(revealResult.prize.type) }} />
                    ) : revealResult.prize.type === 'Cash' ? (
                      <Banknote size={48} style={{ color: getPrizeIconColor(revealResult.prize.type) }} />
                    ) : (
                      <Trophy size={48} style={{ color: getPrizeIconColor(revealResult.prize.type) }} />
                    )}
                  </div>

                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#2D251E' }}>YOU WON!</h2>
                  <p className="text-stone-500 mb-6">Congratulations on your prize!</p>

                  {/* Prize Display */}
                  <div className="w-full mb-6">
                    <div
                      className="px-6 py-5 rounded-xl shadow-sm"
                      style={{
                        backgroundColor: '#FBEFDF',
                        borderWidth: '1px',
                        borderColor: '#d1d5db'
                      }}
                    >
                      <p className="text-xs uppercase font-bold mb-2" style={{ color: '#496B71' }}>Your Prize</p>
                      <p className="text-xl font-bold" style={{ color: '#2D251E' }}>
                        {revealResult.prize.short_name || revealResult.prize.name}
                      </p>
                      {revealResult.prize.value_gbp && (
                        <div className="flex items-center gap-1 mt-2">
                          <Gift size={16} className="text-stone-400" />
                          <p className="text-sm text-stone-500">Worth £{revealResult.prize.value_gbp}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: '#496B71', color: 'white' }}
                  >
                    {unrevealedTickets.length > 1 ? (
                      <>
                        Next Card <ArrowRight size={18} />
                      </>
                    ) : (
                      'Done'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Frown size={48} className="text-gray-400" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#2D251E' }}>Not This Time!</h2>
                  <p className="text-stone-500 mb-4">Better luck on the next one.</p>
                  <p className="text-sm text-stone-400 mb-8">
                    Remember, you're still entered in the main prize draw!
                  </p>

                  <button
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: '#496B71', color: 'white' }}
                  >
                    {unrevealedTickets.length > 1 ? (
                      <>
                        Next Card <ArrowRight size={18} />
                      </>
                    ) : (
                      'Done'
                    )}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-stone-400 text-sm font-medium">
          {unrevealedTickets.length} card{unrevealedTickets.length !== 1 ? 's' : ''} remaining
        </div>
      </div>

      {/* Prize Claim Modal */}
      {showClaimModal && revealResult?.prize && currentFulfillment && (
        <UserPrizeClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          prize={revealResult.prize}
          fulfillmentId={currentFulfillment.id}
          onClaimed={() => {
            setShowClaimModal(false)
          }}
        />
      )}
    </div>
  )
}
