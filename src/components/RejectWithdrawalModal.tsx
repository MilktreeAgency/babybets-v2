import { useState } from 'react'
import { XCircle, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      handleClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-destructive rounded-lg">
              <XCircle className="size-6 text-white" />
            </div>
            <div>
              <DialogTitle>Reject Withdrawal</DialogTitle>
              <DialogDescription>
                £{(withdrawalAmount / 100).toFixed(2)} withdrawal request
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                This action cannot be undone
              </p>
              <p className="text-xs text-amber-700">
                The user will be notified of the rejection with the reason you provide.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a clear reason for rejecting this withdrawal request..."
              disabled={isSubmitting}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and professional. This message will be shown to the user.
            </p>
          </div>

          {/* Footer */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !reason.trim()}
                className="flex-1 cursor-pointer"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Withdrawal'}
              </Button>
            </div>
            {!reason.trim() && !isSubmitting && (
              <p className="text-xs text-center text-destructive">
                Please provide a rejection reason
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
