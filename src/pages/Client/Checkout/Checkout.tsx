import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useWallet } from '@/hooks/useWallet'
import { createG2PaySession, G2PAY_CONFIG } from '@/lib/g2pay'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Trash2, Wallet, ShieldCheck, Tag, X, Check } from 'lucide-react'

function Checkout() {
  const navigate = useNavigate()
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore()
  const { isAuthenticated, user, isLoading: authLoading, isInitialized } = useAuthStore()
  const { summary } = useWallet()
  const [loading, setLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [appliedCredit, setAppliedCredit] = useState(0)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [promoCodeType, setPromoCodeType] = useState<'percentage' | 'fixed_value' | null>(null)
  const [promoCodeValue, setPromoCodeValue] = useState(0)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [useWalletCredit, setUseWalletCredit] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isUKResident, setIsUKResident] = useState(false)
  const [isOver18, setIsOver18] = useState(false)

  const canProceed = agreeTerms && isUKResident && isOver18

  const totalPrice = getTotalPrice()
  const availableCreditGBP = summary.availableBalance / 100
  const discountAmount = totalPrice * promoDiscount
  const priceAfterPromo = totalPrice - discountAmount
  const maxApplicableCredit = Math.min(availableCreditGBP, priceAfterPromo)
  const finalPrice = Math.max(0, priceAfterPromo - appliedCredit)

  useEffect(() => {
    // Wait for auth to initialize before checking authentication
    if (!isInitialized) {
      return
    }

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
  }, [isAuthenticated, items, isInitialized])

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

      // Check if it's an authentication error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage.includes('authenticated') || errorMessage.includes('Session expired')) {
        setError('Your session has expired. Please log in again.')
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login?redirect=/checkout')
        }, 2000)
      } else {
        setError('Failed to initialize payment. Please try again.')
      }
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

  const handleApplyPromoCode = async () => {
    const code = promoCode.toUpperCase().trim()

    if (!code) {
      setPromoError('Please enter a promo code')
      return
    }

    try {
      setPromoError(null)

      // Fetch promo code from backend
      const { data: promoCodeData, error: promoCodeError } = await supabase
        .from('promo_codes')
        .select('code, type, value, is_active, valid_from, valid_until, max_uses, current_uses, max_uses_per_user, min_order_pence')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (promoCodeError || !promoCodeData) {
        setPromoError('Invalid promo code')
        return
      }

      // Check if promo code is within valid date range
      const now = new Date()
      const validFrom = promoCodeData.valid_from ? new Date(promoCodeData.valid_from) : null
      const validUntil = promoCodeData.valid_until ? new Date(promoCodeData.valid_until) : null

      if (validFrom && now < validFrom) {
        setPromoError('This promo code is not yet valid')
        return
      }

      if (validUntil && now > validUntil) {
        setPromoError('This promo code has expired')
        return
      }

      // Check usage limits
      if (promoCodeData.max_uses && (promoCodeData.current_uses ?? 0) >= promoCodeData.max_uses) {
        setPromoError('This promo code has reached its usage limit')
        return
      }

      // Check minimum order value
      const totalPence = Math.round(totalPrice * 100)
      if (promoCodeData.min_order_pence && totalPence < promoCodeData.min_order_pence) {
        const minOrderGBP = promoCodeData.min_order_pence / 100
        setPromoError(`Minimum order value of £${minOrderGBP.toFixed(2)} required`)
        return
      }

      // Check if type is supported
      if (promoCodeData.type === 'percentage') {
        // Apply the promo code (value is 0-100, convert to 0-1)
        setAppliedPromoCode(promoCodeData.code)
        setPromoCodeType('percentage')
        setPromoCodeValue(promoCodeData.value)
        setPromoDiscount(promoCodeData.value / 100)
        setPromoError(null)
        setPromoCode('')
      } else if (promoCodeData.type === 'fixed_value') {
        // Fixed value in pence, convert to GBP and calculate as discount ratio
        const fixedDiscountGBP = promoCodeData.value / 100
        const discountRatio = Math.min(fixedDiscountGBP / totalPrice, 1)
        setAppliedPromoCode(promoCodeData.code)
        setPromoCodeType('fixed_value')
        setPromoCodeValue(promoCodeData.value)
        setPromoDiscount(discountRatio)
        setPromoError(null)
        setPromoCode('')
      } else if (promoCodeData.type === 'free_tickets') {
        // Calculate discount based on average ticket price and free tickets value
        const totalTickets = items.reduce((sum, item) => sum + item.quantity, 0)
        const averagePricePerTicket = totalTickets > 0 ? totalPrice / totalTickets : 0
        const freeTicketsValue = averagePricePerTicket * promoCodeData.value
        const discountRatio = Math.min(freeTicketsValue / totalPrice, 1)

        setAppliedPromoCode(promoCodeData.code)
        setPromoCodeType('fixed_value') // Display as fixed value discount
        setPromoCodeValue(Math.round(freeTicketsValue * 100)) // Store as pence
        setPromoDiscount(discountRatio)
        setPromoError(null)
        setPromoCode('')
      } else {
        setPromoError('This promo code type is not supported for checkout')
      }
    } catch (err) {
      console.error('Error validating promo code:', err)
      setPromoError('Failed to validate promo code')
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null)
    setPromoCodeType(null)
    setPromoCodeValue(0)
    setPromoDiscount(0)
    setPromoError(null)
  }

  const handleWalletToggle = (enabled: boolean) => {
    setUseWalletCredit(enabled)
    if (enabled) {
      setAppliedCredit(maxApplicableCredit)
    } else {
      setAppliedCredit(0)
    }
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate cart is not empty
      if (items.length === 0) {
        throw new Error('Your cart is empty')
      }

      // Convert GBP to pence
      const totalPence = Math.round(totalPrice * 100)
      const creditPence = Math.round(appliedCredit * 100)
      const finalPence = Math.round(finalPrice * 100)

      // Validate order total is greater than 0
      if (totalPence <= 0) {
        throw new Error('Order total must be greater than £0.00. Please check your cart items.')
      }

      // Validate all items have valid prices
      const invalidItems = items.filter(
        (item) => !item.pricePerTicket || item.pricePerTicket <= 0 || !item.totalPrice || item.totalPrice <= 0
      )
      if (invalidItems.length > 0) {
        throw new Error(
          `Some items in your cart have invalid prices. Please remove and re-add: ${invalidItems.map((i) => i.competitionTitle).join(', ')}`
        )
      }

      // Ensure user is authenticated and refresh session to get latest token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()

      if (sessionError || !session?.user) {
        console.error('Session error:', sessionError)
        throw new Error('User not authenticated. Please log in again.')
      }

      const authenticatedUserId = session.user.id
      console.log('Authenticated user ID:', authenticatedUserId)
      console.log('Session access token:', session.access_token ? 'exists' : 'missing')

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: authenticatedUserId,
          subtotal_pence: totalPence,
          credit_applied_pence: creditPence,
          total_pence: finalPence,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }

      console.log('Order created:', order.id, 'for user:', order.user_id)

      // Verify the order was created successfully
      const { data: verifyOrder, error: verifyError } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('id', order.id)
        .single()

      if (verifyError || !verifyOrder) {
        console.error('Order verification failed:', verifyError)
        throw new Error('Failed to verify order creation')
      }

      console.log('Order verified:', verifyOrder)

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        competition_id: item.competitionId,
        ticket_count: item.quantity,
        price_per_ticket_pence: Math.round(item.pricePerTicket * 100),
        total_pence: Math.round(item.totalPrice * 100),
      }))

      console.log('Inserting order items:', orderItems)

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

      if (itemsError) {
        console.error('Order items error:', itemsError)
        throw itemsError
      }

      // If fully paid with wallet credit, complete order immediately
      if (finalPrice === 0) {
        // Complete order with wallet payment
        const { error: completeError } = await supabase.rpc('complete_order_with_wallet', {
          p_order_id: order.id,
          p_user_id: authenticatedUserId,
        })

        if (completeError) {
          console.error('Error completing wallet order:', completeError)
          throw new Error('Failed to process wallet payment')
        }

        // Clear cart and redirect
        clearCart()
        navigate('/account?tab=tickets')
        return
      }

      // Otherwise, trigger G2Pay payment with order ID as clientUniqueId
      ;(window as any).SafeCharge.payment({
        sessionToken,
        merchantId: G2PAY_CONFIG.merchantId,
        amount: finalPrice.toFixed(2),
        currency: 'GBP',
        clientUniqueId: order.id, // Use order ID for webhook matching
        userTokenId: authenticatedUserId,
        cardHolderName: session.user.email || '',
        billingAddress: {
          email: session.user.email,
          country: 'GB',
        },
        callback: async (response: any) => {
          if (response.result === 'APPROVED') {
            // Deduct wallet credits if any were applied
            if (creditPence > 0) {
              await supabase.rpc('debit_wallet_credits', {
                p_user_id: authenticatedUserId,
                p_amount_pence: creditPence,
                p_description: `Order #${order.id.slice(0, 8)}`,
              })
            }

            // Clear cart immediately
            clearCart()

            // Redirect to account tickets page
            // Note: Webhook will handle order status update and ticket allocation
            navigate('/account?tab=tickets')
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

  // Show loading while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
        <Header />
        <div className="flex items-center justify-center pt-24 pb-16 px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#496B71' }}></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF9', color: '#2D251E' }}>
      <Header />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-4xl font-bold mb-10"
            style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}
          >
            Secure Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Order Summary - Left Column */}
            <div className="order-2 lg:order-1 space-y-6">
              <div
                className="p-8 rounded-2xl shadow-sm"
                style={{
                  backgroundColor: 'white',
                  borderWidth: '1px',
                  borderColor: '#e7e5e4',
                }}
              >
                <h2
                  className="text-xl font-bold mb-8 flex items-center gap-2"
                  style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}
                >
                  <ShoppingCart className="size-5" />
                  Your Order{' '}
                  <span className="text-sm font-normal" style={{ color: '#78716c' }}>
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                </h2>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.competitionId} className="flex gap-4 items-start">
                      <img
                        src={item.imageUrl}
                        alt={item.competitionTitle}
                        className="w-24 h-24 rounded-xl object-cover"
                        style={{ backgroundColor: '#f5f5f4' }}
                      />
                      <div className="grow pt-1">
                        <h3
                          className="font-bold leading-tight mb-2 text-lg"
                          style={{ color: '#151e20' }}
                        >
                          {item.competitionTitle}
                        </h3>
                        <span
                          className="text-sm font-bold inline-block px-2 py-1 rounded-md"
                          style={{ backgroundColor: '#e1eaec', color: '#496B71' }}
                        >
                          {item.quantity} Tickets
                        </span>
                      </div>
                      <div className="text-right pt-1">
                        <p className="font-bold text-lg" style={{ color: '#151e20' }}>
                          £{item.totalPrice.toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item.competitionId)}
                          className="transition-colors mt-3 cursor-pointer"
                          style={{ color: '#d1d5db' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promotional Code Section */}
                <div
                  className="mt-8 pt-8"
                  style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
                >
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#78716c' }}
                  >
                    Promotional Code
                  </label>

                  {appliedPromoCode ? (
                    <div
                      className="flex justify-between items-center p-4 rounded-xl"
                      style={{
                        backgroundColor: '#e1eaec',
                        borderWidth: '1px',
                        borderColor: '#496B71',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Tag size={16} style={{ color: '#496B71' }} />
                        <span className="font-bold" style={{ color: '#151e20' }}>
                          {appliedPromoCode}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: '#496B71', color: 'white' }}
                        >
                          {promoCodeType === 'percentage'
                            ? `${promoCodeValue}% OFF`
                            : `£${(promoCodeValue / 100).toFixed(2)} OFF`
                          }
                        </span>
                      </div>
                      <button
                        onClick={handleRemovePromoCode}
                        className="transition-colors cursor-pointer"
                        style={{ color: '#78716c' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#78716c')}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value)
                          setPromoError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPromoCode()
                          }
                        }}
                        placeholder="Enter code"
                        className="grow p-3 rounded-xl focus:ring-2 focus:outline-none uppercase font-medium placeholder:normal-case"
                        style={{
                          backgroundColor: '#f5f5f4',
                          borderWidth: '1px',
                          borderColor: '#e7e5e4',
                          color: '#151e20',
                        }}
                      />
                      <button
                        onClick={handleApplyPromoCode}
                        className="px-6 rounded-lg transition-colors cursor-pointer font-bold"
                        style={{
                          backgroundColor: 'white',
                          borderWidth: '1px',
                          borderColor: '#e7e5e4',
                          color: '#151e20',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#496B71'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.color = '#151e20'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-rose-500 text-sm mt-2">{promoError}</p>
                  )}
                </div>

                {/* Wallet Credit Section */}
                {availableCreditGBP > 0 && (
                  <div
                    className="mt-6 pt-6"
                    style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={useWalletCredit}
                            onChange={(e) => handleWalletToggle(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div
                            className="w-12 h-6 rounded-full transition-colors"
                            style={{
                              backgroundColor: useWalletCredit ? '#496B71' : '#d1d5db',
                            }}
                          >
                            <div
                              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                              style={{
                                transform: useWalletCredit ? 'translateX(24px)' : 'translateX(2px)',
                              }}
                            />
                          </div>
                        </div>
                        <span
                          className="font-bold flex items-center gap-2"
                          style={{ color: '#151e20' }}
                        >
                          <Wallet size={18} style={{ color: '#496B71' }} />
                          Use Wallet Credit
                        </span>
                      </label>
                      <span className="text-sm" style={{ color: '#78716c' }}>
                        Balance: <span className="font-bold" style={{ color: '#151e20' }}>£{availableCreditGBP.toFixed(2)}</span>
                      </span>
                    </div>

                    {useWalletCredit && (
                      <>
                        <div
                          className="rounded-lg p-4 mb-4"
                          style={{
                            backgroundColor: '#e1eaec',
                            borderWidth: '1px',
                            borderColor: '#496B71',
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-sm" style={{ color: '#151e20' }}>
                              <p className="font-medium">
                                Applying £{appliedCredit.toFixed(2)} credit
                              </p>
                              <p className="text-xs mt-1" style={{ color: '#78716c' }}>
                                Maximum credit can be applied after any promo discounts
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium" style={{ color: '#78716c' }}>
                            Apply Credit Amount
                          </label>
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
                            className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:outline-none"
                            style={{
                              backgroundColor: '#f5f5f4',
                              borderWidth: '1px',
                              borderColor: '#e7e5e4',
                              color: '#151e20',
                            }}
                            placeholder="0.00"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAppliedCredit(Math.min(10, maxApplicableCredit))}
                              className="flex-1 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                              style={{
                                borderWidth: '1px',
                                borderColor: '#e7e5e4',
                                backgroundColor: 'white',
                                color: '#151e20',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                            >
                              £10
                            </button>
                            <button
                              onClick={() => setAppliedCredit(Math.min(25, maxApplicableCredit))}
                              className="flex-1 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                              style={{
                                borderWidth: '1px',
                                borderColor: '#e7e5e4',
                                backgroundColor: 'white',
                                color: '#151e20',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                            >
                              £25
                            </button>
                            <button
                              onClick={() => setAppliedCredit(maxApplicableCredit)}
                              className="flex-1 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                              style={{
                                borderWidth: '1px',
                                borderColor: '#e7e5e4',
                                backgroundColor: 'white',
                                color: '#151e20',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                            >
                              Use All
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Order Totals */}
                <div
                  className="mt-8 pt-8 space-y-3"
                  style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
                >
                  <div className="flex justify-between items-center" style={{ color: '#78716c' }}>
                    <span>Subtotal</span>
                    <span>£{totalPrice.toFixed(2)}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-medium">
                      <span>
                        Promo Discount
                        {promoCodeType === 'percentage' && ` (${promoCodeValue}%)`}
                      </span>
                      <span>-£{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {appliedCredit > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Wallet size={14} />
                        Wallet Credit
                      </span>
                      <span>-£{appliedCredit.toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    className="flex justify-between items-center pt-4"
                    style={{ borderTopWidth: '1px', borderColor: '#e7e5e4' }}
                  >
                    <span className="font-bold text-xl" style={{ color: '#151e20' }}>
                      Total to Pay
                    </span>
                    <span className="text-4xl font-bold" style={{ color: '#496B71' }}>
                      £{finalPrice.toFixed(2)}
                    </span>
                  </div>

                  {(promoDiscount > 0 || appliedCredit > 0) && (
                    <p className="text-sm text-green-600 text-right font-medium">
                      You're saving £{(discountAmount + appliedCredit).toFixed(2)}!
                    </p>
                  )}
                </div>
              </div>

              <div
                className="flex items-center justify-center gap-2 text-sm font-medium"
                style={{ color: '#78716c' }}
              >
                <ShieldCheck size={18} /> Guaranteed Secure Checkout
              </div>
            </div>

            {/* Payment Form - Right Column */}
            <div className="order-1 lg:order-2">
              {finalPrice > 0 && (
                <div
                  className="p-8 rounded-2xl shadow-sm"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '1px',
                    borderColor: '#e7e5e4',
                  }}
                >
                  <h2
                    className="text-xl font-bold mb-6"
                    style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}
                  >
                    Payment Details
                  </h2>

                  {error && (
                    <div
                      className="rounded-lg p-4 mb-6"
                      style={{
                        backgroundColor: '#fef2f2',
                        borderWidth: '1px',
                        borderColor: '#fecaca',
                      }}
                    >
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Entry Requirements */}
                  <div
                    className="rounded-xl p-6 mb-6 space-y-4"
                    style={{ backgroundColor: '#f5f5f4', borderWidth: '1px', borderColor: '#e7e5e4' }}
                  >
                    <div className="mb-2">
                      <span className="font-bold" style={{ color: '#151e20' }}>
                        Entry Requirements
                      </span>
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: agreeTerms ? '#496B71' : 'white',
                            borderColor: agreeTerms ? '#496B71' : '#d1d5db',
                          }}
                        >
                          {agreeTerms && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
                        I agree to the{' '}
                        <Link to="/terms-of-use" className="font-medium hover:underline cursor-pointer" style={{ color: '#496B71' }} target="_blank">
                          Terms of Use
                        </Link>
                        {' '}and{' '}
                        <Link to="/Prize-Competition-Terms-and-Conditions" className="font-medium hover:underline cursor-pointer" style={{ color: '#496B71' }} target="_blank">
                          Prize Competition Terms and Conditions
                        </Link>
                      </span>
                    </label>

                    {/* UK Resident Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={isUKResident}
                          onChange={(e) => setIsUKResident(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isUKResident ? '#496B71' : 'white',
                            borderColor: isUKResident ? '#496B71' : '#d1d5db',
                          }}
                        >
                          {isUKResident && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
                        I confirm I am a <strong>UK resident</strong>
                      </span>
                    </label>

                    {/* Over 18 Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={isOver18}
                          onChange={(e) => setIsOver18(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isOver18 ? '#496B71' : 'white',
                            borderColor: isOver18 ? '#496B71' : '#d1d5db',
                          }}
                        >
                          {isOver18 && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
                        I confirm I am <strong>over 18 years of age</strong>
                      </span>
                    </label>

                    {!canProceed && (
                      <p className="text-xs pt-2" style={{ color: '#78716c' }}>
                        Please confirm all boxes above to complete your purchase
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading || !sessionToken || !canProceed}
                    className="w-full font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white text-lg"
                    style={{
                      backgroundColor: '#496B71',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && sessionToken) {
                        e.currentTarget.style.backgroundColor = '#3a565a'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#496B71'
                    }}
                  >
                    {loading ? 'Processing...' : `Pay £${finalPrice.toFixed(2)}`}
                  </button>

                  <p className="text-xs text-center mt-4" style={{ color: '#78716c' }}>
                    Your payment is secure and encrypted
                  </p>
                </div>
              )}

              {finalPrice === 0 && (
                <div
                  className="p-8 rounded-2xl shadow-sm"
                  style={{
                    backgroundColor: 'white',
                    borderWidth: '1px',
                    borderColor: '#e7e5e4',
                  }}
                >
                  <h2
                    className="text-xl font-bold mb-6"
                    style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}
                  >
                    Complete Order
                  </h2>

                  {error && (
                    <div
                      className="rounded-lg p-4 mb-6"
                      style={{
                        backgroundColor: '#fef2f2',
                        borderWidth: '1px',
                        borderColor: '#fecaca',
                      }}
                    >
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div
                    className="p-6 rounded-xl mb-6"
                    style={{
                      backgroundColor: '#ecfdf5',
                      borderWidth: '1px',
                      borderColor: '#a7f3d0',
                    }}
                  >
                    <p className="text-green-800 text-center font-medium">
                      Your order will be paid in full using wallet credit
                    </p>
                  </div>

                  {/* Entry Requirements */}
                  <div
                    className="rounded-xl p-6 mb-6 space-y-4"
                    style={{ backgroundColor: '#f5f5f4', borderWidth: '1px', borderColor: '#e7e5e4' }}
                  >
                    <div className="mb-2">
                      <span className="font-bold" style={{ color: '#151e20' }}>
                        Entry Requirements
                      </span>
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: agreeTerms ? '#496B71' : 'white',
                            borderColor: agreeTerms ? '#496B71' : '#d1d5db',
                          }}
                        >
                          {agreeTerms && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
                        I agree to the{' '}
                        <Link to="/terms-of-use" className="font-medium hover:underline cursor-pointer" style={{ color: '#496B71' }} target="_blank">
                          Terms of Use
                        </Link>
                        {' '}and{' '}
                        <Link to="/Prize-Competition-Terms-and-Conditions" className="font-medium hover:underline cursor-pointer" style={{ color: '#496B71' }} target="_blank">
                          Prize Competition Terms and Conditions
                        </Link>
                      </span>
                    </label>

                    {/* UK Resident Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={isUKResident}
                          onChange={(e) => setIsUKResident(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isUKResident ? '#496B71' : 'white',
                            borderColor: isUKResident ? '#496B71' : '#d1d5db',
                          }}
                        >
                          {isUKResident && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
                        I confirm I am a <strong>UK resident</strong>
                      </span>
                    </label>

                    {/* Over 18 Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={isOver18}
                          onChange={(e) => setIsOver18(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isOver18 ? '#496B71' : 'white',
                            borderColor: isOver18 ? '#496B71' : '#d1d5db',
                          }}
                        >
                          {isOver18 && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
                        I confirm I am <strong>over 18 years of age</strong>
                      </span>
                    </label>

                    {!canProceed && (
                      <p className="text-xs pt-2" style={{ color: '#78716c' }}>
                        Please confirm all boxes above to complete your purchase
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading || !canProceed}
                    className="w-full font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white text-lg"
                    style={{
                      backgroundColor: '#496B71',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#3a565a'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#496B71'
                    }}
                  >
                    {loading ? 'Processing...' : 'Complete Order'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Checkout
