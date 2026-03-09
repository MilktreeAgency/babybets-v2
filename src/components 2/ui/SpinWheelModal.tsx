import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Trophy, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase'

interface SpinWheelModalProps {
  isOpen: boolean
  onClose: () => void
}

// 8 Segments = 45 degrees each
// Prize segments with brand colors
const SEGMENTS = [
  { label: 'Free Entry', color: '#496B71', value: 'FREEENTRY', textColor: '#ffffff', type: 'free_entry' as const, amount: null },
  { label: '15% Off Order', color: '#FED0B9', value: 'BABY15', textColor: '#151e20', type: 'discount' as const, amount: 15 },
  { label: '10% Off Order', color: '#FBEFDF', value: 'BABY10', textColor: '#151e20', type: 'discount' as const, amount: 10 },
  { label: '5% Off Order', color: '#496B71', value: 'BABY5', textColor: '#ffffff', type: 'discount' as const, amount: 5 },
  { label: '£5 Credit', color: '#FED0B9', value: 'CREDIT5', textColor: '#151e20', type: 'credit' as const, amount: 5 },
  { label: '£2 Credit', color: '#496B71', value: 'CREDIT2', textColor: '#ffffff', type: 'credit' as const, amount: 2 },
  { label: '£1 Credit', color: '#FBEFDF', value: 'CREDIT1', textColor: '#151e20', type: 'credit' as const, amount: 1 },
  { label: '50p Credit', color: '#FED0B9', value: 'CREDIT50P', textColor: '#151e20', type: 'credit' as const, amount: 0.5 },
]

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({ isOpen, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<typeof SEGMENTS[number] | null>(null)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const wheelRef = useRef<HTMLDivElement>(null)

  const spin = () => {
    if (isSpinning || hasSpun) return

    setIsSpinning(true)

    // Logic to ensure they win for the demo
    const minSpins = 5
    const maxSpins = 8
    const fullRotations = Math.floor(Math.random() * (maxSpins - minSpins + 1) + minSpins) * 360

    // Weighted probabilities
    // Indices: 0=Free Entry, 1=15% Off, 2=10% Off, 3=5% Off, 4=£5 Credit, 5=£2 Credit, 6=£1 Credit, 7=50p Credit
    // More common: smaller credits and discounts | Less common: larger credits and free entry
    const possibleWinners = [7, 6, 3, 2, 7, 6, 5, 3, 7, 2, 6, 5, 7, 3, 6, 4, 2, 1, 0, 4]
    const winnerIndex = possibleWinners[Math.floor(Math.random() * possibleWinners.length)]

    const segmentCount = SEGMENTS.length
    const segmentSize = 360 / segmentCount // 45 degrees

    // Random jitter inside the wedge (keep it away from edges)
    const randomOffset = Math.floor(Math.random() * (segmentSize - 10)) + 5

    // Calculate stop angle - subtract randomOffset to land within the correct segment
    const stopAngle = fullRotations + (360 - (winnerIndex * segmentSize)) - randomOffset

    setRotation(stopAngle)

    setTimeout(() => {
      setIsSpinning(false)
      setHasSpun(true)
      setResult(SEGMENTS[winnerIndex])

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 99999
      })
    }, 4000) // 4s spin time
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result || !email) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
      }

      // Get the current user's auth token if they're logged in
      const { data: { session } } = await supabase.auth.getSession()

      // Call edge function directly using fetch (same pattern as email service)
      const url = `${supabaseUrl}/functions/v1/claim-wheel-prize`

      // Build headers - use user JWT if available, otherwise anon key
      const authToken = session?.access_token || supabaseAnonKey

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${authToken}`,
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: email.toLowerCase(),
          prizeLabel: result.label,
          prizeValue: result.value,
          prizeType: result.type,
          prizeAmount: result.amount,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('Edge function error response:', data)
        setErrorMessage(data.message || 'Failed to claim prize. Please try again.')
        return
      }

      if (data.success) {
        setSubmitSuccess(true)
      }
    } catch (error) {
      console.error('Error claiming prize:', error)
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPrizeDescription = (prize: typeof SEGMENTS[number]): string => {
    switch (prize.type) {
      case 'credit':
        return `You've won £${prize.amount?.toFixed(2)} credit`
      case 'discount':
        return `You've unlocked ${prize.amount}% off`
      case 'free_entry':
        return "You've won a free entry"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] backdrop-blur-sm cursor-pointer"
            style={{ backgroundColor: '#2c4044' }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, x: "-50%", y: "-40%" }}
            animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
            exit={{ scale: 0.8, opacity: 0, x: "-50%", y: "-40%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 w-[90%] max-w-[360px] md:max-w-[420px] bg-white rounded-3xl shadow-2xl z-[100] overflow-hidden border-4 max-h-[90vh] flex flex-col"
            style={{ borderColor: '#FED0B9' }}
          >
            {/* Header */}
            <div className="p-5 md:p-6 text-center relative shrink-0" style={{ backgroundColor: '#496B71' }}>
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pattern-dots"></div>
               <button onClick={onClose} className="absolute top-3 right-3 md:top-4 md:right-4 hover:text-white transition p-2 rounded-full hover:bg-white/10 cursor-pointer" style={{ color: '#FED0B9' }}>
                 <X size={20} />
               </button>
               <h2 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">Wait! Feeling Lucky?</h2>
               <p className="text-xs md:text-sm" style={{ color: '#FBEFDF' }}>Spin to win prizes, discounts & free entries!</p>
            </div>

            <div className="p-5 md:p-8 flex flex-col items-center overflow-y-auto no-scrollbar" style={{ backgroundColor: '#fffbf7' }}>

              {!hasSpun ? (
                <>
                  <div className="relative w-full max-w-[280px] aspect-square mb-6 md:mb-8">
                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 filter drop-shadow-md" style={{ color: '#FED0B9' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22L12 2M12 22L7 12M12 22L17 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 2L9 7H15L12 2Z" />
                      </svg>
                    </div>

                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="w-full h-full rounded-full border-[6px] border-white shadow-xl relative overflow-hidden transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transitionDuration: '4s',
                        background: `conic-gradient(
                          ${SEGMENTS[0].color} 0deg 45deg,
                          ${SEGMENTS[1].color} 45deg 90deg,
                          ${SEGMENTS[2].color} 90deg 135deg,
                          ${SEGMENTS[3].color} 135deg 180deg,
                          ${SEGMENTS[4].color} 180deg 225deg,
                          ${SEGMENTS[5].color} 225deg 270deg,
                          ${SEGMENTS[6].color} 270deg 315deg,
                          ${SEGMENTS[7].color} 315deg 360deg
                        )`
                      }}
                    >
                      {/* Labels - Radiating from center to outside */}
                      {SEGMENTS.map((seg, i) => (
                         <div
                           key={i}
                           className="absolute top-1/2 left-1/2 w-[50%] h-[20px] origin-left flex items-center justify-start pl-8 md:pl-10 pr-2"
                           style={{
                             transform: `translateY(-50%) rotate(${i * 45 + 22.5 - 90}deg)`,
                             zIndex: 10
                           }}
                         >
                            <span
                              className="font-bold uppercase tracking-wider text-[10px] md:text-xs whitespace-nowrap truncate"
                              style={{
                                color: seg.textColor,
                                textShadow: '0 1px 1px rgba(0,0,0,0.05)'
                              }}
                            >
                              {seg.label}
                            </span>
                         </div>
                      ))}
                    </div>

                    {/* Center Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-4 z-10" style={{ borderColor: '#FBEFDF' }}>
                       <div className="w-8 h-8 md:w-9 md:h-9 rounded-full animate-pulse shadow-inner" style={{ backgroundColor: '#FED0B9' }}></div>
                    </div>
                  </div>

                  <Button
                    onClick={spin}
                    disabled={isSpinning}
                    size="lg"
                    className="w-full py-4 text-base md:text-lg cursor-pointer text-white font-bold hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: '#496B71',
                      boxShadow: '0 25px 50px -12px rgba(73, 107, 113, 0.3)'
                    }}
                  >
                    {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
                  </Button>
                </>
              ) : (
                <div className="text-center w-full py-2">
                   {!submitSuccess ? (
                     <>
                       <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 animate-bounce" style={{ backgroundColor: '#FED0B9' }}>
                          {result?.type === 'credit' || result?.type === 'free_entry' ? (
                              <Trophy size={32} className="md:w-10 md:h-10" style={{ color: '#496B71' }} />
                          ) : (
                              <Gift size={32} className="md:w-10 md:h-10" style={{ color: '#496B71' }} />
                          )}
                       </div>

                       <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#151e20' }}>
                         You Won!
                       </h3>

                       <p className="text-sm md:text-base mb-6" style={{ color: '#78716c' }}>
                         {result && getPrizeDescription(result)}. Enter your email to claim your prize. We'll send your code straight to your inbox.
                       </p>

                       {errorMessage && (
                         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                           {errorMessage}
                         </div>
                       )}

                       <form onSubmit={handleEmailSubmit} className="w-full mb-4">
                         <div className="relative mb-4">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                           <input
                             type="email"
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             placeholder="your@email.com"
                             required
                             className="w-full pl-11 pr-4 py-3 md:py-4 border-2 border-stone-200 rounded-lg focus:border-teal-500 focus:outline-none text-sm md:text-base"
                             disabled={isSubmitting}
                           />
                         </div>

                         <Button
                           type="submit"
                           disabled={isSubmitting || !email}
                           className="w-full cursor-pointer text-white font-bold hover:opacity-90 transition-opacity"
                           style={{
                             backgroundColor: '#496B71',
                             boxShadow: '0 10px 15px -3px rgba(73, 107, 113, 0.2)'
                           }}
                         >
                           {isSubmitting ? 'Claiming...' : 'Claim my prize'}
                         </Button>
                       </form>

                       <p className="text-[10px] md:text-xs text-stone-400">
                         This offer is for new customers only. One claim per email address.
                       </p>
                     </>
                   ) : (
                     <>
                       <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6" style={{ backgroundColor: '#FED0B9' }}>
                          <Mail size={32} className="md:w-10 md:h-10" style={{ color: '#496B71' }} />
                       </div>

                       <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#151e20' }}>
                         Check Your Inbox!
                       </h3>

                       <p className="text-sm md:text-base mb-6" style={{ color: '#78716c' }}>
                         Your prize is on its way to <strong>{email}</strong>. Don't forget to check your junk folder.
                       </p>

                       <Button
                         onClick={onClose}
                         className="w-full cursor-pointer text-white font-bold hover:opacity-90 transition-opacity"
                         style={{
                           backgroundColor: '#496B71',
                           boxShadow: '0 10px 15px -3px rgba(73, 107, 113, 0.2)'
                         }}
                       >
                         Start Shopping
                       </Button>
                     </>
                   )}
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
