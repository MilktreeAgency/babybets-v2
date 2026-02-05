import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { Users, Link2, Copy, Check, Edit } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Influencer = Database['public']['Tables']['influencers']['Row']
type InfluencerSale = Database['public']['Tables']['influencer_sales']['Row']

export default function InfluencerDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [sales, setSales] = useState<InfluencerSale[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkInfluencerAccess()
  }, [])

  const checkInfluencerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      // Check if user is an influencer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'influencer') {
        navigate('/')
        return
      }

      // Load influencer data
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (influencerError) throw influencerError
      setInfluencer(influencerData)

      // Load sales data
      const { data: salesData, error: salesError } = await supabase
        .from('influencer_sales')
        .select('*')
        .eq('influencer_id', influencerData.id)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError
      setSales(salesData || [])
    } catch (error) {
      console.error('Error loading influencer dashboard:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const getCommissionRate = (tier: number) => {
    switch (tier) {
      case 1: return '10%'
      case 2: return '15%'
      case 3: return '20%'
      case 4: return '25%'
      default: return '10%'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingCommission = sales
    .filter(s => s.status === 'pending' || s.status === 'approved')
    .reduce((sum, s) => sum + (s.commission_pence || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block size-12 border-4 border-border border-t-[#496B71] rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!influencer) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFBF7' }}>
      <Header />

      <div className="flex-1 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                  Partner Dashboard
                </h1>
                <p className="text-base mt-1" style={{ color: '#78716c' }}>
                  Welcome back, {influencer.display_name}!
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/influencer/profile/edit')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer text-sm"
                  style={{ backgroundColor: '#496B71', color: 'white' }}
                >
                  <Edit className="size-4" />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate(`/partner/${influencer.slug}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border font-bold transition-colors cursor-pointer text-sm"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                >
                  View Public Profile
                </button>
              </div>
            </div>

            {!influencer.is_active && (
              <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: '#f59e0b' }}>
                <p className="font-bold" style={{ color: '#f59e0b' }}>
                  Your influencer profile is pending approval. You'll be notified once it's activated.
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Earnings */}
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e7e5e4' }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>Total Earnings</p>
              <p className="text-2xl font-bold" style={{ color: '#151e20' }}>
                £{((influencer.total_commission_pence || 0) / 100).toFixed(2)}
              </p>
            </div>

            {/* Pending Commission */}
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e7e5e4' }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>Pending</p>
              <p className="text-2xl font-bold" style={{ color: '#151e20' }}>
                £{(pendingCommission / 100).toFixed(2)}
              </p>
            </div>

            {/* Total Sales */}
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e7e5e4' }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>Total Sales</p>
              <p className="text-2xl font-bold" style={{ color: '#151e20' }}>
                £{((influencer.total_sales_pence || 0) / 100).toFixed(2)}
              </p>
            </div>

            {/* Commission Rate */}
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e7e5e4' }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>Rate (Tier {influencer.commission_tier || 1})</p>
              <p className="text-2xl font-bold" style={{ color: '#151e20' }}>
                {getCommissionRate(influencer.commission_tier || 1)}
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-xl p-4 border mb-6" style={{ borderColor: '#e7e5e4' }}>
            <h2 className="text-sm font-bold mb-3" style={{ color: '#151e20' }}>How Commission Works</h2>
            <div className="space-y-2 text-xs" style={{ color: '#78716c' }}>
              <p>
                <span className="font-bold" style={{ color: '#151e20' }}>1. Share your link:</span> When someone uses your referral link or code to make a purchase, you earn a commission.
              </p>
              <p>
                <span className="font-bold" style={{ color: '#151e20' }}>2. Tier system:</span> Your commission rate increases as you generate more sales: £0–£999 (10%), £1,000–£2,999 (15%), £3,000–£4,999 (20%), £5,000+ (25%).
              </p>
              <p>
                <span className="font-bold" style={{ color: '#151e20' }}>3. Payment:</span> Commissions are paid monthly after orders are confirmed and completed.
              </p>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white rounded-xl p-4 border mb-6" style={{ borderColor: '#e7e5e4' }}>
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="size-4" style={{ color: '#496B71' }} />
              <h2 className="text-sm font-bold" style={{ color: '#151e20' }}>Your Referral Link</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/partner/${influencer.slug}`}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#e7e5e4', color: '#151e20', backgroundColor: '#f5f5f4' }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/partner/${influencer.slug}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-2 text-sm"
                style={{ backgroundColor: copied ? '#22c55e' : '#496B71', color: 'white' }}
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e7e5e4' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: '#151e20' }}>Recent Sales</h2>
              <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#f5f5f4', color: '#78716c' }}>
                {sales.length} Total
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-8">
                <Users className="size-12 mx-auto mb-3" style={{ color: '#e7e5e4' }} />
                <p className="text-sm font-bold mb-1" style={{ color: '#151e20' }}>No sales yet</p>
                <p className="text-xs" style={{ color: '#78716c' }}>Share your link to earn commissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e7e5e4' }}>
                      <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: '#78716c' }}>Date</th>
                      <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: '#78716c' }}>Order</th>
                      <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: '#78716c' }}>Commission</th>
                      <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: '#78716c' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                        <td className="py-3 px-3 text-xs" style={{ color: '#151e20' }}>
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                        </td>
                        <td className="py-3 px-3 font-bold text-sm" style={{ color: '#151e20' }}>
                          £{((sale.order_value_pence || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-bold text-sm" style={{ color: '#22c55e' }}>
                          £{((sale.commission_pence || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusColor(sale.status || 'pending')}`}>
                            {sale.status || 'pending'}
                          </span>
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

      <Footer />
    </div>
  )
}
