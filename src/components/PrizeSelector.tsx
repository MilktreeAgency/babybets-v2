import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, Package, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type PrizeTemplate = Database['public']['Tables']['prize_templates']['Row']

export interface SelectedPrize {
  prizeTemplateId: string
  prizeName: string
  prizeType: string
  prizeValue: number
  prizeImageUrl: string | null
  prizeCode: string
  quantity: number
  tier: number
}

interface PrizeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPrizes: (prizes: SelectedPrize[]) => void
  existingSelections?: SelectedPrize[]
  mode?: 'multiple' | 'single' // For instant win prizes vs end prize
  title?: string
}

export function PrizeSelector({
  open,
  onOpenChange,
  onSelectPrizes,
  existingSelections = [],
  mode = 'multiple',
  title = 'Select Instant Win Prizes',
}: PrizeSelectorProps) {
  const [prizes, setPrizes] = useState<PrizeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrizes, setSelectedPrizes] = useState<Map<string, SelectedPrize>>(new Map())

  useEffect(() => {
    if (open) {
      loadPrizes()
      // Initialize with existing selections
      const initialSelections = new Map<string, SelectedPrize>()
      existingSelections.forEach((prize) => {
        initialSelections.set(prize.prizeTemplateId, prize)
      })
      setSelectedPrizes(initialSelections)
    }
  }, [open, existingSelections])

  const loadPrizes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prize_templates')
        .select('*')
        .eq('is_active', true)
        .order('value_gbp', { ascending: false })

      if (error) throw error
      setPrizes(data || [])
    } catch (error) {
      console.error('Error loading prizes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrizes = prizes.filter((prize) =>
    prize.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const togglePrizeSelection = (prize: PrizeTemplate) => {
    const newSelections = new Map(selectedPrizes)

    if (mode === 'single') {
      // Single selection mode - replace all selections
      newSelections.clear()
      newSelections.set(prize.id, {
        prizeTemplateId: prize.id,
        prizeName: prize.name,
        prizeType: prize.type,
        prizeValue: Number(prize.value_gbp),
        prizeImageUrl: prize.image_url,
        prizeCode: `PR-${(prizes.indexOf(prize) + 1).toString().padStart(3, '0')}`,
        quantity: 1,
        tier: 1,
      })
    } else {
      // Multiple selection mode
      if (newSelections.has(prize.id)) {
        newSelections.delete(prize.id)
      } else {
        // Auto-generate prize code and tier based on position
        const nextTier = newSelections.size + 1
        newSelections.set(prize.id, {
          prizeTemplateId: prize.id,
          prizeName: prize.name,
          prizeType: prize.type,
          prizeValue: Number(prize.value_gbp),
          prizeImageUrl: prize.image_url,
          prizeCode: `PR-${(prizes.indexOf(prize) + 1).toString().padStart(3, '0')}`,
          quantity: 1,
          tier: nextTier,
        })
      }
    }

    setSelectedPrizes(newSelections)
  }

  const updatePrizeDetails = (prizeId: string, field: 'quantity' | 'tier' | 'prizeCode', value: string | number) => {
    const newSelections = new Map(selectedPrizes)
    const prize = newSelections.get(prizeId)
    if (prize) {
      if (field === 'quantity' || field === 'tier') {
        prize[field] = Number(value)
      } else {
        prize[field] = String(value)
      }
      newSelections.set(prizeId, prize)
      setSelectedPrizes(newSelections)
    }
  }

  const handleConfirm = () => {
    const prizesArray = Array.from(selectedPrizes.values())
    onSelectPrizes(prizesArray)
    onOpenChange(false)
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string }> = {
      Physical: { color: 'bg-blue-100 text-blue-800' },
      Voucher: { color: 'bg-green-100 text-green-800' },
      Cash: { color: 'bg-purple-100 text-purple-800' },
      SiteCredit: { color: 'bg-orange-100 text-orange-800' },
    }
    return badges[type] || { color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mode === 'single'
              ? 'Select one prize for the end prize draw'
              : 'Select prizes from your library and configure quantities'}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prizes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Prize List */}
          <div className="flex-1 overflow-y-auto border border-border rounded-lg">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading prizes...</p>
              </div>
            ) : filteredPrizes.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="size-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No prizes found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPrizes.map((prize) => {
                  const isSelected = selectedPrizes.has(prize.id)
                  const selectedDetails = selectedPrizes.get(prize.id)
                  const typeBadge = getTypeBadge(prize.type)

                  return (
                    <div key={prize.id} className={`p-4 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="flex items-center pt-1">
                          <button
                            onClick={() => togglePrizeSelection(prize)}
                            className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {isSelected && <Check className="size-3 text-white" />}
                          </button>
                        </div>

                        {/* Prize Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            {prize.image_url && (
                              <img
                                src={prize.image_url}
                                alt={prize.name}
                                className="size-16 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-foreground">{prize.name}</h4>
                                  {prize.short_name && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {prize.short_name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-foreground">
                                    £{Number(prize.value_gbp).toFixed(2)}
                                  </div>
                                  {prize.cash_alternative_gbp && (
                                    <div className="text-xs text-muted-foreground">
                                      Cash: £{Number(prize.cash_alternative_gbp).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge.color}`}>
                                  {prize.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Configuration (only show if selected and in multiple mode) */}
                          {isSelected && selectedDetails && mode === 'multiple' && (
                            <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                  Prize Code
                                </label>
                                <input
                                  type="text"
                                  value={selectedDetails.prizeCode}
                                  onChange={(e) => updatePrizeDetails(prize.id, 'prizeCode', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="PR-001"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={selectedDetails.quantity}
                                  onChange={(e) => updatePrizeDetails(prize.id, 'quantity', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                  Tier (Order)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={selectedDetails.tier}
                                  onChange={(e) => updatePrizeDetails(prize.id, 'tier', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected Count */}
          {selectedPrizes.size > 0 && (
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              {selectedPrizes.size} {mode === 'single' ? 'prize' : 'prizes'} selected
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedPrizes.size === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirm Selection ({selectedPrizes.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
