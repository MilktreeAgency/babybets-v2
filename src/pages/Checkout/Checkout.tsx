import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '@/components/common/Header'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useWallet } from '@/hooks/useWallet'
import { createG2PaySession, G2PAY_CONFIG } from '@/lib/g2pay'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ShoppingCart, CreditCard, Trash2, Wallet } from 'lucide-react'

function Checkout() {
  const navigate = useNavigate()
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const { summary } = useWallet()
  const [loading, setLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [appliedCredit, setAppliedCredit] = useState(0)

  const totalPrice = getTotalPrice()
  const availableCreditGBP = summary.availableBalance / 100
  const maxApplicableCredit = Math.min(availableCreditGBP, totalPrice)
  const finalPrice = Math.max(0, totalPrice - appliedCredit)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout')
      return
    }

    // Redirect if cart is empty
    if (items.length === 0) {
      navigate('/')
      return
    }

    // Initialize G2Pay session
    initializePayment()
  }, [isAuthenticated, items])

  const initializePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // Generate unique client request ID
      const clientRequestId = `${user?.id}-${Date.now()}`

      // Create G2Pay session
      const session = await createG2PaySession(clientRequestId)
      setSessionToken(session.sessionToken)

      // Load G2Pay SDK
      loadG2PaySDK()
    } catch (err) {
      console.error('Error initializing payment:', err)
      setError('Failed to initialize payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadG2PaySDK = () => {
    if (document.getElementById('g2pay-sdk')) return

    const script = document.createElement('script')
    script.id = 'g2pay-sdk'
    script.src =
      G2PAY_CONFIG.environment === 'production'
        ? 'https://cdn.safecharge.com/safecharge_resources/v1/websdk/safecharge.js'
        : 'https://cdn.safecharge.com/safecharge_resources/v1/websdk/safecharge.js'
    script.async = true
    script.onload = () => initializeG2PayFields()
    document.body.appendChild(script)
  }

  const initializeG2PayFields = () => {
    if (!sessionToken) return

    // Initialize G2Pay hosted fields
    ;(window as any).SafeCharge({
      sessionToken,
      env: G2PAY_CONFIG.environment === 'production' ? 'prod' : 'test',
      merchantId: G2PAY_CONFIG.merchantId,
      renderTo: '#g2pay-payment-form',
    })
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // Convert GBP to pence
      const totalPence = Math.round(totalPrice * 100)
      const creditPence = Math.round(appliedCredit * 100)
      const finalPence = Math.round(finalPrice * 100)

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          subtotal_pence: totalPence,
          credit_applied_pence: creditPence,
          total_pence: finalPence,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        competition_id: item.competitionId,
        ticket_count: item.quantity,
        price_per_ticket_pence: Math.round(item.pricePerTicket * 100),
        total_pence: Math.round(item.totalPrice * 100),
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

      if (itemsError) throw itemsError

      // If fully paid with wallet credit, complete order immediately
      if (finalPrice === 0) {
        // Complete order with wallet payment
        const { error: completeError } = await supabase.rpc('complete_order_with_wallet', {
          p_order_id: order.id,
          p_user_id: user?.id,
        })

        if (completeError) {
          console.error('Error completing wallet order:', completeError)
          throw new Error('Failed to process wallet payment')
        }

        // Clear cart and redirect
        clearCart()
        navigate(`/payment/success?orderId=${order.id}`)
        return
      }

      // Otherwise, trigger G2Pay payment with order ID as clientUniqueId
      ;(window as any).SafeCharge.payment({
        sessionToken,
        merchantId: G2PAY_CONFIG.merchantId,
        amount: finalPrice.toFixed(2),
        currency: 'GBP',
        clientUniqueId: order.id, // Use order ID for webhook matching
        userTokenId: user?.id,
        cardHolderName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        billingAddress: {
          email: user?.email,
          country: 'GB',
        },
        callback: async (response: any) => {
          if (response.result === 'APPROVED') {
            // Deduct wallet credits if any were applied
            if (creditPence > 0) {
              await supabase.rpc('debit_wallet_credits', {
                p_user_id: user?.id,
                p_amount_pence: creditPence,
                p_description: `Order #${order.id.slice(0, 8)}`,
              })
            }

            // Clear cart immediately
            clearCart()

            // Redirect to success page
            // Note: Webhook will handle order status update and ticket allocation
            navigate(`/payment/success?orderId=${order.id}`)
          } else {
            // Payment declined or failed
            setError('Payment was declined. Please try another card or payment method.')
          }
        },
      })
    } catch (err) {
      console.error('Error processing payment:', err)
      setError('Failed to process payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
      <Header />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Competitions
          </Link>

          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  Your Tickets ({items.length})
                </h2>

                {items.map((item) => (
                  <div
                    key={item.competitionId}
                    className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-0"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.competitionTitle}
                      className="size-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold">{item.competitionTitle}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.quantity} tickets × £{item.pricePerTicket.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">£{item.totalPrice.toFixed(2)}</div>
                      <button
                        onClick={() => removeItem(item.competitionId)}
                        className="text-red-600 hover:text-red-700 text-sm mt-1 flex items-center gap-1"
                      >
                        <Trash2 className="size-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Wallet Credit Section */}
              {availableCreditGBP > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wallet className="size-5" />
                    Use Wallet Credit
                  </h2>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">
                      You have <span className="font-bold">£{availableCreditGBP.toFixed(2)}</span> available
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Apply Credit Amount</label>
                    <input
                      type="number"
                      min="0"
                      max={maxApplicableCredit}
                      step="0.01"
                      value={appliedCredit}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setAppliedCredit(Math.min(value, maxApplicableCredit))
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAppliedCredit(Math.min(10, maxApplicableCredit))}
                        className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        £10
                      </button>
                      <button
                        onClick={() => setAppliedCredit(Math.min(25, maxApplicableCredit))}
                        className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        £25
                      </button>
                      <button
                        onClick={() => setAppliedCredit(maxApplicableCredit)}
                        className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Use All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Form */}
              {finalPrice > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="size-5" />
                    Payment Details
                  </h2>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div id="g2pay-payment-form" className="min-h-[200px]"></div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">£{totalPrice.toFixed(2)}</span>
                  </div>
                  {appliedCredit > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Wallet Credit</span>
                      <span className="font-medium text-green-600">-£{appliedCredit.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">£0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold">Total to Pay</span>
                    <span className="font-bold text-xl" style={{ color: '#f25100' }}>
                      £{finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading || (finalPrice > 0 && !sessionToken)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : finalPrice > 0 ? `Pay £${finalPrice.toFixed(2)}` : 'Complete Order'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your payment is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
