import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Frown, ArrowRight, Zap, CheckCircle, Wallet, Gift, Banknote, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTickets } from '@/hooks/useTickets'
import { usePrizeFulfillments } from '@/hooks/usePrizeFulfillments'
import type { TicketWithDetails, TicketRevealResult } from '@/types'
import { UserPrizeClaimModal } from '@/components/UserPrizeClaimModal'

type RevealPhase = 'ready' | 'scratching' | 'revealing' | 'result'

function drawScratchSurface(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  ticketNumber: string
) {
  const dpr = window.devicePixelRatio || 1
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight

  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#6B8E93')
  gradient.addColorStop(1, '#496B71')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#2D4B50'
  ctx.globalAlpha = 0.15
  for (let i = 0; i < width; i += 15) {
    for (let j = 0; j < height; j += 15) {
      if ((i + j) % 30 === 0) {
        ctx.fillRect(i, j, 8, 8)
      }
    }
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  ctx.fillText('TAP TO SCRATCH', width / 2, height / 2 - 20)

  ctx.font = 'bold 14px sans-serif'
  ctx.fillStyle = '#ffffffaa'
  ctx.shadowBlur = 0
  ctx.fillText(`Ticket #${ticketNumber}`, width / 2, height / 2 + 24)
}

function fireWinConfetti() {
  confetti({
    particleCount: 100,
    spread: 80,
    startVelocity: 35,
    origin: { y: 0.55 },
    colors: ['#f25100', '#FED0B9', '#496B71', '#FFD700'],
    disableForReducedMotion: true,
  })
}

export default function ScratchReveal() {
  const { tickets, revealTicket, refreshTickets, isLoading } = useTickets()
  const { fulfillments } = usePrizeFulfillments()
  const navigate = useNavigate()

  const unrevealedTickets = tickets.filter(
    (t) => t.competition?.competition_type === 'instant_win' && !t.is_revealed
  )

  const [activeTicket, setActiveTicket] = useState<TicketWithDetails | null>(null)
  const [phase, setPhase] = useState<RevealPhase>('ready')
  const [scratchProgress, setScratchProgress] = useState(0)
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const [revealResult, setRevealResult] = useState<TicketRevealResult | null>(null)
  const [claimFulfillmentId, setClaimFulfillmentId] = useState<string | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const revealPromiseRef = useRef<Promise<TicketRevealResult> | null>(null)
  const lastProgressRef = useRef(0)

  const displayTicket = activeTicket ?? unrevealedTickets[0] ?? null
  const isInActiveSession =
    activeTicket !== null ||
    phase === 'scratching' ||
    phase === 'revealing' ||
    phase === 'result'

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !displayTicket || phase !== 'ready') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawScratchSurface(canvas, ctx, displayTicket.ticket_number)
    setScratchProgress(0)
    setOverlayOpacity(1)
    lastProgressRef.current = 0
  }, [displayTicket, phase])

  useLayoutEffect(() => {
    if (phase === 'ready') {
      initCanvas()
    }
  }, [initCanvas, phase, sessionKey])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !displayTicket && !isInActiveSession && tickets.length > 0) {
      const timer = setTimeout(() => navigate('/account?tab=tickets'), 800)
      return () => clearTimeout(timer)
    }
  }, [isLoading, displayTicket, isInActiveSession, tickets.length, navigate])

  const cancelScratchAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const updateProgress = (progress: number) => {
    const rounded = Math.min(100, Math.floor(progress / 5) * 5)
    if (rounded !== lastProgressRef.current) {
      lastProgressRef.current = rounded
      setScratchProgress(rounded)
    }
  }

  const finishReveal = async (ticket: TicketWithDetails) => {
    cancelScratchAnimation()
    setPhase('revealing')
    setOverlayOpacity(0)

    try {
      const result = revealPromiseRef.current
        ? await revealPromiseRef.current
        : await revealTicket(ticket.id)

      revealPromiseRef.current = null
      setRevealResult(result)

      if (result.allocationResult?.fulfillment_id) {
        setClaimFulfillmentId(result.allocationResult.fulfillment_id)
      }

      await new Promise((resolve) => setTimeout(resolve, 220))
      setPhase('result')

      if (result.hasPrize && result.prize) {
        if ('vibrate' in navigator) {
          navigator.vibrate([40, 20, 80])
        }
        requestAnimationFrame(() => fireWinConfetti())
      }
    } catch (error) {
      console.error('Failed to reveal ticket:', error)
      revealPromiseRef.current = null
      setPhase('ready')
      setActiveTicket(null)
      setOverlayOpacity(1)
      setRevealResult(null)
      setClaimFulfillmentId(null)
    }
  }

  const startScratch = () => {
    if (!displayTicket || phase !== 'ready') return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    setActiveTicket(displayTicket)
    setPhase('scratching')

    if ('vibrate' in navigator) {
      navigator.vibrate(15)
    }

    // Start API call early so it finishes around scratch completion
    revealPromiseRef.current = revealTicket(displayTicket.id)

    const scratchPoints: Array<{ x: number; y: number }> = []
    const rows = 10
    const cols = 50

    for (let row = 0; row < rows; row++) {
      const y = ((row + 0.5) / rows) * canvas.offsetHeight
      for (let col = 0; col <= cols; col++) {
        const x = (col / cols) * canvas.offsetWidth
        const wave = Math.sin(col * 0.35 + row) * (canvas.offsetHeight / rows) * 0.25
        scratchPoints.push({ x, y: y + wave })
      }
    }

    let index = 0
    const brushRadius = 32
    const pointsPerFrame = 6

    const animate = () => {
      if (!canvas || !ctx || index >= scratchPoints.length) {
        cancelScratchAnimation()
        updateProgress(100)
        finishReveal(displayTicket)
        return
      }

      ctx.globalCompositeOperation = 'destination-out'

      for (let i = 0; i < pointsPerFrame && index < scratchPoints.length; i++) {
        const point = scratchPoints[index]
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushRadius, 0, Math.PI * 2)
        ctx.fill()
        index++
      }

      updateProgress((index / scratchPoints.length) * 100)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const handleNext = async () => {
    cancelScratchAnimation()
    setPhase('ready')
    setRevealResult(null)
    setClaimFulfillmentId(null)
    setShowClaimModal(false)
    setActiveTicket(null)
    setScratchProgress(0)
    setOverlayOpacity(1)
    revealPromiseRef.current = null
    lastProgressRef.current = 0
    setSessionKey((k) => k + 1)
    await refreshTickets()
  }

  const getPrizeIconColor = (prizeType?: string): string => {
    if (!prizeType) return '#496B71'
    if (prizeType === 'SiteCredit') return '#496B71'
    if (prizeType === 'Cash') return '#f25100'
    if (prizeType === 'Voucher') return '#f25100'
    return '#496B71'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fffbf7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#496B71' }} />
      </div>
    )
  }

  if (
    unrevealedTickets.length === 0 &&
    !isInActiveSession &&
    tickets.some((t) => t.competition?.competition_type === 'instant_win')
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(73, 107, 113, 0.08)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(242, 81, 0, 0.08)' }} />

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
  }

  if (!displayTicket && !isLoading && !isInActiveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fffbf7' }}>
        <p className="text-stone-500">Redirecting...</p>
      </div>
    )
  }

  const currentFulfillment = fulfillments.find((f) => f.ticket_id === displayTicket!.id)
  const fulfillmentId = claimFulfillmentId ?? currentFulfillment?.id
  const remainingCount = unrevealedTickets.length

  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#fffbf7' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[150px]" style={{ backgroundColor: 'rgba(73, 107, 113, 0.08)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[150px]" style={{ backgroundColor: 'rgba(242, 81, 0, 0.08)' }} />
      </div>

      <button
        onClick={() => navigate('/account?tab=tickets')}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
        style={{ borderWidth: '1px', borderColor: '#d1d5db' }}
        aria-label="Close"
      >
        <X size={20} className="text-gray-600" />
      </button>

      <div className="relative z-10 max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm mb-4 shadow-lg" style={{ backgroundColor: '#496B71', color: 'white' }}>
            <Zap size={16} fill="currentColor" /> Instant Win
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2D251E' }}>
            {phase === 'result' ? 'Result' : 'Tap to Scratch'}
          </h1>
          <p className="text-stone-500 font-medium">Ticket #{displayTicket.ticket_number}</p>
          <p className="text-sm text-stone-400 mt-1">{displayTicket.competition?.title}</p>
        </div>

        <AnimatePresence mode="wait">
          {phase !== 'result' ? (
            <motion.div
              key={`card-${displayTicket.id}-${sessionKey}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-[2rem] p-2 shadow-2xl relative aspect-3/4"
              style={{ borderWidth: '1px', borderColor: '#d1d5db' }}
            >
              <div
                className="h-full w-full rounded-[1.5rem] relative overflow-hidden flex flex-col items-center justify-center border-4 border-dashed"
                style={{ backgroundColor: '#FBEFDF', borderColor: '#d1d5db' }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="font-bold text-6xl mb-4" style={{ color: '#496B7144' }}>?</div>
                  <p className="text-stone-400 text-sm">Your result is underneath</p>
                </div>

                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full touch-none"
                  style={{
                    cursor: phase === 'ready' ? 'pointer' : 'default',
                    opacity: overlayOpacity,
                    transition: 'opacity 0.28s ease-out',
                    willChange: 'opacity',
                  }}
                  onClick={phase === 'ready' ? startScratch : undefined}
                  onTouchStart={(e) => {
                    if (phase !== 'ready') return
                    e.preventDefault()
                    startScratch()
                  }}
                />

                {phase === 'revealing' && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-transparent" style={{ borderTopColor: '#496B71' }} />
                  </div>
                )}

                {scratchProgress > 0 && scratchProgress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10 z-20">
                    <div
                      className="h-full transition-[width] duration-150 ease-out"
                      style={{ width: `${scratchProgress}%`, backgroundColor: '#496B71' }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`result-${displayTicket.id}-${sessionKey}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-[2rem] p-8 shadow-2xl relative flex flex-col items-center justify-center text-center"
              style={{ minHeight: '480px', borderWidth: '1px', borderColor: '#d1d5db' }}
            >
              {revealResult?.hasPrize && revealResult.prize ? (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.35 }}
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
                  </motion.div>

                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#2D251E' }}>YOU WON!</h2>
                  <p className="text-stone-500 mb-6">Congratulations on your prize!</p>

                  <div className="w-full mb-6">
                    <div
                      className="px-6 py-5 rounded-xl shadow-sm"
                      style={{ backgroundColor: '#FBEFDF', borderWidth: '1px', borderColor: '#d1d5db' }}
                    >
                      <p className="text-xs uppercase font-bold mb-2" style={{ color: '#496B71' }}>Your Prize</p>
                      <p className="text-xl font-bold" style={{ color: '#2D251E' }}>
                        {revealResult.prize.short_name || revealResult.prize.name}
                      </p>
                      {revealResult.prize.value_gbp && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Gift size={16} className="text-stone-400" />
                          <p className="text-sm text-stone-500">Worth £{revealResult.prize.value_gbp}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {revealResult.prize.type !== 'SiteCredit' && fulfillmentId && (
                    <button
                      type="button"
                      onClick={() => setShowClaimModal(true)}
                      className="w-full mb-3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: '#f25100', color: 'white' }}
                    >
                      Claim Your Prize
                    </button>
                  )}
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
                </>
              )}

              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                {remainingCount > 0 ? (
                  <>
                    Next Card <ArrowRight size={18} />
                  </>
                ) : (
                  'Done'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-stone-400 text-sm font-medium">
          {Math.max(remainingCount, 0)} card{remainingCount !== 1 ? 's' : ''} remaining
        </div>
      </div>

      {showClaimModal && revealResult?.prize && fulfillmentId && (
        <UserPrizeClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          prize={revealResult.prize}
          fulfillmentId={fulfillmentId}
          onClaimed={() => setShowClaimModal(false)}
        />
      )}
    </div>
  )
}
