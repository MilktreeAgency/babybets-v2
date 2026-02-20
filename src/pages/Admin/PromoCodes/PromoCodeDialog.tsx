import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type PromoCode = Database['public']['Tables']['promo_codes']['Row']
type PromoCodeInsert = Database['public']['Tables']['promo_codes']['Insert']
type PromoCodeType = Database['public']['Enums']['promo_code_type']

interface PromoCodeDialogProps {
  promoCode: PromoCode | null
  open: boolean
  isCreating: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PromoCodeDialog({
  promoCode,
  open,
  isCreating,
  onOpenChange,
  onSuccess,
}: PromoCodeDialogProps) {
  const [formData, setFormData] = useState<Partial<PromoCodeInsert>>({
    code: '',
    type: 'percentage',
    value: 0,
    is_active: true,
    max_uses: null,
    max_uses_per_user: null,
    valid_from: null,
    valid_until: null,
    min_order_pence: null,
    new_customers_only: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (promoCode && !isCreating) {
      setFormData({
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        is_active: promoCode.is_active ?? true,
        max_uses: promoCode.max_uses,
        max_uses_per_user: promoCode.max_uses_per_user,
        valid_from: promoCode.valid_from,
        valid_until: promoCode.valid_until,
        min_order_pence: promoCode.min_order_pence,
        new_customers_only: promoCode.new_customers_only ?? false,
      })
    } else if (isCreating) {
      setFormData({
        code: '',
        type: 'percentage',
        value: 0,
        is_active: true,
        max_uses: null,
        max_uses_per_user: null,
        valid_from: null,
        valid_until: null,
        min_order_pence: null,
        new_customers_only: false,
      })
    }
  }, [promoCode, isCreating, open])

  const handleSave = async () => {
    if (!formData.code || !formData.type || formData.value === undefined) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      if (isCreating) {
        const { error } = await supabase.from('promo_codes').insert({
          code: formData.code.toUpperCase(),
          type: formData.type as PromoCodeType,
          value: formData.value,
          is_active: formData.is_active ?? true,
          max_uses: formData.max_uses,
          max_uses_per_user: formData.max_uses_per_user,
          valid_from: formData.valid_from,
          valid_until: formData.valid_until,
          min_order_pence: formData.min_order_pence,
          new_customers_only: formData.new_customers_only ?? false,
        })

        if (error) throw error
      } else if (promoCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update({
            code: formData.code.toUpperCase(),
            type: formData.type as PromoCodeType,
            value: formData.value,
            is_active: formData.is_active ?? true,
            max_uses: formData.max_uses,
            max_uses_per_user: formData.max_uses_per_user,
            valid_from: formData.valid_from,
            valid_until: formData.valid_until,
            min_order_pence: formData.min_order_pence,
            new_customers_only: formData.new_customers_only ?? false,
          })
          .eq('id', promoCode.id)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving promo code:', error)
      alert('Failed to save promo code')
    } finally {
      setSaving(false)
    }
  }

  const getValueLabel = () => {
    switch (formData.type) {
      case 'percentage':
        return 'Percentage Off (%)'
      case 'fixed_value':
        return 'Fixed Amount (pence)'
      case 'free_tickets':
        return 'Number of Free Tickets'
      default:
        return 'Value'
    }
  }

  const getValuePlaceholder = () => {
    switch (formData.type) {
      case 'percentage':
        return '10'
      case 'fixed_value':
        return '1000 (= £10.00)'
      case 'free_tickets':
        return '5'
      default:
        return '0'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 border-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{isCreating ? 'Create Promo Code' : 'Edit Promo Code'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 bg-admin-card-bg">
          <div className="space-y-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Promo Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER2024"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use uppercase letters, numbers, and underscores
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as PromoCodeType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed_value">Fixed Amount Off</SelectItem>
                  <SelectItem value="free_tickets">Free Tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {getValueLabel()} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                placeholder={getValuePlaceholder()}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-border cursor-pointer"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active (users can apply this code)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium mb-2">Max Total Uses</label>
              <input
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
            </div>

            {/* Max Uses Per User */}
            <div>
              <label className="block text-sm font-medium mb-2">Max Uses Per User</label>
              <input
                type="number"
                value={formData.max_uses_per_user || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses_per_user: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valid From */}
            <div>
              <label className="block text-sm font-medium mb-2">Valid From</label>
              <input
                type="datetime-local"
                value={
                  formData.valid_from
                    ? new Date(formData.valid_from).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valid_from: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for immediate</p>
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-sm font-medium mb-2">Valid Until</label>
              <input
                type="datetime-local"
                value={
                  formData.valid_until
                    ? new Date(formData.valid_until).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valid_until: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry</p>
            </div>
          </div>

          {/* Min Order Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Order Amount (pence)</label>
            <input
              type="number"
              value={formData.min_order_pence || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_order_pence: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum order value required (e.g., 1000 = £10.00)
            </p>
          </div>

          {/* New Customers Only */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="new_customers_only"
              checked={formData.new_customers_only ?? false}
              onChange={(e) =>
                setFormData({ ...formData, new_customers_only: e.target.checked })
              }
              className="rounded border-border cursor-pointer"
            />
            <label htmlFor="new_customers_only" className="text-sm font-medium">
              New customers only (first-time buyers)
            </label>
          </div>
          </div>
        </div>

        {/* Action Buttons - Fixed Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-admin-hover-bg rounded-b-lg">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.code || !formData.type}
            className="bg-admin-info-fg hover:bg-admin-info-text cursor-pointer"
          >
            {saving ? 'Saving...' : isCreating ? 'Create Promo Code' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
