import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, AlertTriangle, CheckCircle, XCircle, Loader, Shield, Hash, User, Ticket, Sparkles } from 'lucide-react'
import { useDraws } from '@/hooks/useDraws'
import type { Competition, Draw, DrawExecutionResult } from '@/types'

const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6BCF7F']

interface DrawExecutionPanelProps {
  competition: Competition
  onDrawExecuted?: () => void
}

export function DrawExecutionPanel({ competition, onDrawExecuted }: DrawExecutionPanelProps) {
  const { executeDraw, isExecutingDraw, verifyDraw, isVerifyingDraw, getDrawByCompetitionId } = useDraws()
  const [existingDraw, setExistingDraw] = useState<Draw | null>(null)
  const [drawResult, setDrawResult] = useState<DrawExecutionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDrawAnimation, setShowDrawAnimation] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'scanning' | 'selecting' | 'winner'>('scanning')
  const [scanningTickets, setScanningTickets] = useState<number[]>([])
  const [finalWinner, setFinalWinner] = useState<DrawExecutionResult | null>(null)

  useEffect(() => {
    loadExistingDraw()
  }, [competition.id])

  const loadExistingDraw = async () => {
    try {
      const draw = await getDrawByCompetitionId(competition.id)
      setExistingDraw(draw)
    } catch (err) {
      console.error('Error loading draw:', err)
    }
  }

  const handleExecuteDraw = async () => {
    setError(null)
    setDrawResult(null)
    setShowConfirmModal(false)
    setShowDrawAnimation(true)
    setAnimationPhase('scanning')

    // Generate random ticket numbers for animation
    const ticketNumbers = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * competition.tickets_sold) + 1
    )
    setScanningTickets(ticketNumbers)

    try {
      // Phase 1: Scanning animation (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setAnimationPhase('selecting')

      // Execute the actual draw
      const result = await executeDraw(competition.id)

      // Phase 2: Selecting animation (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setAnimationPhase('winner')
      setFinalWinner(result)
      setDrawResult(result)

      // Phase 3: Show winner (user must click to close)

      if (onDrawExecuted) {
        onDrawExecuted()
      }

      // Reload the draw details
      await loadExistingDraw()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute draw'
      setError(errorMessage)
      setShowDrawAnimation(false)
      console.error('Error executing draw:', err)
    }
  }

  const handleCloseDrawAnimation = () => {
    setShowDrawAnimation(false)
    setAnimationPhase('scanning')
    setFinalWinner(null)
  }

  const handleVerifyDraw = async () => {
    if (!existingDraw) return

    try {
      const result = await verifyDraw(existingDraw.id)

      if (result.valid) {
        alert('✓ Draw verified successfully! All cryptographic checks passed.')
      } else {
        alert(`✗ Draw verification failed!\n\nDetails:\n${JSON.stringify(result.checks, null, 2)}`)
      }
    } catch (err) {
      console.error('Error verifying draw:', err)
      alert('Failed to verify draw')
    }
  }

  // Check if competition is eligible for draw
  const isEligibleForDraw = () => {
    if (existingDraw) return false // Already drawn
    if (!['closed', 'active'].includes(competition.status)) return false
    if (competition.tickets_sold === 0) return false
    return true
  }

  const canExecuteDraw = isEligibleForDraw()

  // If draw already exists, show draw results
  if (existingDraw) {
    return (
      <div className="bg-white rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="size-5 text-green-600" />
              Draw Completed
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Executed on {new Date(existingDraw.executed_at).toLocaleString('en-GB')}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        </div>

        <div className="space-y-4">
          {/* Winner Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <User className="size-4" />
              Winner Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <p className="font-mono font-medium mt-1">{existingDraw.winning_user_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ticket ID:</span>
                <p className="font-mono font-medium mt-1">{existingDraw.winning_ticket_id}</p>
              </div>
            </div>
          </div>

          {/* Draw Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Winner Index</span>
              </div>
              <p className="text-xl font-bold text-foreground">{existingDraw.winner_index}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Random Source</span>
              </div>
              <p className="text-sm font-mono text-foreground">{existingDraw.random_source}</p>
            </div>
          </div>

          {/* Verification Hash */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">Verification Hash</h4>
            </div>
            <p className="text-xs font-mono text-muted-foreground break-all bg-gray-50 p-3 rounded-lg">
              {existingDraw.verification_hash}
            </p>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyDraw}
            disabled={isVerifyingDraw}
            className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifyingDraw ? (
              <>
                <Loader className="size-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="size-5" />
                Verify Draw Integrity
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Show draw execution panel
  return (
    <>
      <div className="bg-white rounded-lg p-6 border border-border">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="size-5" />
            Main Prize Draw
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Execute the cryptographically secure prize draw
          </p>
        </div>

        {/* Eligibility Status */}
        <div className="mb-6">
          {canExecuteDraw ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-border flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Ready to Execute</p>
                <p className="text-sm text-muted-foreground">
                  This competition has {competition.tickets_sold} tickets sold and is ready for the draw.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-border flex items-start gap-3">
              <AlertTriangle className="size-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Not Eligible</p>
                <p className="text-sm text-muted-foreground">
                  {competition.tickets_sold === 0
                    ? 'No tickets have been sold yet.'
                    : `Competition status must be "closed" or "active". Current status: ${competition.status}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Draw Info */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Total Tickets Sold</span>
            <span className="font-semibold text-foreground">{competition.tickets_sold}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Competition Status</span>
            <span className="font-semibold text-foreground capitalize">{competition.status}</span>
          </div>
          {competition.draw_datetime && (
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Scheduled Draw Time</span>
              <span className="font-semibold text-foreground">
                {new Date(competition.draw_datetime).toLocaleString('en-GB')}
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-border flex items-start gap-3">
            <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {drawResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-gray-50 rounded-lg border border-border"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-2">Draw Executed Successfully!</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Winner: {drawResult.winner_display_name}</p>
                  <p>Ticket: #{drawResult.winning_ticket_number}</p>
                  <p>Index: {drawResult.winner_index} of {drawResult.total_entries}</p>
                  <p className="font-mono text-xs break-all">Hash: {drawResult.verification_hash}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Execute Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={!canExecuteDraw || isExecutingDraw}
          className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isExecutingDraw ? (
            <>
              <Loader className="size-5 animate-spin" />
              Executing Draw...
            </>
          ) : (
            <>
              <Trophy className="size-5" />
              Execute Draw
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          This action will use cryptographically secure randomness to select a winner
        </p>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-border"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="size-5 text-orange-600" />
                  Confirm Draw Execution
                </h3>
              </div>

              <p className="text-muted-foreground mb-4">
                Are you sure you want to execute the draw for this competition? This action cannot be undone
                and will:
              </p>

              <ul className="list-disc list-inside text-sm text-muted-foreground mb-6 space-y-1">
                <li>Lock the competition (status → "drawing")</li>
                <li>Create a deterministic snapshot of all tickets</li>
                <li>Generate a cryptographically secure random seed</li>
                <li>Select a winner using verifiable randomness</li>
                <li>Create an immutable audit trail</li>
                <li>Update competition status to "drawn"</li>
              </ul>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg font-medium border border-border bg-white hover:bg-gray-50 text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDraw}
                  disabled={isExecutingDraw}
                  className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isExecutingDraw ? 'Executing...' : 'Execute Draw'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Draw Animation Modal */}
      <AnimatePresence>
        {showDrawAnimation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full max-w-2xl mx-4"
            >
              {/* Scanning Phase */}
              {animationPhase === 'scanning' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="inline-block mb-6"
                  >
                    <Loader className="size-16 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-4">Scanning Tickets...</h2>
                  <p className="text-white/80 text-lg mb-8">
                    Analyzing {competition.tickets_sold.toLocaleString()} entries
                  </p>

                  {/* Animated ticket numbers */}
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {scanningTickets.slice(0, 10).map((num, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: [0, 1, 0], y: 0 }}
                        transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
                        className="bg-white/20 backdrop-blur-sm rounded-lg py-3 px-2 text-white font-mono font-bold"
                      >
                        #{num}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Selecting Phase */}
              {animationPhase === 'selecting' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block mb-6"
                  >
                    <Sparkles className="size-16 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-4">Selecting Winner...</h2>
                  <p className="text-white/80 text-lg">
                    Using cryptographically secure randomness
                  </p>

                  {/* Pulsing effect */}
                  <div className="mt-8 flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                        className="w-3 h-3 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Winner Phase */}
              {animationPhase === 'winner' && finalWinner && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-center relative overflow-hidden"
                >
                  {/* Confetti */}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -20, x: Math.random() * 600 - 300, opacity: 1 }}
                      animate={{
                        y: 600,
                        rotate: Math.random() * 360,
                        opacity: 0
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 0.5,
                        ease: 'easeOut'
                      }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ backgroundColor: confettiColors[i % confettiColors.length] }}
                    />
                  ))}

                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10"
                  >
                    <Trophy className="size-20 text-white mx-auto mb-6" />
                    <h2 className="text-4xl font-bold text-white mb-2">🎉 Winner Selected! 🎉</h2>
                    <p className="text-white/90 text-lg mb-6">Congratulations to our lucky winner!</p>

                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 mb-6">
                      <div className="text-white/80 text-sm mb-2">Winner Name</div>
                      <div className="text-3xl font-bold text-white mb-4">{finalWinner.winner_display_name}</div>

                      <div className="grid grid-cols-2 gap-4 text-white">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white/70 text-xs mb-1">Ticket Number</div>
                          <div className="text-xl font-mono font-bold">#{finalWinner.winning_ticket_number}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white/70 text-xs mb-1">Winner Index</div>
                          <div className="text-xl font-mono font-bold">{finalWinner.winner_index}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseDrawAnimation}
                      className="bg-white text-orange-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/90 transition-colors cursor-pointer"
                    >
                      Continue
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
