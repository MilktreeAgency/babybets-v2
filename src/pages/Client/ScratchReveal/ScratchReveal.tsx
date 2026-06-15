import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Frown, ArrowRight, Zap, CheckCircle, Wallet, Banknote, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTickets } from '@/hooks/useTickets'
import type { TicketWithDetails, TicketRevealResult } from '@/types'
import { UserPrizeClaimModal } from '@/components/UserPrizeClaimModal'

const WIPE_MS = 620

type Phase = 'idle' | 'wiping' | 'done'

function fireWinConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 30,
    origin: { y: 0.6 },
    colors: ['#f25100', '#496B71', '#FFD700'],
    disableForReducedMotion: true,
  })
}

function prizeIconColor(type?: string) {
  if (type === 'Cash' || type === 'Voucher') return '#f25100'
  return '#496B71'
}

export default function ScratchReveal() {
  const { tickets, revealTicket, refreshTickets, isLoading } = useTickets()
  const navigate = useNavigate()

  const unrevealedFromServer = tickets.filter(
    (t) => t.competition?.competition_type === 'instant_win' && !t.is_revealed
  )

  const [queue, setQueue] = useState<TicketWithDetails[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealResult, setRevealResult] = useState<TicketRevealResult | null>(null)
  const [claimFulfillmentId, setClaimFulfillmentId] = useState<string | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const queueBootstrapped = useRef(false)
  const isRevealingRef = useRef(false)

  const currentTicket = queue[0] ?? null

  // Bootstrap local queue once — avoids React Query updates mid-animation
  useEffect(() => {
    if (!isLoading && !queueBootstrapped.current && unrevealedFromServer.length > 0) {
      queueBootstrapped.current = true
      setQueue(unrevealedFromServer)
    }
  }, [isLoading, unrevealedFromServer])

  const handleScratch = useCallback(async () => {
    if (!currentTicket || phase !== 'idle' || isRevealingRef.current) return

    isRevealingRef.current = true
    setError(null)
    setRevealResult(null)
    setClaimFulfillmentId(null)
    setPhase('wiping')

    if ('vibrate' in navigator) navigator.vibrate(12)

    const apiPromise = revealTicket(currentTicket.id)

    apiPromise
      .then((result) => {
        setRevealResult(result)
        if (result.allocationResult?.fulfillment_id) {
          setClaimFulfillmentId(result.allocationResult.fulfillment_id)
        }
      })
      .catch((err) => {
        console.error('Failed to reveal ticket:', err)
        setError('Something went wrong. Please try again.')
        setPhase('idle')
        isRevealingRef.current = false
      })

    await new Promise<void>((resolve) => setTimeout(resolve, WIPE_MS))

    try {
      const result = await apiPromise
      setPhase('done')
      if (result.hasPrize && result.prize) {
        if ('vibrate' in navigator) navigator.vibrate([30, 20, 50])
        fireWinConfetti()
      }
    } catch {
      // handled in apiPromise.catch
    } finally {
      isRevealingRef.current = false
    }
  }, [currentTicket, phase, revealTicket])

  const handleNext = async () => {
    const nextQueue = queue.slice(1)
    setQueue(nextQueue)
    setRevealResult(null)
    setClaimFulfillmentId(null)
    setShowClaimModal(false)
    setError(null)
    setPhase('idle')
    isRevealingRef.current = false

    if (nextQueue.length === 0) {
      setIsRefreshing(true)
      await refreshTickets()
      queueBootstrapped.current = false
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (
      !isLoading &&
      !isRefreshing &&
      queue.length === 0 &&
      !queueBootstrapped.current &&
      !tickets.some((t) => t.competition?.competition_type === 'instant_win')
    ) {
      navigate('/account?tab=tickets')
    }
  }, [isLoading, isRefreshing, queue.length, tickets, navigate])

  if (isLoading && queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fffbf7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#496B71' }} />
      </div>
    )
  }

  const allDoneOnServer =
    unrevealedFromServer.length === 0 &&
    tickets.some((t) => t.competition?.competition_type === 'instant_win')

  const sessionComplete = queue.length === 0 && phase === 'idle' && !isRefreshing

  if (isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fffbf7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#496B71' }} />
      </div>
    )
  }

  if (sessionComplete && allDoneOnServer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fffbf7' }}>
        <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full text-center shadow-xl" style={{ border: '1px solid #d1d5db' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)', color: '#496B71' }}>
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#2D251E' }}>All Done!</h2>
          <p className="text-stone-500 mb-8">
            You've scratched all your instant win tickets. Check your account to view your prizes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/account?tab=tickets">
              <button className="px-6 py-3 rounded-xl font-bold cursor-pointer" style={{ backgroundColor: '#496B71', color: 'white' }}>
                Go to My Account
              </button>
            </Link>
            <Link to="/">
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer">
                Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!currentTicket) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fffbf7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#496B71' }} />
      </div>
    )
  }

  const remaining = queue.length - (phase === 'done' ? 1 : 0)
  const showResult = revealResult !== null && (phase === 'wiping' || phase === 'done')
  const isWin = showResult && revealResult.hasPrize && revealResult.prize

  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center relative" style={{ backgroundColor: '#fffbf7' }}>
      <button
        onClick={() => navigate('/account?tab=tickets')}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 cursor-pointer"
        style={{ border: '1px solid #d1d5db' }}
        aria-label="Close"
      >
        <X size={20} className="text-gray-600" />
      </button>

      <div className="relative z-10 max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm mb-4 shadow-lg"
            style={{ backgroundColor: '#496B71', color: 'white' }}
          >
            <Zap size={16} fill="currentColor" /> Instant Win
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2D251E' }}>
            {showResult ? 'Result' : 'Tap to Scratch'}
          </h1>
          <p className="text-stone-500 font-medium">Ticket #{currentTicket.ticket_number}</p>
          <p className="text-sm text-stone-400 mt-1">{currentTicket.competition?.title}</p>
        </div>

        {/* Single card — no mount/unmount between scratch and result */}
        <div
          className="bg-white rounded-[2rem] p-2 shadow-2xl"
          style={{ border: '1px solid #d1d5db' }}
        >
          <div
            className="relative rounded-[1.5rem] overflow-hidden border-4 border-dashed aspect-3/4"
            style={{ backgroundColor: '#FBEFDF', borderColor: '#d1d5db' }}
          >
            {/* Result layer (always present) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              {!showResult ? (
                <>
                  <div className="font-bold text-6xl mb-3" style={{ color: '#496B7144' }}>?</div>
                  <p className="text-stone-400 text-sm">Your result is underneath</p>
                </>
              ) : isWin ? (
                <div
                  className="flex flex-col items-center w-full animate-[fadeIn_0.35s_ease-out]"
                  style={{ animationFillMode: 'both' }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
                    style={{ backgroundColor: `${prizeIconColor(revealResult.prize!.type)}15` }}
                  >
                    {revealResult.prize!.type === 'SiteCredit' ? (
                      <Wallet size={40} style={{ color: prizeIconColor(revealResult.prize!.type) }} />
                    ) : revealResult.prize!.type === 'Cash' ? (
                      <Banknote size={40} style={{ color: prizeIconColor(revealResult.prize!.type) }} />
                    ) : (
                      <Trophy size={40} style={{ color: prizeIconColor(revealResult.prize!.type) }} />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: '#2D251E' }}>YOU WON!</h2>
                  <p className="text-stone-500 text-sm mb-5">Congratulations!</p>
                  <div
                    className="w-full px-5 py-4 rounded-xl"
                    style={{ backgroundColor: 'white', border: '1px solid #d1d5db' }}
                  >
                    <p className="text-xs uppercase font-bold mb-1" style={{ color: '#496B71' }}>Your Prize</p>
                    <p className="text-lg font-bold" style={{ color: '#2D251E' }}>
                      {revealResult.prize!.short_name || revealResult.prize!.name}
                    </p>
                    {revealResult.prize!.value_gbp && (
                      <p className="text-sm text-stone-500 mt-1">Worth £{revealResult.prize!.value_gbp}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center animate-[fadeIn_0.35s_ease-out]"
                  style={{ animationFillMode: 'both' }}
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                    <Frown size={40} className="text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: '#2D251E' }}>Not This Time!</h2>
                  <p className="text-stone-500 text-sm">Better luck on the next one.</p>
                  <p className="text-xs text-stone-400 mt-3">You're still in the main draw!</p>
                </div>
              )}
            </div>

            {/* Scratch overlay — GPU wipe via transform */}
            {phase !== 'done' && (
              <button
                type="button"
                disabled={phase === 'wiping'}
                onClick={handleScratch}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center touch-none select-none cursor-pointer disabled:cursor-default"
                style={{
                  background: 'linear-gradient(135deg, #6B8E93 0%, #496B71 100%)',
                  transform: phase === 'wiping' ? 'translateX(-105%)' : 'translateX(0)',
                  transition: `transform ${WIPE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  willChange: 'transform',
                }}
              >
                <span className="text-white font-bold text-2xl tracking-wide drop-shadow">TAP TO SCRATCH</span>
                <span className="text-white/70 text-sm mt-2">Ticket #{currentTicket.ticket_number}</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {phase === 'done' && revealResult && (
          <div className="mt-6 space-y-3 animate-[fadeIn_0.3s_ease-out]">
            {isWin &&
              revealResult.prize!.type !== 'SiteCredit' &&
              claimFulfillmentId && (
                <button
                  type="button"
                  onClick={() => setShowClaimModal(true)}
                  className="w-full py-3 rounded-xl font-bold text-white cursor-pointer"
                  style={{ backgroundColor: '#f25100' }}
                >
                  Claim Your Prize
                </button>
              )}
            <button
              type="button"
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white cursor-pointer"
              style={{ backgroundColor: '#496B71' }}
            >
              {remaining > 0 ? (
                <>
                  Next Card <ArrowRight size={18} />
                </>
              ) : (
                'Done'
              )}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-stone-400 text-sm">
          {queue.length} card{queue.length !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {showClaimModal && revealResult?.prize && claimFulfillmentId && (
        <UserPrizeClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          prize={revealResult.prize}
          fulfillmentId={claimFulfillmentId}
          onClaimed={() => setShowClaimModal(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
