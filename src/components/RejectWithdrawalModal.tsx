import { useState } from 'react'
import { X, XCircle, AlertTriangle } from 'lucide-react'

interface RejectWithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  withdrawalAmount: number
  isSubmitting?: boolean
}

export function RejectWithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  withdrawalAmount,
  isSubmitting = false,
}: RejectWithdrawalModalProps) {
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      onConfirm(reason.trim())
      setReason('')
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
        style={{ backgroundColor: '#fffbf7' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#ef4444' }}>
                <XCircle className="size-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#2D251E' }}>
                  Reject Withdrawal
                </h2>
                <p className="text-xs" style={{ color: '#666' }}>
                  £{(withdrawalAmount / 100).toFixed(2)} withdrawal request
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              <X size={20} style={{ color: '#666' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Warning Banner */}
          <div
            className="mb-5 p-4 rounded-xl border"
            style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1" style={{ color: '#92400e' }}>
                  This action cannot be undone
                </p>
                <p className="text-xs" style={{ color: '#b45309' }}>
                  The user will be notified of the rejection with the reason you provide.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-bold mb-2 block" style={{ color: '#2D251E' }}>
                Rejection Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all resize-none"
                style={{
                  borderColor: reason.trim() ? '#ef4444' : '#e5e7eb',
                  backgroundColor: 'white',
                  minHeight: '120px',
                }}
                placeholder="Please provide a clear reason for rejecting this withdrawal request..."
                disabled={isSubmitting}
              />
              <p className="text-xs mt-2" style={{ color: '#666' }}>
                Be specific and professional. This message will be shown to the user.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: '#e5e7eb', backgroundColor: 'white' }}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 cursor-pointer disabled:opacity-50 hover:bg-gray-200"
              style={{ backgroundColor: '#f3f4f6', color: '#2D251E' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 py-3.5 rounded-xl font-bold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: '#ef4444' }}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Withdrawal'}
            </button>
          </div>
          {!reason.trim() && !isSubmitting && (
            <p className="text-xs text-center mt-3" style={{ color: '#ef4444' }}>
              Please provide a rejection reason
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
