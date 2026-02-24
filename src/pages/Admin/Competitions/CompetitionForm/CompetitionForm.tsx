import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../../components'
import { ArrowLeft, Plus, Trash2, Package, Star, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { useSidebar } from '@/contexts/SidebarContext'
import { PrizeSelector, type SelectedPrize } from '@/components/PrizeSelector'
import { MultiImageUpload } from '@/components/MultiImageUpload'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

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

  const isEditMode = Boolean(id)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    image_url: '',
    images: [] as string[],
    category: 'Toys' as Database['public']['Enums']['competition_category'],
    competition_type: 'standard' as Database['public']['Enums']['competition_type'],
    max_tickets: 1000,
    max_tickets_per_user: 100,
    base_ticket_price_pence: 100,
    total_value_gbp: 0,
    retail_value_gbp: 0,
    cash_alternative_gbp: 0,
    is_featured: false,
    show_on_homepage: true,
  })

  // Separate state for date/time fields
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [drawDate, setDrawDate] = useState<Date | undefined>(undefined)

  const [tieredPricing, setTieredPricing] = useState<TieredPrice[]>([])

  const [useCurrentStartDate, setUseCurrentStartDate] = useState(false)
  const [isTicketPoolLocked, setIsTicketPoolLocked] = useState(false)

  // Prize selection state
  const [selectedPrizes, setSelectedPrizes] = useState<SelectedPrize[]>([])
  const [prizeSelectorOpen, setPrizeSelectorOpen] = useState(false)
  const [endPrize, setEndPrize] = useState<SelectedPrize | null>(null)
  const [endPrizeSelectorOpen, setEndPrizeSelectorOpen] = useState(false)

  // Load competition data when editing
  useEffect(() => {
    if (isEditMode && id) {
      loadCompetitionData(id)
    }
  }, [id, isEditMode])

  const loadCompetitionData = async (competitionId: string) => {
    setLoadingData(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          title: data.title,
          slug: data.slug,
          short_description: data.short_description || '',
          description: data.description || '',
          image_url: data.image_url,
          images: (data.images as string[]) || [],
          category: data.category,
          competition_type: data.competition_type,
          max_tickets: data.max_tickets,
          max_tickets_per_user: data.max_tickets_per_user || 100,
          base_ticket_price_pence: data.base_ticket_price_pence,
          total_value_gbp: data.total_value_gbp,
          retail_value_gbp: data.retail_value_gbp || 0,
          cash_alternative_gbp: (data as Record<string, unknown>).cash_alternative_gbp as number || 0,
          is_featured: data.is_featured || false,
          show_on_homepage: data.show_on_homepage || true,
        })

        // Set date/time fields
        if (data.start_datetime) {
          setStartDate(new Date(data.start_datetime))
        }
        if (data.end_datetime) {
          setEndDate(new Date(data.end_datetime))
        }
        if (data.draw_datetime) {
          setDrawDate(new Date(data.draw_datetime))
        }

        // Set ticket pool locked state
        setIsTicketPoolLocked(data.ticket_pool_locked || false)

        if (data.tiered_pricing && Array.isArray(data.tiered_pricing)) {
          setTieredPricing(data.tiered_pricing as unknown as TieredPrice[])
        }

        // Load competition prizes
        if (data.competition_type === 'instant_win' || data.competition_type === 'instant_win_with_end_prize') {
          const { data: prizesData } = await supabase
            .from('competition_instant_win_prizes')
            .select(`
              *,
              prize_templates (
                id,
                name,
                type,
                value_gbp,
                image_url
              )
            `)
            .eq('competition_id', competitionId)
            .order('tier', { ascending: true })

          if (prizesData) {
            const prizes: SelectedPrize[] = prizesData.map((p: Record<string, unknown>) => ({
              prizeTemplateId: p.prize_template_id as string,
              prizeName: (p.prize_templates as Record<string, unknown>)?.name as string,
              prizeType: (p.prize_templates as Record<string, unknown>)?.type as string,
              prizeValue: Number((p.prize_templates as Record<string, unknown>)?.value_gbp) || 0,
              prizeImageUrl: ((p.prize_templates as Record<string, unknown>)?.image_url as string) || null,
              prizeCode: p.prize_code as string,
              quantity: p.total_quantity as number,
              tier: p.tier as number,
            }))
            setSelectedPrizes(prizes)
          }
        }

        // Load end prize if exists
        if (data.end_prize && typeof data.end_prize === 'object') {
          const endPrizeData = data.end_prize as Record<string, unknown>
          setEndPrize({
            prizeTemplateId: endPrizeData.prizeTemplateId as string,
            prizeName: endPrizeData.prizeName as string,
            prizeType: endPrizeData.prizeType as string,
            prizeValue: Number(endPrizeData.prizeValue) || 0,
            prizeImageUrl: (endPrizeData.prizeImageUrl as string) || null,
            prizeCode: 'END-PRIZE',
            quantity: 1,
            tier: 999,
          })
        }
      }
    } catch (err) {
      console.error('Error loading competition:', err)
      showErrorToast(err instanceof Error ? err.message : 'Failed to load competition')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    // Sanitize slug to ensure it's URL-safe
    let processedValue = value
    if (name === 'slug' && typeof value === 'string') {
      processedValue = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? parseFloat(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : processedValue,
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
    // Predefined tier ranges
    const predefinedTiers = [
      { minQty: 1, maxQty: 9, pricePerTicketPence: 100 },
      { minQty: 10, maxQty: 50, pricePerTicketPence: 90 },
      { minQty: 51, maxQty: 70, pricePerTicketPence: 80 },
      { minQty: 71, maxQty: 100, pricePerTicketPence: 70 },
    ]

    const currentTierCount = tieredPricing.length

    // Add the next predefined tier if available
    if (currentTierCount < predefinedTiers.length) {
      const nextTier = predefinedTiers[currentTierCount]
      setTieredPricing([...tieredPricing, nextTier])
    } else {
      // If all predefined tiers are added, create a custom tier based on the last one
      const lastTier = tieredPricing[tieredPricing.length - 1]
      setTieredPricing([
        ...tieredPricing,
        {
          minQty: lastTier.maxQty + 1,
          maxQty: lastTier.maxQty + 10,
          pricePerTicketPence: Math.max(lastTier.pricePerTicketPence - 10, 10),
        },
      ])
    }
  }

  const removeTieredPrice = (index: number) => {
    setTieredPricing(tieredPricing.filter((_, i) => i !== index))
  }

  const updateTieredPrice = (index: number, field: keyof TieredPrice, value: number) => {
    setTieredPricing(
      tieredPricing.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    )
  }

  const handleUseCurrentStartDate = (checked: boolean) => {
    setUseCurrentStartDate(checked)
    if (checked) {
      setStartDate(new Date())
    }
  }

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.slug.trim() !== '' &&
      formData.description.trim() !== '' &&
      (formData.images.length > 0 || formData.image_url.trim() !== '') &&
      startDate !== undefined &&
      endDate !== undefined &&
      formData.max_tickets > 0 &&
      formData.max_tickets_per_user > 0 &&
      formData.base_ticket_price_pence > 0 &&
      formData.total_value_gbp > 0
    )
  }

  const handleSubmit = async (e: FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Determine status based on draft flag and start date
      let status: Database['public']['Enums']['competition_status'] = 'active'
      if (isDraft) {
        status = 'draft'
      } else {
        // When publishing, check if start date is in the future or past
        const now = new Date()
        if (startDate && startDate > now) {
          status = 'scheduled'
        } else {
          status = 'active'
        }
      }

      // Validate ticket pool for all competition types before activation
      const isActivating = status === 'active' || status === 'scheduled'

      if (isActivating && !isTicketPoolLocked) {
        showErrorToast('Cannot publish competition without generating the ticket pool first. Please save as draft, then generate the ticket pool from the competition detail page before publishing.')
        setLoading(false)
        return
      }

      // Prepare competition data
      const competitionData: any = {
        ...formData,
        status,
        images: formData.images, // Array of image URLs
        tiered_pricing: tieredPricing as any, // JSONB field accepts object directly
        base_ticket_price_pence: Math.round(formData.base_ticket_price_pence),
        total_value_gbp: formData.total_value_gbp,
        retail_value_gbp: formData.retail_value_gbp || null,
        // Convert Date objects to ISO strings
        start_datetime: startDate?.toISOString() || null,
        end_datetime: endDate?.toISOString() || null,
        // Only include draw_datetime for standard and instant_win_with_end_prize
        draw_datetime: formData.competition_type === 'instant_win' ? null : (drawDate?.toISOString() || null),
        end_prize: endPrize ? {
          prizeTemplateId: endPrize.prizeTemplateId,
          prizeName: endPrize.prizeName,
          prizeType: endPrize.prizeType,
          prizeValue: endPrize.prizeValue,
          prizeImageUrl: endPrize.prizeImageUrl,
        } : null,
      }

      let competitionId: string

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

        competitionId = data.id

        // Update prizes for instant win competitions
        // CRITICAL: Only update prizes if ticket pool is NOT locked
        // Deleting prizes when pool is locked will set all ticket prize_id to NULL due to ON DELETE SET NULL constraint
        if (formData.competition_type === 'instant_win' || formData.competition_type === 'instant_win_with_end_prize') {
          if (!isTicketPoolLocked) {
            // Delete existing prizes
            await supabase
              .from('competition_instant_win_prizes')
              .delete()
              .eq('competition_id', competitionId)

            // Insert new prizes
            if (selectedPrizes.length > 0) {
              const prizesToInsert = selectedPrizes.map(prize => ({
                competition_id: competitionId,
                prize_template_id: prize.prizeTemplateId,
                prize_code: prize.prizeCode,
                total_quantity: prize.quantity,
                remaining_quantity: prize.quantity,
                tier: prize.tier,
              }))

              const { error: prizeError } = await supabase
                .from('competition_instant_win_prizes')
                .insert(prizesToInsert)

              if (prizeError) {
                console.error('Error inserting prizes:', prizeError)
                throw prizeError
              }
            }
          } 
        }

        showSuccessToast(isDraft ? 'Competition saved as draft' : 'Competition updated successfully')
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

        competitionId = data.id

        // Insert prizes for instant win competitions
        if (formData.competition_type === 'instant_win' || formData.competition_type === 'instant_win_with_end_prize') {
          if (selectedPrizes.length > 0) {
            const prizesToInsert = selectedPrizes.map(prize => ({
              competition_id: competitionId,
              prize_template_id: prize.prizeTemplateId,
              prize_code: prize.prizeCode,
              total_quantity: prize.quantity,
              remaining_quantity: prize.quantity,
              tier: prize.tier,
            }))

            const { error: prizeError } = await supabase
              .from('competition_instant_win_prizes')
              .insert(prizesToInsert)

            if (prizeError) {
              console.error('Error inserting prizes:', prizeError)
              throw prizeError
            }
          }
        }

        showSuccessToast(isDraft ? 'Competition saved as draft' : 'Competition created successfully')
        navigate(`/admin/dashboard/competitions/${data.id}`)
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} competition:`, err)
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} competition`
      showErrorToast(errorMessage)
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
              className="p-2 hover:bg-admin-hover-bg rounded-lg transition-colors cursor-pointer"
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

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-info-fg mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading competition data...</p>
              </div>
            </div>
          ) : (
            <form id="competition-form" onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-admin-card-bg border border-border rounded-lg p-6">
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
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
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
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg font-mono text-sm"
                    placeholder="baby-bundle-prize-competition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Short Description
                  </label>
                  <textarea
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg resize-none"
                    placeholder="Brief 1-2 line summary shown under the title on the competition page"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.short_description.length}/200 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                    placeholder="Enter competition description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Competition Images <span className="text-red-500">*</span>
                  </label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData((prev) => ({ ...prev, images: urls }))}
                    maxImages={5}
                    maxSizeMB={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    {isEditMode ? (
                      <div className="flex items-center h-10">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {formData.category}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {['Toys', 'Baby & Nursery', 'Cash', 'Instant Wins', 'Other'].map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, category: category as any }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                              formData.category === category
                                ? 'bg-admin-info-fg text-white hover:bg-admin-info-text'
                                : 'bg-admin-gray-bg text-foreground hover:bg-admin-hover-bg'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Competition Type <span className="text-red-500">*</span>
                    </label>
                    {isEditMode && isTicketPoolLocked ? (
                      <div className="flex items-center h-10">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-admin-info-bg text-admin-info-fg">
                          {formData.competition_type === 'standard' && 'Standard Draw'}
                          {formData.competition_type === 'instant_win' && 'Instant Win Only'}
                          {formData.competition_type === 'instant_win_with_end_prize' && 'Instant Win + End Prize'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, competition_type: 'standard' }))}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            formData.competition_type === 'standard'
                              ? 'bg-admin-info-fg text-white hover:bg-admin-info-text'
                              : 'bg-admin-gray-bg text-foreground hover:bg-admin-hover-bg'
                          }`}
                        >
                          Standard Draw
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, competition_type: 'instant_win' }))}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            formData.competition_type === 'instant_win'
                              ? 'bg-admin-info-fg text-white hover:bg-admin-info-text'
                              : 'bg-admin-gray-bg text-foreground hover:bg-admin-hover-bg'
                          }`}
                        >
                          Instant Win Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, competition_type: 'instant_win_with_end_prize' }))}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            formData.competition_type === 'instant_win_with_end_prize'
                              ? 'bg-admin-info-fg text-white hover:bg-admin-info-text'
                              : 'bg-admin-gray-bg text-foreground hover:bg-admin-hover-bg'
                          }`}
                        >
                          Instant Win + End Prize
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Times */}
            <div className="bg-admin-card-bg border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Dates & Times</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCurrentStartDate}
                        onChange={(e) => handleUseCurrentStartDate(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">Use current date/time</span>
                    </label>
                  </div>
                  <DateTimePicker
                    date={startDate}
                    setDate={setStartDate}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <DateTimePicker
                    date={endDate}
                    setDate={setEndDate}
                  />
                </div>

                {/* Draw Date - only show for standard and instant_win_with_end_prize */}
                {formData.competition_type !== 'instant_win' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Draw Date</label>
                    <DateTimePicker
                      date={drawDate}
                      setDate={setDrawDate}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Configuration */}
            <div className="bg-admin-card-bg border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Ticket Configuration</h2>
                {isTicketPoolLocked && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-admin-orange-bg text-admin-orange-fg">
                    🔒 Pool Locked
                  </span>
                )}
              </div>
              {isTicketPoolLocked && (
                <div className="mb-4 p-3 bg-admin-orange-bg border border-admin-orange-fg rounded-lg">
                  <p className="text-sm text-admin-orange-fg">
                    Ticket configuration is locked because the ticket pool has been generated. Cannot edit ticket settings.
                  </p>
                </div>
              )}
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
                      disabled={isTicketPoolLocked}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg disabled:bg-admin-gray-bg disabled:cursor-not-allowed disabled:opacity-60"
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
                      disabled={isTicketPoolLocked}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg disabled:bg-admin-gray-bg disabled:cursor-not-allowed disabled:opacity-60"
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
                    disabled={isTicketPoolLocked}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    £{(formData.base_ticket_price_pence / 100).toFixed(2)} per ticket
                  </p>
                </div>

                {/* Tiered Pricing */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Tiered Pricing</label>
                    {!isTicketPoolLocked && (
                      <button
                        type="button"
                        onClick={addTieredPrice}
                        className="text-sm text-admin-info-fg hover:text-admin-info-text font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="size-4" />
                        Add Tier
                      </button>
                    )}
                  </div>
                  {tieredPricing.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 bg-admin-gray-bg rounded-lg">
                      No tiered pricing configured. Base ticket price will apply to all tickets.
                    </div>
                  ) : (
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
                          disabled={isTicketPoolLocked}
                          className="w-20 px-2 py-1 text-sm border border-border rounded disabled:bg-admin-gray-bg disabled:cursor-not-allowed disabled:opacity-60"
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
                          disabled={isTicketPoolLocked}
                          className="w-20 px-2 py-1 text-sm border border-border rounded disabled:bg-admin-gray-bg disabled:cursor-not-allowed disabled:opacity-60"
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
                          disabled={isTicketPoolLocked}
                          className="flex-1 px-2 py-1 text-sm border border-border rounded disabled:bg-admin-gray-bg disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <span className="text-sm text-muted-foreground">
                          £{(tier.pricePerTicketPence / 100).toFixed(2)}
                        </span>
                        {!isTicketPoolLocked && (
                          <button
                            type="button"
                            onClick={() => removeTieredPrice(index)}
                            className="p-1 text-admin-error-text hover:bg-admin-error-bg rounded cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prize Information */}
            <div className="bg-admin-card-bg border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Prize Information</h2>
              <div className="space-y-4">
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
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
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
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
                    />
                  </div>
                </div>

                {/* Cash Alternative for Standard Draw */}
                {formData.competition_type === 'standard' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cash Alternative (£) <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="cash_alternative_gbp"
                      value={formData.cash_alternative_gbp}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Enter cash alternative amount"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Winner can choose between the physical prize or this cash amount
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instant Win Prizes */}
            {(formData.competition_type === 'instant_win' || formData.competition_type === 'instant_win_with_end_prize') && (
              <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Instant Win Prizes</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select prizes from your library that users can win instantly
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrizeSelectorOpen(true)}
                    disabled={isTicketPoolLocked}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Select Prizes
                  </button>
                </div>

                {isTicketPoolLocked && (
                  <div className="mb-4 p-3 bg-admin-orange-bg border border-admin-orange-fg rounded-lg">
                    <p className="text-sm text-admin-orange-fg">
                      🔒 Prize configuration is locked because the ticket pool has been generated. Editing prizes would break existing ticket assignments and remove prizes from already-sold tickets.
                    </p>
                  </div>
                )}

                {selectedPrizes.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <Package className="size-12 text-admin-gray-bg mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No instant win prizes selected</p>
                    <button
                      type="button"
                      onClick={() => setPrizeSelectorOpen(true)}
                      disabled={isTicketPoolLocked}
                      className="text-admin-info-fg hover:text-admin-info-text text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Select prizes from library
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPrizes.map((prize, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                        {prize.prizeImageUrl && (
                          <img
                            src={prize.prizeImageUrl}
                            alt={prize.prizeName}
                            className="size-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{prize.prizeName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Code: {prize.prizeCode}</span>
                            <span>Qty: {prize.quantity}</span>
                            <span>Tier: {prize.tier}</span>
                            <span className="font-semibold text-foreground">£{prize.prizeValue.toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPrizes(selectedPrizes.filter((_, i) => i !== index))}
                          disabled={isTicketPoolLocked}
                          className="p-2 text-admin-error-text hover:bg-admin-error-bg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {selectedPrizes.length} prize{selectedPrizes.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrizeSelectorOpen(true)}
                        disabled={isTicketPoolLocked}
                        className="text-admin-info-fg hover:text-admin-info-text text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Edit Selection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* End Prize (only for instant_win_with_end_prize) */}
            {formData.competition_type === 'instant_win_with_end_prize' && (
              <div className="bg-admin-card-bg border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">End Prize (Grand Prize)</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      The main prize drawn at the end of the competition
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEndPrizeSelectorOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-admin-purple-fg text-white rounded-lg hover:bg-admin-purple-fg transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" />
                    {endPrize ? 'Change Prize' : 'Select Prize'}
                  </button>
                </div>

                {!endPrize ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <Package className="size-12 text-admin-gray-bg mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No end prize selected</p>
                    <button
                      type="button"
                      onClick={() => setEndPrizeSelectorOpen(true)}
                      className="text-admin-purple-fg hover:text-admin-purple-fg text-sm font-medium cursor-pointer"
                    >
                      Select end prize
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 border-2 border-admin-purple-fg bg-admin-purple-bg rounded-lg">
                    {endPrize.prizeImageUrl && (
                      <img
                        src={endPrize.prizeImageUrl}
                        alt={endPrize.prizeName}
                        className="size-20 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-lg">{endPrize.prizeName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-muted-foreground">{endPrize.prizeType}</span>
                        <span className="font-semibold text-admin-purple-fg text-lg">£{endPrize.prizeValue.toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEndPrize(null)}
                      className="p-2 text-admin-error-text hover:bg-admin-error-bg rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="bg-admin-card-bg border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.is_featured ? 'bg-admin-success-bg' : 'bg-admin-gray-bg'}`}>
                      <Star className={`size-4 ${formData.is_featured ? 'text-admin-success-fg' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="font-medium">Featured Competition</div>
                      <div className="text-sm text-muted-foreground">
                        Highlight this competition in featured section
                      </div>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-admin-gray-bg peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-admin-success-fg rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-success-fg cursor-pointer"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.show_on_homepage ? 'bg-admin-success-bg' : 'bg-admin-gray-bg'}`}>
                      {formData.show_on_homepage ? (
                        <Eye className="size-4 text-admin-success-fg" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Show on Homepage</div>
                      <div className="text-sm text-muted-foreground">
                        Display competition on the homepage
                      </div>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      name="show_on_homepage"
                      checked={formData.show_on_homepage}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-admin-gray-bg peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-admin-success-fg rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-success-fg cursor-pointer"></div>
                  </div>
                </label>
              </div>
            </div>

          </form>
          )}
        </div>
      </div>

      {/* Fixed Footer Actions */}
      <div
        className="fixed bottom-0 right-0 bg-admin-card-bg border-t border-border p-4 flex items-center justify-end gap-3 z-10 transition-all duration-300"
        style={{ left: isCollapsed ? '64px' : '256px' }}
      >
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard/competitions')}
          className="px-4 py-2 border border-border rounded-lg hover:bg-admin-hover-bg transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          className="px-4 py-2 border border-border rounded-lg hover:bg-admin-hover-bg transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="submit"
          form="competition-form"
          disabled={loading || !isFormValid() || loadingData}
          className="px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Competition' : 'Publish Competition')}
        </button>
      </div>

      {/* Prize Selector Dialogs */}
      <PrizeSelector
        open={prizeSelectorOpen}
        onOpenChange={setPrizeSelectorOpen}
        onSelectPrizes={setSelectedPrizes}
        existingSelections={selectedPrizes}
        mode="multiple"
        title="Select Instant Win Prizes"
      />

      <PrizeSelector
        open={endPrizeSelectorOpen}
        onOpenChange={setEndPrizeSelectorOpen}
        onSelectPrizes={(prizes) => setEndPrize(prizes[0] || null)}
        existingSelections={endPrize ? [endPrize] : []}
        mode="single"
        title="Select End Prize (Grand Prize)"
      />
    </>
  )
}
