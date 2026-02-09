import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, DollarSign, Check } from 'lucide-react'
import type { InstantWinPrize, PrizeChoice } from '@/types'
import { supabase } from '@/lib/supabase'

interface PrizeClaimModalProps {
  isOpen: boolean
  onClose: () => void
  prize: InstantWinPrize
  ticketId: string
  onClaimed?: () => void
}

export function PrizeClaimModal({ isOpen, onClose, prize, ticketId, onClaimed }: PrizeClaimModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<PrizeChoice>('prize')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) throw new Error('User not found')

      // Create/update prize fulfillment with user's choice
      const { data: fulfillmentData, error: fulfillmentError } = await supabase
        .from('prize_fulfillments')
        .upsert({
          ticket_id: ticketId,
          prize_id: prize.id,
          user_id: user.id,
          competition_id: prize.competition_id,
          choice: selectedChoice,
          value_pence: selectedChoice === 'cash'
            ? Math.round((prize.cash_alternative_gbp || 0) * 100)
            : Math.round(prize.value_gbp * 100),
          claim_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          status: selectedChoice === 'cash' ? 'cash_selected' : 'prize_selected',
        })
        .select()
        .single()

      if (fulfillmentError) throw fulfillmentError

      // If user chose cash alternative, instantly claim it
      if (selectedChoice === 'cash' && fulfillmentData) {
        const { data: claimData, error: claimError } = await supabase.rpc(
          'claim_cash_alternative',
          {
            p_fulfillment_id: fulfillmentData.id,
            p_user_id: user.id,
          }
        )

        if (claimError) {
          console.error('Failed to claim cash alternative:', claimError)
          throw claimError
        }

        
      }

      setSuccess(true)
      setTimeout(() => {
        onClaimed?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to claim prize:', error)
      alert('Failed to claim prize. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
          >
            {success ? (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
                >
                  <Check className="size-8 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Prize Claimed!</h2>
                <p className="text-gray-600">
                  {selectedChoice === 'cash'
                    ? `£${prize.cash_alternative_gbp} has been added to your wallet!`
                    : "We'll send you the prize details via email."}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Claim Your Prize!</h2>
                    <p className="text-sm text-gray-600 mt-1">Choose how you'd like to receive it</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Prize Info */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    {prize.image_url ? (
                      <img
                        src={prize.image_url}
                        alt={prize.name}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="size-16 bg-white rounded-lg flex items-center justify-center">
                        <Gift className="size-8 text-orange-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{prize.name}</h3>
                      <p className="text-sm text-gray-600">Worth £{prize.value_gbp}</p>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {/* Physical Prize Option */}
                  <button
                    onClick={() => setSelectedChoice('prize')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedChoice === 'prize'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-5 rounded-full border-2 flex items-center justify-center ${
                          selectedChoice === 'prize'
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedChoice === 'prize' && <Check className="size-3 text-white" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold flex items-center gap-2">
                          <Gift className="size-4" />
                          Receive the Prize
                        </p>
                        <p className="text-sm text-gray-600">
                          {prize.type === 'Physical'
                            ? 'We\'ll ship it to your address'
                            : 'Receive voucher code via email'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Cash Alternative Option */}
                  {prize.cash_alternative_gbp && (
                    <button
                      onClick={() => setSelectedChoice('cash')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        selectedChoice === 'cash'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-5 rounded-full border-2 flex items-center justify-center ${
                            selectedChoice === 'cash'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedChoice === 'cash' && <Check className="size-3 text-white" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold flex items-center gap-2">
                            <DollarSign className="size-4" />
                            Cash Alternative
                          </p>
                          <p className="text-sm text-gray-600">
                            Receive £{prize.cash_alternative_gbp} instead
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Claim Prize'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You have 14 days to claim your prize
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
