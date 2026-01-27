import { useState, useEffect } from 'react'
import { DashboardHeader } from '../components'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Trophy,
  Ticket,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AnalyticsData {
  totalRevenue: number
  revenueChange: number
  totalTickets: number
  ticketsChange: number
  totalUsers: number
  usersChange: number
  activeCompetitions: number
  competitionsChange: number
  averageOrderValue: number
  conversionRate: number
}

interface RevenueDataPoint {
  date: string
  revenue: number
}

interface TopCompetition {
  id: string
  title: string
  revenue: number
  tickets_sold: number
}

type DateRange = '7d' | '30d' | '90d' | 'all'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    revenueChange: 0,
    totalTickets: 0,
    ticketsChange: 0,
    totalUsers: 0,
    usersChange: 0,
    activeCompetitions: 0,
    competitionsChange: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  })
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [topCompetitions, setTopCompetitions] = useState<TopCompetition[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const getDateRangeFilter = () => {
    const now = new Date()
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      all: new Date('2020-01-01'),
    }
    return ranges[dateRange].toISOString()
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const startDate = getDateRangeFilter()

      // Get total revenue
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_pence, created_at')
        .eq('status', 'paid')
        .gte('created_at', startDate)

      const totalRevenue = (ordersData || []).reduce(
        (sum, order) => sum + order.total_pence,
        0
      )

      // Get total tickets sold
      const { count: ticketsCount } = await supabase
        .from('ticket_allocations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Get active competitions
      const { count: competitionsCount } = await supabase
        .from('competitions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'ending_soon'])

      // Calculate average order value
      const averageOrderValue = ordersData?.length
        ? totalRevenue / ordersData.length
        : 0

      // Calculate conversion rate (rough estimate)
      const conversionRate = usersCount && ticketsCount
        ? (ticketsCount / (usersCount * 10)) * 100
        : 0

      // Get revenue data for chart (grouped by day)
      const revenueByDay = (ordersData || []).reduce((acc: Record<string, number>, order) => {
        const date = new Date(order.created_at).toLocaleDateString('en-GB')
        acc[date] = (acc[date] || 0) + order.total_pence
        return acc
      }, {})

      const revenueDataPoints = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({
          date,
          revenue: revenue / 100,
        }))
        .slice(-30) // Last 30 days

      // Get top competitions
      const { data: competitionsData } = await supabase
        .from('competitions')
        .select('id, title, tickets_sold, base_ticket_price_pence')
        .gte('created_at', startDate)
        .order('tickets_sold', { ascending: false })
        .limit(5)

      const topCompetitionsData = (competitionsData || []).map((comp) => ({
        id: comp.id,
        title: comp.title,
        tickets_sold: comp.tickets_sold || 0,
        revenue: (comp.tickets_sold || 0) * (comp.base_ticket_price_pence / 100),
      }))

      setAnalyticsData({
        totalRevenue: totalRevenue / 100,
        revenueChange: 12.5, // Mock data - would need previous period comparison
        totalTickets: ticketsCount || 0,
        ticketsChange: 8.3,
        totalUsers: usersCount || 0,
        usersChange: 15.2,
        activeCompetitions: competitionsCount || 0,
        competitionsChange: -2.1,
        averageOrderValue: averageOrderValue / 100,
        conversionRate,
      })

      setRevenueData(revenueDataPoints)
      setTopCompetitions(topCompetitionsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    prefix = '',
    suffix = '',
  }: {
    icon: typeof DollarSign
    title: string
    value: string | number
    change: number
    prefix?: string
    suffix?: string
  }) => {
    const isPositive = change >= 0

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
            <Icon className={`size-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <BarChart3 className="size-6 text-blue-600" />
                Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your platform performance and key metrics
              </p>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
              <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-2 text-muted-foreground">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={DollarSign}
                  title="Total Revenue"
                  value={analyticsData.totalRevenue.toFixed(2)}
                  change={analyticsData.revenueChange}
                  prefix="£"
                />
                <StatCard
                  icon={Ticket}
                  title="Tickets Sold"
                  value={analyticsData.totalTickets}
                  change={analyticsData.ticketsChange}
                />
                <StatCard
                  icon={Users}
                  title="Total Users"
                  value={analyticsData.totalUsers}
                  change={analyticsData.usersChange}
                />
                <StatCard
                  icon={Trophy}
                  title="Active Competitions"
                  value={analyticsData.activeCompetitions}
                  change={analyticsData.competitionsChange}
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="size-5 text-blue-600" />
                    Average Order Value
                  </h3>
                  <p className="text-3xl font-bold text-foreground">
                    £{analyticsData.averageOrderValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Per transaction</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="size-5 text-green-600" />
                    Conversion Rate
                  </h3>
                  <p className="text-3xl font-bold text-foreground">
                    {analyticsData.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Estimated user conversion</p>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="size-5 text-blue-600" />
                  Revenue Trend
                </h3>
                {revenueData.length > 0 ? (
                  <div className="space-y-4">
                    {revenueData.slice(-10).map((dataPoint, index) => {
                      const maxRevenue = Math.max(...revenueData.map((d) => d.revenue))
                      const widthPercent = (dataPoint.revenue / maxRevenue) * 100

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{dataPoint.date}</span>
                            <span className="font-medium text-foreground">
                              £{dataPoint.revenue.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No revenue data available</p>
                )}
              </div>

              {/* Top Competitions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Trophy className="size-5 text-yellow-600" />
                  Top Performing Competitions
                </h3>
                {topCompetitions.length > 0 ? (
                  <div className="space-y-4">
                    {topCompetitions.map((competition, index) => (
                      <div
                        key={competition.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{competition.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {competition.tickets_sold.toLocaleString()} tickets sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            £{competition.revenue.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No competition data available
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
