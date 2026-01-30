import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '@/components/common/Header'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Trophy, ArrowRight } from 'lucide-react'

interface OrderDetails {
  id: string
  total_pence: number
  created_at: string
  items: Array<{
    competition_id: string
    ticket_count: number
    competition: {
      title: string
      slug: string
    }
  }>
}

function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          total_pence,
          created_at,
          items:order_items(
            competition_id,
            ticket_count,
            competition:competitions(title, slug)
          )
        `
        )
        .eq('id', orderId!)
        .single()

      if (error) throw error
      setOrder(data as any)
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
        <Header />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block size-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
      <Header />

      <div className="pt-32 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center size-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="size-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your tickets have been purchased successfully.
          </p>

          {/* Order Details */}
          {order && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-left mb-8">
              <h2 className="text-lg font-bold mb-4">Order Details</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium font-mono">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-bold text-lg" style={{ color: '#f25100' }}>
                    £{(order.total_pence / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold mb-3">Your Tickets</h3>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div
                      key={item.competition_id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="size-4 text-orange-500" />
                        <span className="text-sm">{item.competition.title}</span>
                      </div>
                      <span className="text-sm font-medium">{item.ticket_count} tickets</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold mb-2">What's Next?</h3>
            <p className="text-sm text-gray-700">
              You'll receive a confirmation email shortly. Your tickets are now entered into the
              draw. Good luck!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse More Competitions
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/account/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 font-bold rounded-lg hover:border-gray-300 transition-colors"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
