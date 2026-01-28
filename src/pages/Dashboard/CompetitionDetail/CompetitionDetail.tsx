import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components'
import {
  Edit,
  Trash2,
  Play,
  Pause,
  Trophy,
  Users,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { DrawExecutionPanel } from '@/components/admin/DrawExecutionPanel'

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

    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status: newStatus as Database['public']['Enums']['competition_status'] })
        .eq('id', competition.id)

      if (error) throw error

      setCompetition({ ...competition, status: newStatus as Database['public']['Enums']['competition_status'] })
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update competition status')
    }
  }

  const handleDelete = async () => {
    if (!competition) return
    if (!confirm('Are you sure you want to delete this competition? This action cannot be undone.')) return

    try {
      const { error } = await supabase.from('competitions').delete().eq('id', competition.id)

      if (error) throw error
      navigate('/admin/dashboard/competitions')
    } catch (error) {
      console.error('Error deleting competition:', error)
      alert('Failed to delete competition')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      ending_soon: 'bg-orange-100 text-orange-800',
      sold_out: 'bg-purple-100 text-purple-800',
      closed: 'bg-red-100 text-red-800',
      drawing: 'bg-yellow-100 text-yellow-800',
      drawn: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-600',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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
          <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
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
              className="text-blue-600 hover:text-blue-700 font-medium"
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{competition.category} • {(competition.competition_type || '').replace(/_/g, ' ')}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/admin/dashboard/competitions/${competition.id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="size-4" />
                Edit
              </button>
              {competition.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('scheduled')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="size-4" />
                  Publish
                </button>
              )}
              {competition.status === 'active' && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Pause className="size-4" />
                  Close
                </button>
              )}
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  <p className="text-xl font-semibold">
                    {(competition.tickets_sold || 0).toLocaleString()} / {competition.max_tickets.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(ticketsSoldPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{ticketsSoldPercentage.toFixed(1)}% sold</p>
            </div>

            <div className="bg-white border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-semibold">£{(revenue / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-xl font-semibold">{stats?.total_orders || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
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
              <div className="bg-white border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Competition Details</h3>
                {(() => {
                  const images = (competition.images as string[]) || []
                  const displayImage = images.length > 0 ? images[0] : competition.image_url

                  return (
                    <>
                      {displayImage && (
                        <div className="mb-4">
                          <img
                            src={displayImage}
                            alt={competition.title}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              {images.slice(1).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`${competition.title} ${idx + 2}`}
                                  className="h-20 w-full object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}
                <p className="text-foreground whitespace-pre-wrap">{competition.description}</p>
              </div>

              {/* Instant Win Prizes */}
              {instantWinPrizes.length > 0 && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Instant Win Prizes</h3>
                  <div className="space-y-3">
                    {instantWinPrizes.map((prize) => (
                      <div key={prize.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{prize.name}</p>
                          <p className="text-sm text-muted-foreground">
                            £{prize.value_gbp.toFixed(2)} • Tier {prize.tier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {prize.total_quantity - prize.remaining_quantity} / {prize.total_quantity} claimed
                          </p>
                          <div className="mt-1 w-24 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-600 h-1.5 rounded-full"
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
              <div className="bg-white border border-border rounded-lg p-6">
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
              <div className="bg-white border border-border rounded-lg p-6">
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
              <div className="bg-white border border-border rounded-lg p-6">
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

              {/* Main Prize Draw */}
              {(competition.competition_type === 'standard' ||
                competition.competition_type === 'instant_win_with_end_prize') && (
                <DrawExecutionPanel competition={competition} onDrawExecuted={loadCompetitionDetails} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
