import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSidebar } from '@/contexts/SidebarContext'

type CompetitionInsert = Database['public']['Tables']['competitions']['Insert']

interface TieredPrice {
  minQty: number
  maxQty: number
  pricePerTicketPence: number
}

export default function CompetitionForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { isCollapsed } = useSidebar()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = Boolean(id)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: '',
    category: 'Toys' as Database['public']['Enums']['competition_category'],
    competition_type: 'standard' as Database['public']['Enums']['competition_type'],
    start_datetime: '',
    end_datetime: '',
    draw_datetime: '',
    max_tickets: 1000,
    max_tickets_per_user: 100,
    base_ticket_price_pence: 100,
    total_value_gbp: 0,
    retail_value_gbp: 0,
    is_featured: false,
    show_on_homepage: true,
  })

  const [tieredPricing, setTieredPricing] = useState<TieredPrice[]>([
    { minQty: 1, maxQty: 9, pricePerTicketPence: 100 },
  ])

  // Load competition data when editing
  useEffect(() => {
    if (isEditMode && id) {
      loadCompetitionData(id)
    }
  }, [id, isEditMode])

  const loadCompetitionData = async (competitionId: string) => {
    setLoadingData(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        // Format datetime strings for datetime-local inputs
        const formatDateTime = (date: string | null) => {
          if (!date) return ''
          return new Date(date).toISOString().slice(0, 16)
        }

        setFormData({
          title: data.title,
          slug: data.slug,
          description: data.description || '',
          image_url: data.image_url,
          category: data.category,
          competition_type: data.competition_type,
          start_datetime: formatDateTime(data.start_datetime),
          end_datetime: formatDateTime(data.end_datetime),
          draw_datetime: formatDateTime(data.draw_datetime),
          max_tickets: data.max_tickets,
          max_tickets_per_user: data.max_tickets_per_user,
          base_ticket_price_pence: data.base_ticket_price_pence,
          total_value_gbp: data.total_value_gbp,
          retail_value_gbp: data.retail_value_gbp || 0,
          is_featured: data.is_featured || false,
          show_on_homepage: data.show_on_homepage || true,
        })

        if (data.tiered_pricing && Array.isArray(data.tiered_pricing)) {
          setTieredPricing(data.tiered_pricing as TieredPrice[])
        }
      }
    } catch (err) {
      console.error('Error loading competition:', err)
      setError(err instanceof Error ? err.message : 'Failed to load competition')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? parseFloat(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    setFormData((prev) => ({ ...prev, title, slug }))
  }

  const addTieredPrice = () => {
    const lastTier = tieredPricing[tieredPricing.length - 1]
    setTieredPricing([
      ...tieredPricing,
      {
        minQty: lastTier.maxQty + 1,
        maxQty: lastTier.maxQty + 10,
        pricePerTicketPence: lastTier.pricePerTicketPence - 10,
      },
    ])
  }

  const removeTieredPrice = (index: number) => {
    setTieredPricing(tieredPricing.filter((_, i) => i !== index))
  }

  const updateTieredPrice = (index: number, field: keyof TieredPrice, value: number) => {
    setTieredPricing(
      tieredPricing.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    )
  }

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.slug.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.image_url.trim() !== '' &&
      formData.category !== '' &&
      formData.competition_type !== '' &&
      formData.start_datetime !== '' &&
      formData.end_datetime !== '' &&
      formData.max_tickets > 0 &&
      formData.max_tickets_per_user > 0 &&
      formData.base_ticket_price_pence > 0 &&
      formData.total_value_gbp > 0
    )
  }

  const handleSubmit = async (e: FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Prepare competition data
      const competitionData: any = {
        ...formData,
        status: isDraft ? 'draft' : 'scheduled',
        tiered_pricing: tieredPricing as any, // JSONB field accepts object directly
        base_ticket_price_pence: Math.round(formData.base_ticket_price_pence),
        total_value_gbp: formData.total_value_gbp,
        retail_value_gbp: formData.retail_value_gbp || null,
        draw_datetime: formData.draw_datetime || null,
      }

      console.log('Submitting competition data:', competitionData)

      if (isEditMode && id) {
        // Update existing competition
        const { data, error: updateError } = await supabase
          .from('competitions')
          .update(competitionData)
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }

        navigate(`/admin/dashboard/competitions/${data.id}`)
      } else {
        // Create new competition
        const { data, error: insertError } = await supabase
          .from('competitions')
          .insert(competitionData)
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }

        navigate(`/admin/dashboard/competitions/${data.id}`)
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} competition:`, err)
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} competition`
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Competitions', href: '/admin/dashboard/competitions' },
          { label: isEditMode ? 'Edit Competition' : 'Create Competition' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 pb-24 space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard/competitions')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">
                {isEditMode ? 'Edit Competition' : 'Create Competition'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditMode ? 'Update competition details' : 'Set up a new competition'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading competition data...</p>
              </div>
            </div>
          ) : (
            <form id="competition-form" onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Baby Bundle Prize Competition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="baby-bundle-prize-competition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter competition description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value as any }))
                      }
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toys">Toys</SelectItem>
                        <SelectItem value="Baby & Nursery">Baby & Nursery</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Instant Wins">Instant Wins</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Competition Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.competition_type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, competition_type: value as any }))
                      }
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Draw</SelectItem>
                        <SelectItem value="instant_win">Instant Win Only</SelectItem>
                        <SelectItem value="instant_win_with_end_prize">
                          Instant Win + End Prize
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Times */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Dates & Times</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    value={formData.start_datetime}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="end_datetime"
                    value={formData.end_datetime}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Draw Date</label>
                  <input
                    type="datetime-local"
                    name="draw_datetime"
                    value={formData.draw_datetime}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Ticket Configuration */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Ticket Configuration</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Tickets <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_tickets"
                      value={formData.max_tickets}
                      onChange={handleInputChange}
                      required
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Per User <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_tickets_per_user"
                      value={formData.max_tickets_per_user}
                      onChange={handleInputChange}
                      required
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Base Ticket Price (pence) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="base_ticket_price_pence"
                    value={formData.base_ticket_price_pence}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    £{(formData.base_ticket_price_pence / 100).toFixed(2)} per ticket
                  </p>
                </div>

                {/* Tiered Pricing */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Tiered Pricing</label>
                    <button
                      type="button"
                      onClick={addTieredPrice}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="size-4" />
                      Add Tier
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tieredPricing.map((tier, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tier.minQty}
                          onChange={(e) =>
                            updateTieredPrice(index, 'minQty', parseInt(e.target.value))
                          }
                          placeholder="Min"
                          step="1"
                          className="w-20 px-2 py-1 text-sm border border-border rounded"
                        />
                        <span className="text-sm">-</span>
                        <input
                          type="number"
                          value={tier.maxQty}
                          onChange={(e) =>
                            updateTieredPrice(index, 'maxQty', parseInt(e.target.value))
                          }
                          placeholder="Max"
                          step="1"
                          className="w-20 px-2 py-1 text-sm border border-border rounded"
                        />
                        <span className="text-sm">@</span>
                        <input
                          type="number"
                          value={tier.pricePerTicketPence}
                          onChange={(e) =>
                            updateTieredPrice(
                              index,
                              'pricePerTicketPence',
                              parseInt(e.target.value)
                            )
                          }
                          placeholder="Price (pence)"
                          step="1"
                          className="flex-1 px-2 py-1 text-sm border border-border rounded"
                        />
                        <span className="text-sm text-muted-foreground">
                          £{(tier.pricePerTicketPence / 100).toFixed(2)}
                        </span>
                        {tieredPricing.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTieredPrice(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Information */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Prize Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total Value (£) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_value_gbp"
                    value={formData.total_value_gbp}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Retail Value (£)</label>
                  <input
                    type="number"
                    name="retail_value_gbp"
                    value={formData.retail_value_gbp}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Featured Competition</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="show_on_homepage"
                    checked={formData.show_on_homepage}
                    onChange={handleInputChange}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Show on Homepage</span>
                </label>
              </div>
            </div>

          </form>
          )}
        </div>
      </div>

      {/* Fixed Footer Actions */}
      <div
        className="fixed bottom-0 right-0 bg-white border-t border-border p-4 flex items-center justify-end gap-3 z-10 transition-all duration-300"
        style={{ left: isCollapsed ? '64px' : '256px' }}
      >
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard/competitions')}
          className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="submit"
          form="competition-form"
          disabled={loading || !isFormValid() || loadingData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Competition' : 'Publish Competition')}
        </button>
      </div>
    </>
  )
}
