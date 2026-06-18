import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Frown, ArrowRight, Zap, CheckCircle, Wallet, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTickets } from '@/hooks/useTickets'
import type { TicketWithDetails, TicketRevealResult } from '@/types'
import { UserPrizeClaimModal } from '@/components/UserPrizeClaimModal'
import { ScratchCanvas } from '@/components/ScratchCanvas'

type Phase = 'idle' | 'revealing' | 'done'

function fireWinConfetti() {
  const colors = ['#f25100', '#E9A23B', '#FFD700', '#FBE08A', '#496B71']
  // Center burst
  confetti({
    particleCount: 110,
    spread: 80,
    startVelocity: 42,
    origin: { y: 0.55 },
    colors,
    disableForReducedMotion: true,
  })
  // Side cannons
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    startVelocity: 45,
    origin: { x: 0, y: 0.7 },
    colors,
    disableForReducedMotion: true,
  })
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    startVelocity: 45,
    origin: { x: 1, y: 0.7 },
    colors,
    disableForReducedMotion: true,
  })
  // Delayed golden shower
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      startVelocity: 28,
      decay: 0.92,
      scalar: 1.1,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#FBE08A', '#E9A23B'],
      disableForReducedMotion: true,
    })
  }, 220)
}

function isAutoWalletPrize(type?: string) {
  return type === 'SiteCredit' || type === 'Cash'
}

function CountUp({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  const text = Number.isInteger(value) ? Math.round(display).toString() : display.toFixed(2)
  return <>{text}</>
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
  const [attempt, setAttempt] = useState(0)

  const queueBootstrapped = useRef(false)
  const isRevealingRef = useRef(false)
  const apiPromiseRef = useRef<Promise<TicketRevealResult> | null>(null)

  const currentTicket = queue[0] ?? null

  // Bootstrap local queue once — avoids React Query updates mid-animation
  useEffect(() => {
    if (!isLoading && !queueBootstrapped.current && unrevealedFromServer.length > 0) {
      queueBootstrapped.current = true
      setQueue(unrevealedFromServer)
    }
  }, [isLoading, unrevealedFromServer])

  // Fire the reveal API the moment the user first touches the foil, so the
  // result is loaded and waiting beneath the card by the time they scratch through.
  const handleScratchStart = useCallback(() => {
    if (!currentTicket || phase !== 'idle' || isRevealingRef.current) return

    isRevealingRef.current = true
    setError(null)
    setRevealResult(null)
    setClaimFulfillmentId(null)
    setPhase('revealing')

    if ('vibrate' in navigator) navigator.vibrate(10)

    const apiPromise = revealTicket(currentTicket.id)
    apiPromiseRef.current = apiPromise

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
        apiPromiseRef.current = null
        setAttempt((a) => a + 1) // remount the foil so the user can retry
      })
  }, [currentTicket, phase, revealTicket])

  // Fires once the user has scratched past the reveal threshold.
  const handleScratchComplete = useCallback(async () => {
    const apiPromise = apiPromiseRef.current
    try {
      // Wait for both the result AND the foil fade-out (~450ms) so the
      // canvas only unmounts once it has visually cleared.
      const [result] = await Promise.all([
        apiPromise ?? Promise.resolve(null),
        new Promise<void>((resolve) => setTimeout(resolve, 480)),
      ])
      setPhase('done')
      if (result?.hasPrize && result.prize) {
        if ('vibrate' in navigator) navigator.vibrate([30, 20, 50])
        fireWinConfetti()
      }
    } catch {
      // handled in handleScratchStart's catch
    } finally {
      isRevealingRef.current = false
    }
  }, [])

  const handleNext = async () => {
    const nextQueue = queue.slice(1)
    setQueue(nextQueue)
    setRevealResult(null)
    setClaimFulfillmentId(null)
    setShowClaimModal(false)
    setError(null)
    setPhase('idle')
    setAttempt(0)
    isRevealingRef.current = false
    apiPromiseRef.current = null

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
  const showResult = revealResult !== null && phase !== 'idle'
  const isWin = showResult && revealResult.hasPrize && revealResult.prize

  return (
    <div className="min-h-screen py-6 flex flex-col items-center justify-center relative" style={{ backgroundColor: '#fffbf7' }}>
      <button
        onClick={() => navigate('/account?tab=tickets')}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 cursor-pointer"
        style={{ border: '1px solid #d1d5db' }}
        aria-label="Close"
      >
        <X size={20} className="text-gray-600" />
      </button>

      <div className="relative z-10 max-w-md w-full px-4">
        <div className="text-center mb-5">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm mb-3 shadow-lg"
            style={{ backgroundColor: '#496B71', color: 'white' }}
          >
            <Zap size={16} fill="currentColor" /> Instant Win
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#2D251E' }}>
            {phase === 'done' ? 'Result' : 'Scratch to Reveal'}
          </h1>
          <p className="text-stone-500 font-medium">Ticket #{currentTicket.ticket_number}</p>
          <p className="text-sm text-stone-400 mt-1">{currentTicket.competition?.title}</p>
        </div>

        {/* Single card — no mount/unmount between scratch and result */}
        <div
          className="bg-white rounded-[2rem] p-2 shadow-2xl transition-shadow duration-500"
          style={{
            border: isWin && phase === 'done' ? '1px solid #F2C879' : '1px solid #d1d5db',
            boxShadow:
              isWin && phase === 'done'
                ? '0 0 0 3px rgba(242,200,121,0.55), 0 18px 50px rgba(242,200,121,0.45)'
                : undefined,
          }}
        >
          <div
            className="relative rounded-[1.5rem] overflow-hidden border-4 border-dashed aspect-square"
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
                <>
                  {/* Festive celebration backdrop (full-bleed) */}
                  <div className="absolute inset-0 overflow-hidden" aria-hidden>
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 42%, #FFFCF4 0%, #FDECCC 52%, #F4C97E 100%)',
                      }}
                    />
                    <span className="absolute text-lg animate-[twinkle_1.7s_ease-in-out_infinite]" style={{ left: '16%', top: '20%' }}>✨</span>
                    <span className="absolute text-sm animate-[twinkle_2.1s_ease-in-out_infinite]" style={{ right: '18%', top: '24%', animationDelay: '0.4s' }}>✨</span>
                    <span className="absolute text-base animate-[twinkle_1.9s_ease-in-out_infinite]" style={{ left: '22%', bottom: '20%', animationDelay: '0.8s' }}>⭐</span>
                    <span className="absolute text-sm animate-[twinkle_2.3s_ease-in-out_infinite]" style={{ right: '15%', bottom: '24%', animationDelay: '0.2s' }}>✨</span>
                  </div>

                  {/* Content */}
                  <div
                    className="relative z-10 flex flex-col items-center w-full animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{ animationFillMode: 'both' }}
                  >
                    <div className="relative mb-4 flex items-center justify-center">
                      {/* Coin burst — one-shot explosion from the medallion */}
                      {Array.from({ length: 14 }).map((_, i) => {
                        const ang = (Math.PI * 2 * i) / 14
                        const dist = 64 + (i % 3) * 20
                        return (
                          <span
                            key={i}
                            className="absolute text-base"
                            style={{
                              left: '50%',
                              top: '50%',
                              ['--tx' as string]: `${Math.cos(ang) * dist}px`,
                              ['--ty' as string]: `${Math.sin(ang) * dist}px`,
                              animation: 'coinBurst 0.9s ease-out 0.15s both',
                            }}
                          >
                            🪙
                          </span>
                        )
                      })}
                      <div
                        className="absolute -inset-2 rounded-full"
                        style={{ animation: 'glowPulse 1.6s ease-in-out infinite' }}
                      />
                      <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #FBE08A 0%, #E9A23B 100%)' }}
                      >
                        {isAutoWalletPrize(revealResult.prize!.type) ? (
                          <Wallet size={38} className="text-white drop-shadow" strokeWidth={2.2} />
                        ) : (
                          <Trophy size={38} className="text-white drop-shadow" strokeWidth={2.2} />
                        )}
                      </div>
                    </div>

                    <h2
                      className="text-4xl font-extrabold tracking-tight mb-0.5"
                      style={{
                        backgroundImage: 'linear-gradient(180deg, #F4A93B 0%, #D8740F 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.6))',
                      }}
                    >
                      YOU WON!
                    </h2>
                    <p className="text-sm font-semibold mb-4" style={{ color: '#A86A1B' }}>
                      Congratulations 🎉
                    </p>

                    <div
                      className="w-full rounded-2xl px-5 py-4 shadow-lg"
                      style={{ backgroundColor: 'white', border: '1px solid #F2C879' }}
                    >
                      <p className="text-[11px] uppercase tracking-wider font-bold mb-1" style={{ color: '#E0902F' }}>
                        Your Prize
                      </p>
                      <p className="text-lg font-extrabold leading-tight" style={{ color: '#2D251E' }}>
                        {revealResult.prize!.short_name || revealResult.prize!.name}
                      </p>
                      {revealResult.prize!.value_gbp && (
                        <>
                          <p
                            className="mt-2 text-4xl font-black tabular-nums leading-none"
                            style={{
                              backgroundImage: 'linear-gradient(180deg, #F4A93B 0%, #D8740F 100%)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                            }}
                          >
                            £<CountUp value={revealResult.prize!.value_gbp} />
                          </p>
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: '#B26B12' }}>
                            {isAutoWalletPrize(revealResult.prize!.type) ? (
                              <>
                                <Wallet size={13} /> Added straight to your wallet
                              </>
                            ) : (
                              <>Ready to claim</>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </>
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

            {/* Real scratch-off foil — drag to scratch */}
            {phase !== 'done' && (
              <ScratchCanvas
                key={`${currentTicket.id}-${attempt}`}
                onStart={handleScratchStart}
                onComplete={handleScratchComplete}
                threshold={0.5}
                label="SCRATCH"
                label2="& win"
              />
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {phase === 'done' && revealResult && (
          <div className="mt-6 space-y-3 animate-[fadeIn_0.3s_ease-out]">
            {isWin &&
              !isAutoWalletPrize(revealResult.prize!.type) &&
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
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes coinBurst {
          0% { transform: translate(-50%, -50%) translate(0, 0) scale(0.3) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1) rotate(220deg); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(242,200,121,0.30), 0 0 24px 6px rgba(233,162,59,0.35); }
          50% { box-shadow: 0 0 0 12px rgba(242,200,121,0.12), 0 0 40px 12px rgba(233,162,59,0.5); }
        }
      `}</style>
    </div>
  )
}
