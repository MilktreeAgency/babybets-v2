import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, AlertTriangle, CheckCircle, XCircle, Loader, Shield, Hash, User, Ticket } from 'lucide-react'
import { useDraws } from '@/hooks/useDraws'
import type { Competition, Draw, DrawExecutionResult } from '@/types'

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

    try {
      const result = await executeDraw(competition.id)
      setDrawResult(result)
      setShowConfirmModal(false)

      if (onDrawExecuted) {
        onDrawExecuted()
      }

      // Reload the draw details
      await loadExistingDraw()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute draw'
      setError(errorMessage)
      console.error('Error executing draw:', err)
    }
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
      <div className="bg-white rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-green-100">
            <Trophy className="size-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Draw Completed</h3>
            <p className="text-sm text-gray-600">
              Executed on {new Date(existingDraw.executed_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Winner Info */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <User className="size-5 text-green-600" />
              <h4 className="font-bold text-gray-900">Winner</h4>
            </div>
            <p className="text-sm text-gray-700">
              User ID: <span className="font-mono">{existingDraw.winning_user_id}</span>
            </p>
            <p className="text-sm text-gray-700">
              Ticket ID: <span className="font-mono">{existingDraw.winning_ticket_id}</span>
            </p>
          </div>

          {/* Draw Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="size-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-600">Winner Index</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{existingDraw.winner_index}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="size-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-600">Random Source</span>
              </div>
              <p className="text-sm font-mono text-gray-700">{existingDraw.random_source}</p>
            </div>
          </div>

          {/* Verification Hash */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="size-5 text-blue-600" />
              <h4 className="font-bold text-gray-900">Verification Hash</h4>
            </div>
            <p className="text-xs font-mono text-gray-600 break-all">{existingDraw.verification_hash}</p>
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
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-orange-100">
            <Trophy className="size-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Main Prize Draw</h3>
            <p className="text-sm text-gray-600">
              Execute the cryptographically secure prize draw
            </p>
          </div>
        </div>

        {/* Eligibility Status */}
        <div className="mb-6">
          {canExecuteDraw ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Ready to Execute</p>
                <p className="text-sm text-green-700">
                  This competition has {competition.tickets_sold} tickets sold and is ready for the draw.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-3">
              <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Not Eligible</p>
                <p className="text-sm text-yellow-700">
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
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Tickets Sold</span>
            <span className="font-semibold text-gray-900">{competition.tickets_sold}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Competition Status</span>
            <span className="font-semibold text-gray-900 capitalize">{competition.status}</span>
          </div>
          {competition.draw_datetime && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Scheduled Draw Time</span>
              <span className="font-semibold text-gray-900">
                {new Date(competition.draw_datetime).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
            <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {drawResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">Draw Executed Successfully!</p>
                <div className="text-sm text-green-700 space-y-1">
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
          className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

        <p className="text-xs text-gray-500 text-center mt-3">
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
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <AlertTriangle className="size-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Draw Execution</h3>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to execute the draw for this competition? This action cannot be undone
                and will:
              </p>

              <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-2">
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
                  className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDraw}
                  disabled={isExecutingDraw}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isExecutingDraw ? 'Executing...' : 'Execute Draw'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
