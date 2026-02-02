import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ImageUpload'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type PrizeTemplate = Database['public']['Tables']['prize_templates']['Row']
type PrizeTemplateInsert = Database['public']['Tables']['prize_templates']['Insert']
type PrizeType = Database['public']['Enums']['prize_type']

interface PrizeDialogProps {
  prize: PrizeTemplate | null
  open: boolean
  isCreating: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PrizeDialog({
  prize,
  open,
  isCreating,
  onOpenChange,
  onSuccess,
}: PrizeDialogProps) {
  const [formData, setFormData] = useState<Partial<PrizeTemplateInsert>>({
    name: '',
    short_name: '',
    type: 'Physical',
    value_gbp: 0,
    cash_alternative_gbp: null,
    description: '',
    image_url: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (prize && !isCreating) {
      setFormData({
        name: prize.name,
        short_name: prize.short_name,
        type: prize.type,
        value_gbp: prize.value_gbp,
        cash_alternative_gbp: prize.cash_alternative_gbp,
        description: prize.description,
        image_url: prize.image_url,
        is_active: prize.is_active ?? true,
      })
    } else if (isCreating) {
      setFormData({
        name: '',
        short_name: '',
        type: 'Physical',
        value_gbp: 0,
        cash_alternative_gbp: null,
        description: '',
        image_url: '',
        is_active: true,
      })
    }
  }, [prize, isCreating, open])

  const handleSave = async () => {
    if (!formData.name || !formData.type || formData.value_gbp === undefined) {
      alert('Please fill in all required fields (Name, Type, Value)')
      return
    }

    if (formData.value_gbp <= 0) {
      alert('Prize value must be greater than 0')
      return
    }

    try {
      setSaving(true)

      if (isCreating) {
        const { error } = await supabase.from('prize_templates').insert({
          name: formData.name,
          short_name: formData.short_name || null,
          type: formData.type as PrizeType,
          value_gbp: formData.value_gbp,
          cash_alternative_gbp: formData.cash_alternative_gbp,
          description: formData.description || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active ?? true,
        })

        if (error) throw error
      } else if (prize) {
        const { error } = await supabase
          .from('prize_templates')
          .update({
            name: formData.name,
            short_name: formData.short_name || null,
            type: formData.type as PrizeType,
            value_gbp: formData.value_gbp,
            cash_alternative_gbp: formData.cash_alternative_gbp,
            description: formData.description || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active ?? true,
          })
          .eq('id', prize.id)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving prize:', error)
      alert('Failed to save prize')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 border-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle>{isCreating ? 'Create Prize' : 'Edit Prize'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Prize Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., iCandy Peach 7 Bundle"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Short Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Short Name
            </label>
            <input
              type="text"
              value={formData.short_name || ''}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="e.g., iCandy Peach 7"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional abbreviated name for compact displays
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Prize Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['Physical', 'Voucher', 'Cash', 'SiteCredit'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type as PrizeType })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.type === type
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type === 'Physical' && 'Physical Item'}
                  {type === 'Voucher' && 'Voucher/Gift Card'}
                  {type === 'Cash' && 'Cash Prize'}
                  {type === 'SiteCredit' && 'Site Credit'}
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          <div className={formData.type === 'Physical' ? 'grid grid-cols-2 gap-4' : ''}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Prize Value (GBP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.value_gbp || ''}
                onChange={(e) =>
                  setFormData({ ...formData, value_gbp: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formData.type === 'Physical' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Cash Alternative (GBP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cash_alternative_gbp || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cash_alternative_gbp: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional cash alternative for physical prize
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed prize description..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Prize Image
            </label>
            <ImageUpload
              value={formData.image_url || null}
              onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={formData.is_active ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              className="data-[state=checked]:bg-green-600"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">
              Active (available for selection in competitions)
            </label>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : isCreating ? 'Create Prize' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
