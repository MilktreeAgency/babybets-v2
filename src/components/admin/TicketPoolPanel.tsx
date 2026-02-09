import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Lock, Unlock, RefreshCw, CheckCircle, XCircle, AlertTriangle, Loader, BarChart3, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Competition } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TicketPoolStats {
  competition_id: string
  is_locked: boolean
  generated_at: string | null
  max_tickets: number
  tickets_sold: number
  tickets_available: number
  tickets_with_prizes: number
  tickets_revealed: number
  prize_breakdown: Array<{
    prize_name: string
    total_quantity: number
    remaining_quantity: number
    allocated: number
  }>
}

interface TicketPoolPanelProps {
  competition: Competition
  onPoolGenerated?: () => void
}

export function TicketPoolPanel({ competition, onPoolGenerated }: TicketPoolPanelProps) {
  const [stats, setStats] = useState<TicketPoolStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showGenerationAnimation, setShowGenerationAnimation] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  useEffect(() => {
    loadStats()
  }, [competition.id])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.rpc('get_ticket_pool_stats', {
        p_competition_id: competition.id,
      })

      if (error) throw error
      setStats(data as unknown as TicketPoolStats)
    } catch (err) {
      console.error('Error loading ticket pool stats:', err)
      setError('Failed to load ticket pool statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePool = async () => {
    setError(null)
    setSuccess(null)
    setShowConfirmModal(false)
    setShowGenerationAnimation(true)
    setIsGenerating(true)

    try {
      // Simulate progress animation
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const { data, error } = await supabase.rpc('generate_ticket_pool', {
        p_competition_id: competition.id,
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (error) throw error

      await new Promise((resolve) => setTimeout(resolve, 500))

      const result = data as unknown as { success: boolean; tickets_generated: number; prizes_allocated: number; message: string }
      setSuccess(result.message)
      await loadStats()

      if (onPoolGenerated) {
        onPoolGenerated()
      }

      setTimeout(() => {
        setShowGenerationAnimation(false)
        setGenerationProgress(0)
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ticket pool'
      setError(errorMessage)
      setShowGenerationAnimation(false)
      setGenerationProgress(0)
      console.error('Error generating ticket pool:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-admin-card-bg rounded-lg p-6 border border-border">
        <div className="flex items-center justify-center py-8">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const canGenerate = !stats?.is_locked && stats?.tickets_sold === 0

  return (
    <>
      <div className="bg-admin-card-bg rounded-lg p-6 border border-border">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="size-5" />
            Ticket Pool Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-allocated ticket system with instant win prize distribution
          </p>
        </div>

        {/* Pool Status */}
        <div className="mb-6">
          {stats?.is_locked ? (
            <div className="p-4 bg-admin-success-bg rounded-lg border border-admin-success-fg flex items-start gap-3">
              <Lock className="size-5 text-admin-success-fg shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Pool Locked & Ready</p>
                <p className="text-sm text-muted-foreground">
                  Generated {new Date(stats.generated_at!).toLocaleString('en-GB')}
                </p>
              </div>
            </div>
          ) : canGenerate ? (
            <div className="p-4 bg-admin-info-bg rounded-lg border border-admin-info-fg flex items-start gap-3">
              <Unlock className="size-5 text-admin-info-fg shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Ready to Generate</p>
                <p className="text-sm text-muted-foreground">
                  Pool not yet generated. Generate tickets before activating competition.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-admin-orange-bg rounded-lg border border-admin-orange-fg flex items-start gap-3">
              <AlertTriangle className="size-5 text-admin-orange-fg shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Cannot Generate</p>
                <p className="text-sm text-muted-foreground">
                  {(stats?.tickets_sold ?? 0) > 0
                    ? 'Tickets already sold. Cannot regenerate pool.'
                    : 'Pool generation not available.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-admin-hover-bg rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Ticket className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Tickets</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.max_tickets.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-admin-hover-bg rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="size-4 text-admin-success-fg" />
                  <span className="text-xs text-muted-foreground">Sold</span>
                </div>
                <p className="text-2xl font-bold text-admin-success-fg">{stats.tickets_sold.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-admin-hover-bg rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Unlock className="size-4 text-admin-info-fg" />
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
                <p className="text-2xl font-bold text-admin-info-fg">{stats.tickets_available.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-admin-hover-bg rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="size-4 text-admin-purple-fg" />
                  <span className="text-xs text-muted-foreground">With Prizes</span>
                </div>
                <p className="text-2xl font-bold text-admin-purple-fg">{stats.tickets_with_prizes.toLocaleString()}</p>
              </div>
            </div>

            {/* Prize Breakdown */}
            {stats.prize_breakdown && stats.prize_breakdown.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="size-4" />
                  Prize Distribution
                </h4>
                <div className="space-y-2">
                  {stats.prize_breakdown.map((prize, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-admin-hover-bg rounded-lg">
                      <span className="text-sm font-medium text-foreground">{prize.prize_name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Total: <span className="font-semibold text-foreground">{prize.total_quantity}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Won: <span className="font-semibold text-admin-orange-fg">{prize.allocated}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Remaining: <span className="font-semibold text-admin-success-fg">{prize.remaining_quantity}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-admin-error-bg rounded-lg border border-admin-error-border flex items-start gap-3">
            <XCircle className="size-5 text-admin-error-text shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Error</p>
              <p className="text-sm text-admin-error-text">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-admin-success-bg rounded-lg border border-admin-success-fg flex items-start gap-3"
          >
            <CheckCircle className="size-5 text-admin-success-fg shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Success!</p>
              <p className="text-sm text-muted-foreground">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Generate Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={!canGenerate || isGenerating}
          className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-admin-info-fg hover:bg-admin-info-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader className="size-5 animate-spin" />
              Generating Pool...
            </>
          ) : (
            <>
              <RefreshCw className="size-5" />
              Generate Ticket Pool
            </>
          )}
        </button>

        {stats?.is_locked && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Pool is locked and immutable. All {stats.max_tickets.toLocaleString()} tickets are pre-allocated.
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-admin-orange-fg" />
              Confirm Pool Generation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate the ticket pool? This action will:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Generate {competition.max_tickets.toLocaleString()} tickets with unique 7-digit codes</li>
            <li>Randomly distribute instant win prizes across the pool</li>
            <li>Lock the pool (becomes immutable)</li>
            <li>Cannot be regenerated once locked</li>
          </ul>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGeneratePool}
              disabled={isGenerating}
              className="cursor-pointer"
            >
              {isGenerating ? 'Generating...' : 'Generate Pool'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generation Animation Modal */}
      <AnimatePresence>
        {showGenerationAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm h-screen w-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-8 text-center max-w-md w-full mx-4 shadow-xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-6"
              >
                <RefreshCw className="size-16 text-gray-900" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Ticket Pool</h2>
              <p className="text-gray-600 text-sm mb-6">
                Creating {competition.max_tickets.toLocaleString()} pre-allocated tickets...
              </p>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-900 h-full rounded-full"
                />
              </div>

              <p className="text-gray-900 font-semibold text-base">{generationProgress}%</p>

              {generationProgress === 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="size-5 text-gray-900" />
                  <span className="text-gray-900 font-semibold">Complete!</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
