import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../../components'
import {
  Edit,
  Trash2,
  Play,
  Pause,
  Trophy,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { DrawExecutionPanel } from '@/components/admin/DrawExecutionPanel'
import { TicketPoolPanel } from '@/components/admin/TicketPoolPanel'
import { RichTextDisplay } from '@/components/ui/RichTextDisplay'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type Competition = Database['public']['Tables']['competitions']['Row']

interface InstantWinPrize {
  id: string
  competition_id: string
  prize_code: string
  name: string
  short_name: string | null
  type: string
  value_gbp: number
  cash_alternative_gbp: number | null
  total_quantity: number
  remaining_quantity: number
  image_url: string | null
  tier: number
}

interface CompetitionStats {
  total_revenue: number
  total_orders: number
  tickets_sold: number
  unique_participants: number
}

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [stats, setStats] = useState<CompetitionStats | null>(null)
  const [instantWinPrizes, setInstantWinPrizes] = useState<InstantWinPrize[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadCompetitionDetails()
    }
  }, [id])

  const loadCompetitionDetails = async () => {
    if (!id) return

    try {
      setLoading(true)

      // Load competition using typed query
      const { data: compData, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', id)
        .single()

      if (compError) throw compError
      setCompetition(compData)

      // Load competition stats using RPC function
      const { data: statsData, error: statsError } = await supabase.rpc('get_competition_stats', {
        competition_id: id,
      })

      if (statsError) throw statsError
      setStats(statsData as unknown as CompetitionStats)

      // Load instant win prizes if applicable
      if (
        compData.competition_type === 'instant_win' ||
        compData.competition_type === 'instant_win_with_end_prize'
      ) {
        const { data: prizes, error: prizesError } = await supabase
          .from('competition_instant_win_prizes')
          .select(`
            *,
            prize_templates (
              id,
              name,
              short_name,
              type,
              value_gbp,
              cash_alternative_gbp,
              image_url
            )
          `)
          .eq('competition_id', id)
          .order('tier', { ascending: true })

        if (!prizesError && prizes) {
          // Map the joined data to the expected format
          const mappedPrizes = prizes.map((p: Record<string, unknown>) => {
            const template = p.prize_templates as Record<string, unknown>
            return {
              id: p.id,
              competition_id: p.competition_id,
              prize_code: p.prize_code,
              name: template.name,
              short_name: template.short_name,
              type: template.type,
              value_gbp: template.value_gbp,
              cash_alternative_gbp: template.cash_alternative_gbp,
              total_quantity: p.total_quantity,
              remaining_quantity: p.remaining_quantity,
              image_url: template.image_url,
              tier: p.tier,
            }
          })
          setInstantWinPrizes(mappedPrizes as InstantWinPrize[])
        }
      }
    } catch (error) {
      console.error('Error loading competition details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!competition) return

    // Validate ticket pool for all competition types before activation
    const isActivating = newStatus === 'active' || newStatus === 'scheduled'

    if (isActivating && !competition.ticket_pool_locked) {
      setErrorMessage('Cannot activate competition without generating the ticket pool first.\n\nPlease generate the ticket pool using the "Generate Ticket Pool" button below before activating this competition.')
      setErrorDialogOpen(true)
      return
    }

    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status: newStatus as Database['public']['Enums']['competition_status'] })
        .eq('id', competition.id)

      if (error) {
        console.error('Status update error:', error)
        setErrorMessage(error.message || 'Failed to update competition status')
        setErrorDialogOpen(true)
        return
      }

      setCompetition({ ...competition, status: newStatus as Database['public']['Enums']['competition_status'] })
    } catch (error) {
      console.error('Error updating status:', error)
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrorMessage(errorMsg)
      setErrorDialogOpen(true)
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!competition) return

    setIsDeleting(true)

    try {
      const { error } = await supabase.from('competitions').delete().eq('id', competition.id)

      if (error) {
        console.error('Delete error:', error)
        let errorMsg = error.message

        // Add helpful hints based on error codes
        if (error.code === '42501') {
          errorMsg += '\n\nHint: You may not have permission to delete this competition. Make sure you are an admin and the RLS policy allows deletion.'
        } else if (error.code === '23503') {
          errorMsg += '\n\nHint: This competition has related records that must be deleted first, or CASCADE DELETE must be set up.'
        }

        setErrorMessage(errorMsg)
        setErrorDialogOpen(true)
        setDeleteDialogOpen(false)
        return
      }

      setDeleteDialogOpen(false)
      navigate('/admin/dashboard/competitions')
    } catch (error) {
      console.error('Error deleting competition:', error)
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrorMessage(errorMsg)
      setErrorDialogOpen(true)
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-admin-gray-bg text-admin-gray-text',
      scheduled: 'bg-admin-info-bg text-admin-info-fg',
      active: 'bg-admin-success-bg text-admin-success-fg',
      ending_soon: 'bg-admin-orange-bg text-admin-orange-fg',
      sold_out: 'bg-admin-purple-bg text-admin-purple-fg',
      closed: 'bg-admin-error-bg text-admin-error-text',
      drawing: 'bg-admin-warning-bg text-admin-warning-fg',
      drawn: 'bg-admin-purple-bg text-admin-purple-fg',
      completed: 'bg-admin-gray-bg text-admin-gray-text',
      cancelled: 'bg-admin-error-bg text-admin-error-text',
    }
    return colors[status] || 'bg-admin-gray-bg text-admin-gray-text'
  }

  if (loading) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Competitions', href: '/admin/dashboard/competitions' },
            { label: 'Loading...' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block size-8 border-4 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
        </div>
      </>
    )
  }

  if (!competition) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Competitions', href: '/admin/dashboard/competitions' },
            { label: 'Not Found' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Competition not found</p>
            <Link
              to="/admin/dashboard/competitions"
              className="text-admin-info-fg hover:text-admin-info-text font-medium cursor-pointer"
            >
              Back to Competitions
            </Link>
          </div>
        </div>
      </>
    )
  }

  const ticketsSoldPercentage = ((competition.tickets_sold || 0) / competition.max_tickets) * 100
  const revenue = stats?.total_revenue || 0

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Competitions', href: '/admin/dashboard/competitions' },
          { label: competition.title },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header with Actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{competition.title}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    competition.status!
                  )}`}
                >
                  {(competition.status || '').replace(/_/g, ' ')}
                </span>
                {competition.is_featured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-warning-bg text-admin-warning-fg">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{competition.category} • {(competition.competition_type || '').replace(/_/g, ' ')}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/admin/dashboard/competitions/${competition.id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-admin-hover-bg transition-colors cursor-pointer"
              >
                <Edit className="size-4" />
                Edit
              </button>
              {competition.status === 'draft' && (
                <button
                  onClick={() => {
                    // Check if start date is in the future or past to determine correct status
                    const now = new Date()
                    const startDate = new Date(competition.start_datetime)
                    const targetStatus = startDate > now ? 'scheduled' : 'active'
                    handleStatusChange(targetStatus)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-admin-success-fg text-white rounded-lg hover:bg-admin-success-text transition-colors cursor-pointer"
                >
                  <Play className="size-4" />
                  Publish
                </button>
              )}
              {competition.status === 'active' && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-admin-orange-fg text-white rounded-lg hover:bg-admin-orange-fg transition-colors cursor-pointer"
                >
                  <Pause className="size-4" />
                  Close
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-admin-error-text text-white rounded-lg hover:bg-admin-error-light transition-colors cursor-pointer"
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-admin-info-bg text-admin-info-fg rounded-lg">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  <p className="text-xl font-semibold">
                    {(competition.tickets_sold || 0).toLocaleString()} / {competition.max_tickets.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-3 w-full bg-admin-gray-bg rounded-full h-2">
                <div
                  className="bg-admin-info-fg h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(ticketsSoldPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{ticketsSoldPercentage.toFixed(1)}% sold</p>
            </div>

            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-admin-success-bg text-admin-success-fg rounded-lg">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-semibold">£{(revenue / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-admin-purple-bg text-admin-purple-fg rounded-lg">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-xl font-semibold">{stats?.total_orders || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-admin-orange-bg text-admin-orange-fg rounded-lg">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Participants</p>
                  <p className="text-xl font-semibold">{stats?.unique_participants || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Competition Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image & Description */}
              <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Competition Details</h3>
                {(() => {
                  const images = (competition.images as string[]) || []
                  const displayImage = images.length > 0 ? images[0] : competition.image_url

                  return (
                    <div className="space-y-4">
                      {displayImage && (
                        <div className="flex gap-3">
                          <img
                            src={displayImage}
                            alt={competition.title}
                            className="max-w-64 max-h-64 object-contain rounded-lg bg-admin-gray-bg"
                          />
                          {images.length > 1 && (
                            <div className="grid grid-cols-2 gap-2">
                              {images.slice(1).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`${competition.title} ${idx + 2}`}
                                  className="max-w-32 max-h-32 object-contain rounded-lg bg-admin-gray-bg"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        {competition.description && (
                          <RichTextDisplay content={competition.description} />
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Instant Win Prizes */}
              {instantWinPrizes.length > 0 && (
                <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Instant Win Prizes</h3>
                  <div className="space-y-3">
                    {instantWinPrizes.map((prize) => (
                      <div key={prize.id} className="flex items-center gap-4 p-4 bg-admin-hover-bg rounded-lg border border-border">
                        {prize.image_url && (
                          <img
                            src={prize.image_url}
                            alt={prize.name}
                            className="size-16 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{prize.name}</p>
                          <p className="text-sm text-muted-foreground">
                            £{prize.value_gbp.toFixed(2)} • Tier {prize.tier}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">
                            {prize.total_quantity - prize.remaining_quantity} / {prize.total_quantity} claimed
                          </p>
                          <div className="mt-1 w-24 bg-admin-gray-bg rounded-full h-1.5">
                            <div
                              className="bg-admin-success-fg h-1.5 rounded-full"
                              style={{ width: `${((prize.total_quantity - prize.remaining_quantity) / prize.total_quantity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Dates */}
              <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(competition.start_datetime).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(competition.end_datetime).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  {competition.draw_datetime && (
                    <div className="flex items-start gap-3">
                      <Trophy className="size-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Draw Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(competition.draw_datetime).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="text-lg font-semibold">
                      £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prize Value</p>
                    <p className="text-lg font-semibold">£{competition.total_value_gbp.toFixed(2)}</p>
                  </div>
                  {competition.retail_value_gbp && (
                    <div>
                      <p className="text-sm text-muted-foreground">Retail Value</p>
                      <p className="text-lg font-semibold">£{competition.retail_value_gbp.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Settings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max per user</span>
                    <span className="font-medium">{competition.max_tickets_per_user || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Show on homepage</span>
                    <span className="font-medium">{competition.show_on_homepage ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Featured</span>
                    <span className="font-medium">{competition.is_featured ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Pool Management */}
              <TicketPoolPanel competition={competition} onPoolGenerated={loadCompetitionDetails} />

              {/* Main Prize Draw */}
              {(competition.competition_type === 'standard' ||
                competition.competition_type === 'instant_win_with_end_prize') && (
                <DrawExecutionPanel competition={competition} onDrawExecuted={loadCompetitionDetails} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competition?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{competition?.title}</strong>?
              <br />
              <br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All competition data</li>
                <li>Associated orders and tickets</li>
                <li>Winner records</li>
                <li>Prize fulfillments</li>
              </ul>
              <br />
              <strong className="text-red-600">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-admin-error-text hover:bg-admin-error-light cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Competition'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-admin-error-text">
              <AlertCircle className="size-5" />
              Operation Failed
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>An error occurred:</p>
                <div className="bg-admin-error-bg border border-admin-error-border rounded-lg p-3 text-sm text-admin-error-text font-mono wrap-break-word whitespace-pre-wrap">
                  {errorMessage}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check the browser console for more details.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setErrorDialogOpen(false)} className="cursor-pointer">
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
