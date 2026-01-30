import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Competition = Database['public']['Tables']['competitions']['Row']

export default function Competitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    loadCompetitions()
  }, [statusFilter, categoryFilter])

  const loadCompetitions = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as Database['public']['Enums']['competition_status'])
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as Database['public']['Enums']['competition_category'])
      }

      const { data, error } = await query

      if (error) throw error
      setCompetitions(data || [])
    } catch (error) {
      console.error('Error loading competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCompetitions = competitions.filter((comp) =>
    comp.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Competitions' }]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Competitions</h1>
              <p className="text-muted-foreground mt-1">
                Manage competitions, instant wins, and prize draws
              </p>
            </div>
            <Link
              to="/admin/dashboard/competitions/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              Create Competition
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search competitions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ending_soon">Ending Soon</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="drawing">Drawing</SelectItem>
                    <SelectItem value="drawn">Drawn</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Toys">Toys</SelectItem>
                    <SelectItem value="Baby & Nursery">Baby & Nursery</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Instant Wins">Instant Wins</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Competitions Table */}
          <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading competitions...</p>
              </div>
            ) : filteredCompetitions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No competitions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-admin-hover-bg border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tickets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCompetitions.map((competition) => (
                      <tr key={competition.id} className="hover:bg-admin-hover-bg cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-foreground">{competition.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {competition.category}
                                {competition.is_featured && (
                                  <span className="ml-2 text-xs bg-admin-warning-bg text-admin-warning-fg px-2 py-0.5 rounded">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground capitalize">
                          {competition.competition_type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              competition.status || ''
                            )}`}
                          >
                            {(competition.status || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {(competition.tickets_sold || 0).toLocaleString()} /{' '}
                          {competition.max_tickets.toLocaleString()}
                          <div className="mt-1 w-24 bg-admin-gray-bg rounded-full h-1.5">
                            <div
                              className="bg-admin-info-fg h-1.5 rounded-full"
                              style={{
                                width: `${((competition.tickets_sold || 0) / competition.max_tickets) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          £{(competition.base_ticket_price_pence / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {new Date(competition.end_datetime).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <Link
                            to={`/admin/dashboard/competitions/${competition.id}`}
                            className="text-admin-info-fg hover:text-admin-info-text font-medium cursor-pointer"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
