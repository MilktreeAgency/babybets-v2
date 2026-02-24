import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, DollarSign, Check } from 'lucide-react'
import type { PrizeChoice, PrizeTemplate } from '@/types'
import { usePrizeFulfillments } from '@/hooks/usePrizeFulfillments'
import { showErrorToast } from '@/lib/toast'

interface DeliveryAddress extends Record<string, string | undefined> {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  postcode: string
  phoneNumber: string
}

interface UserPrizeClaimModalProps {
  isOpen: boolean
  onClose: () => void
  prize: PrizeTemplate
  fulfillmentId: string
  onClaimed?: () => void
}

export function UserPrizeClaimModal({
  isOpen,
  onClose,
  prize,
  fulfillmentId,
  onClaimed
}: UserPrizeClaimModalProps) {
  const { updateFulfillment, isUpdating } = usePrizeFulfillments()
  const [selectedChoice, setSelectedChoice] = useState<PrizeChoice>('prize')
  const [success, setSuccess] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    phoneNumber: ''
  })

  const needsDeliveryAddress = prize.type === 'Physical' && selectedChoice === 'prize'

  const handleSubmit = async () => {
  
    // For physical prizes, show address form first
    if (needsDeliveryAddress && !showAddressForm) {
   
      setShowAddressForm(true)
      return
    }

    // Validate address if needed
    if (needsDeliveryAddress) {
      if (!address.fullName || !address.addressLine1 || !address.city || !address.postcode || !address.phoneNumber) {
        showErrorToast('Please fill in all required address fields')
        return
      }
    }

    try {
      await updateFulfillment({
        fulfillmentId,
        choice: selectedChoice,
        deliveryAddress: needsDeliveryAddress ? address : undefined,
        notes: `User selected: ${selectedChoice}`
      })

      setSuccess(true)
      setTimeout(() => {
        onClaimed?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to claim prize:', error)
      showErrorToast('Failed to claim prize. Please try again.')
    }
  }

  const handleBack = () => {
  
    setShowAddressForm(false)
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
            onClick={() => {
             
              onClose()
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => {
             
              e.stopPropagation()
            }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto"
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
                    : prize.type === 'Physical'
                    ? "We'll ship your prize to the address provided."
                    : "We'll send you the prize details via email."}
                </p>
              </div>
            ) : showAddressForm ? (
              <>
                {/* Address Form Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Delivery Address</h2>
                    <p className="text-sm text-gray-600 mt-1">Where should we send your prize?</p>
                  </div>
                  <button
                    onClick={() => {
                     
                      onClose()
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Address Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={address.addressLine1}
                      onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={address.addressLine2}
                      onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="London"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      value={address.postcode}
                      onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="SW1A 1AA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={address.phoneNumber}
                      onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="07123 456789"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUpdating ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Claim Your Prize!</h2>
                    <p className="text-sm text-gray-600 mt-1">Choose how you'd like to receive it</p>
                  </div>
                  <button
                    onClick={() => {
                     
                      onClose()
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                    onClick={() => {
                      
                      setSelectedChoice('prize')
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${
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
                            : prize.type === 'Voucher'
                            ? 'Receive voucher code via email'
                            : 'Receive via email'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Cash Alternative Option */}
                  {prize.cash_alternative_gbp && (
                    <button
                      onClick={() => {
                        
                        setSelectedChoice('cash')
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${
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
                  disabled={isUpdating}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUpdating ? 'Processing...' : needsDeliveryAddress ? 'Continue' : 'Claim Prize'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You have 30 days to claim your prize
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
