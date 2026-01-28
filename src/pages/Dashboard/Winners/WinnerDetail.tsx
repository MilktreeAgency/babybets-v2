import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Trophy,
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Gift,
  Package,
  CheckCircle,
  Clock,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Star,
  Upload,
  Image as ImageIcon,
  Send,
  Check,
  X,
} from 'lucide-react'

type Winner = Database['public']['Tables']['winners']['Row']
type PrizeFulfillment = Database['public']['Tables']['prize_fulfillments']['Row']
type FulfillmentStatus = Database['public']['Enums']['fulfillment_status']

interface WinnerWithDetails extends Winner {
  competition?: {
    id: string
    title: string
    slug: string
    image_url: string | null
  }
  user?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    postcode: string | null
    country: string | null
  }
  ticket?: {
    id: string
    ticket_number: number
  }
  draw?: {
    id: string
    winner_index: number
    verification_hash: string
    executed_at: string
    random_source: string
  }
}

export default function WinnerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [winner, setWinner] = useState<WinnerWithDetails | null>(null)
  const [fulfillment, setFulfillment] = useState<PrizeFulfillment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<FulfillmentStatus | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Visibility settings
  const [isPublic, setIsPublic] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [showInTicker, setShowInTicker] = useState(false)

  // Social proof
  const [testimonial, setTestimonial] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)

  useEffect(() => {
    if (id) {
      loadWinner()
    }
  }, [id])

  const loadWinner = async () => {
    if (!id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('winners')
        .select(`
          *,
          competition:competitions(id, title, slug, image_url),
          user:profiles(id, email, first_name, last_name, phone, address_line1, address_line2, city, postcode, country),
          ticket:ticket_allocations(id, ticket_number)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Fetch draw information if this is an end prize
      let drawData = null
      if (data.win_type === 'end_prize' && data.ticket_id) {
        const { data: draw } = await supabase
          .from('draws')
          .select('id, winner_index, verification_hash, executed_at, random_source')
          .eq('winning_ticket_id', data.ticket_id)
          .single()

        drawData = draw
      }

      setWinner({
        ...data,
        competition: data.competition as WinnerWithDetails['competition'],
        user: data.user as WinnerWithDetails['user'],
        ticket: data.ticket as WinnerWithDetails['ticket'],
        draw: drawData as WinnerWithDetails['draw'],
      })

      // Initialize visibility settings
      setIsPublic(data.is_public ?? true)
      setFeatured(data.featured ?? false)
      setShowInTicker(data.show_in_ticker ?? true)
      setTestimonial(data.testimonial || '')

      // Load fulfillment if exists
      if (data.ticket_id) {
        const { data: fulfillmentData } = await supabase
          .from('prize_fulfillments')
          .select('*')
          .eq('ticket_id', data.ticket_id)
          .single()

        if (fulfillmentData) {
          setFulfillment(fulfillmentData)
          setSelectedStatus(fulfillmentData.status)
          setTrackingNumber(fulfillmentData.tracking_number || '')
          setNotes(fulfillmentData.notes || '')
        }
      }
    } catch (error) {
      console.error('Error loading winner:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFulfillment = async () => {
    if (!fulfillment || !selectedStatus) return

    try {
      setUpdating(true)
      const updateData: Record<string, unknown> = {
        status: selectedStatus,
        updated_at: new Date().toISOString(),
      }

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber
      }

      if (notes) {
        updateData.notes = notes
      }

      // Set timestamps based on status
      if (selectedStatus === 'dispatched' && !fulfillment.dispatched_at) {
        updateData.dispatched_at = new Date().toISOString()
      }

      if (selectedStatus === 'delivered' && !fulfillment.delivered_at) {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('prize_fulfillments')
        .update(updateData)
        .eq('id', fulfillment.id)

      if (error) throw error

      alert('Fulfillment updated successfully')
      loadWinner()
    } catch (error) {
      console.error('Error updating fulfillment:', error)
      alert('Failed to update fulfillment')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteWinner = async () => {
    if (!winner) return

    try {
      setDeleting(true)
      const { error } = await supabase.from('winners').delete().eq('id', winner.id)

      if (error) throw error

      navigate('/admin/dashboard/winners')
    } catch (error) {
      console.error('Error deleting winner:', error)
      alert('Failed to delete winner')
      setDeleting(false)
    }
  }

  // Visibility toggle handlers
  const handleToggleVisibility = async (field: 'is_public' | 'featured' | 'show_in_ticker', value: boolean) => {
    if (!winner) return

    try {
      const { error } = await supabase
        .from('winners')
        .update({ [field]: value })
        .eq('id', winner.id)

      if (error) throw error

      // Update local state
      if (field === 'is_public') setIsPublic(value)
      if (field === 'featured') setFeatured(value)
      if (field === 'show_in_ticker') setShowInTicker(value)

      // Reload winner to ensure data is in sync
      loadWinner()
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Failed to update ${field}`)
    }
  }

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!winner || !event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${winner.id}-${Date.now()}.${fileExt}`
      const filePath = `winner-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath)

      // Update winner record
      const { error: updateError } = await supabase
        .from('winners')
        .update({ winner_photo_url: urlData.publicUrl })
        .eq('id', winner.id)

      if (updateError) throw updateError

      alert('Photo uploaded successfully')
      loadWinner()
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Testimonial update handler
  const handleUpdateTestimonial = async () => {
    if (!winner) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('winners')
        .update({ testimonial })
        .eq('id', winner.id)

      if (error) throw error

      alert('Testimonial updated successfully')
      loadWinner()
    } catch (error) {
      console.error('Error updating testimonial:', error)
      alert('Failed to update testimonial')
    } finally {
      setUpdating(false)
    }
  }

  // Request photo/testimonial handler
  const handleRequestPhotoTestimonial = async () => {
    if (!winner || !winner.user?.email) return

    try {
      setSendingRequest(true)

      // In a real implementation, this would call an edge function to send an email
      // For now, we'll just simulate it
      const response = await fetch('/api/send-winner-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winner.id,
          email: winner.user.email,
          displayName: winner.display_name,
          prizeName: winner.prize_name,
        }),
      })

      if (!response.ok) {
        // If the API doesn't exist yet, just show a message
        console.log('Email API not configured yet')
        alert(
          `Request would be sent to ${winner.user.email}.\n\nNote: Email functionality requires backend setup.`
        )
      } else {
        alert('Request sent successfully!')
      }
    } catch (error) {
      console.error('Error sending request:', error)
      alert(
        `Request prepared for ${winner.user?.email}.\n\nNote: Email functionality requires backend setup.`
      )
    } finally {
      setSendingRequest(false)
    }
  }

  const getFulfillmentBadge = (status?: string | null) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      prize_selected: { label: 'Prize Selected', color: 'bg-blue-100 text-blue-800' },
      cash_selected: { label: 'Cash Selected', color: 'bg-purple-100 text-purple-800' },
      processing: { label: 'Processing', color: 'bg-orange-100 text-orange-800' },
      dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expired', color: 'bg-red-100 text-red-800' },
    }

    const badge = status ? badges[status] : { label: 'Not Started', color: 'bg-gray-100 text-gray-800' }
    return badge
  }

  const getWinTypeBadge = (winType: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      instant_win: { label: 'Instant Win', color: 'bg-blue-100 text-blue-800' },
      end_prize: { label: 'End Prize', color: 'bg-purple-100 text-purple-800' },
      manual: { label: 'Manual', color: 'bg-gray-100 text-gray-800' },
    }

    return badges[winType] || badges.manual
  }

  if (loading) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Winners', href: '/admin/dashboard/winners' },
            { label: 'Loading...' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-muted-foreground">Loading winner details...</p>
          </div>
        </div>
      </>
    )
  }

  if (!winner) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Winners', href: '/admin/dashboard/winners' },
            { label: 'Not Found' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Winner not found</p>
            <Link
              to="/admin/dashboard/winners"
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Back to Winners
            </Link>
          </div>
        </div>
      </>
    )
  }

  const badge = getFulfillmentBadge(fulfillment?.status)
  const winTypeBadge = getWinTypeBadge(winner.win_type || 'manual')

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Winners', href: '/admin/dashboard/winners' },
          { label: winner.display_name },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header with Back Button and Actions */}
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard/winners"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Back to Winners
            </Link>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
            >
              <Trash2 className="size-4 mr-2" />
              Delete Winner
            </Button>
          </div>

          {/* Winner Profile Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-6">
              {winner.prize_image_url || winner.winner_photo_url ? (
                <img
                  src={winner.winner_photo_url || winner.prize_image_url || ''}
                  alt={winner.display_name}
                  className="size-24 rounded-full object-cover"
                />
              ) : (
                <div className="size-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-medium">
                  <Trophy className="size-12" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold">{winner.display_name}</h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${winTypeBadge.color}`}
                  >
                    {winTypeBadge.label}
                  </span>
                  {winner.is_public && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Public
                    </span>
                  )}
                  {winner.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>
                {winner.user?.email && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Mail className="size-4" />
                    <span>{winner.user.email}</span>
                  </div>
                )}
                {winner.location && (
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <MapPin className="size-4" />
                    <span>{winner.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    Won on{' '}
                    {winner.won_at
                      ? new Date(winner.won_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {winner.testimonial && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm italic text-muted-foreground">"{winner.testimonial}"</p>
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="size-5" />
              Visibility Settings
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {isPublic ? (
                      <Eye className="size-4 text-blue-600" />
                    ) : (
                      <EyeOff className="size-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">Public Gallery</div>
                    <div className="text-sm text-muted-foreground">
                      Show winner in public gallery and social proof
                    </div>
                  </div>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => handleToggleVisibility('is_public', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className={`size-4 ${featured ? 'text-yellow-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="font-medium">Featured Winner</div>
                    <div className="text-sm text-muted-foreground">
                      Feature on homepage spotlight
                    </div>
                  </div>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => handleToggleVisibility('featured', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600 cursor-pointer"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className={`size-4 ${showInTicker ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="font-medium">Winner Ticker</div>
                    <div className="text-sm text-muted-foreground">
                      Display in homepage winner ticker
                    </div>
                  </div>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={showInTicker}
                    onChange={(e) => handleToggleVisibility('show_in_ticker', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 cursor-pointer"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Social Proof Management */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="size-5" />
                Social Proof
              </h3>
              <Button
                onClick={handleRequestPhotoTestimonial}
                disabled={sendingRequest || !winner.user?.email}
                size="sm"
                variant="outline"
                className="cursor-pointer"
              >
                <Send className="size-4 mr-2" />
                {sendingRequest ? 'Sending...' : 'Request from Winner'}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Winner Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Winner Photo
                </label>
                {winner.winner_photo_url && (
                  <div className="mb-3">
                    <img
                      src={winner.winner_photo_url}
                      alt={winner.display_name}
                      className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium cursor-pointer">
                      <Upload className="size-4" />
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </div>
                  </label>
                  {winner.winner_photo_url && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="size-4" />
                      Photo uploaded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: 5MB. Recommended: Square image, min 400x400px
                </p>
              </div>

              {/* Testimonial Editor */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Testimonial
                </label>
                <textarea
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                  placeholder="Enter winner's testimonial..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {testimonial.length} characters
                  </p>
                  <Button
                    onClick={handleUpdateTestimonial}
                    disabled={updating || testimonial === (winner.testimonial || '')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    {updating ? 'Saving...' : 'Save Testimonial'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prize Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Gift className="size-5" />
                Prize Details
              </h3>
              <div className="space-y-4">
                {winner.prize_image_url && (
                  <img
                    src={winner.prize_image_url}
                    alt={winner.prize_name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Prize Name</div>
                  <div className="text-lg font-medium">{winner.prize_name}</div>
                </div>
                {winner.prize_value_gbp && (
                  <div>
                    <div className="text-sm text-muted-foreground">Prize Value</div>
                    <div className="text-2xl font-semibold text-green-600">
                      £{winner.prize_value_gbp.toFixed(2)}
                    </div>
                  </div>
                )}
                {winner.ticket && (
                  <div>
                    <div className="text-sm text-muted-foreground">Winning Ticket Number</div>
                    <div className="font-mono text-lg font-medium">#{winner.ticket.ticket_number}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Competition Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="size-5" />
                Competition Details
              </h3>
              <div className="space-y-4">
                {winner.competition?.image_url && (
                  <img
                    src={winner.competition.image_url}
                    alt={winner.competition.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                {winner.competition && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Competition</div>
                      <div className="text-lg font-medium">{winner.competition.title}</div>
                    </div>
                    <Link
                      to={`/admin/dashboard/competitions/${winner.competition.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                    >
                      View Competition Details →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Draw Information (for end prizes) */}
          {winner.draw && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="size-5" />
                Draw Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Winner Index</div>
                  <div className="font-mono text-lg font-medium">{winner.draw.winner_index}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Random Source</div>
                  <div className="font-mono text-sm">{winner.draw.random_source}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Executed At</div>
                  <div className="text-sm">
                    {new Date(winner.draw.executed_at).toLocaleString('en-GB')}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <div className="text-sm text-muted-foreground">Verification Hash</div>
                  <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                    {winner.draw.verification_hash}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Information */}
          {winner.user && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Mail className="size-5" />
                Winner Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div>
                    {winner.user.first_name || winner.user.last_name
                      ? `${winner.user.first_name || ''} ${winner.user.last_name || ''}`.trim()
                      : 'Not provided'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div>{winner.user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div>{winner.user.phone || 'Not provided'}</div>
                </div>
                {(winner.user.address_line1 || winner.user.city || winner.user.postcode) && (
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="space-y-1">
                      {winner.user.address_line1 && <div>{winner.user.address_line1}</div>}
                      {winner.user.address_line2 && <div>{winner.user.address_line2}</div>}
                      {(winner.user.city || winner.user.postcode) && (
                        <div>
                          {winner.user.city}
                          {winner.user.city && winner.user.postcode && ', '}
                          {winner.user.postcode}
                        </div>
                      )}
                      {winner.user.country && <div>{winner.user.country}</div>}
                    </div>
                  </div>
                )}
              </div>
              <Link
                to={`/admin/dashboard/users/${winner.user.id}`}
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
              >
                View User Profile →
              </Link>
            </div>
          )}

          {/* Prize Fulfillment */}
          {fulfillment && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="size-5" />
                  Prize Fulfillment
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>

              <div className="space-y-4">
                {/* Status Update */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Fulfillment Status
                  </label>
                  <Select
                    value={selectedStatus || 'pending'}
                    onValueChange={(value) => setSelectedStatus(value as FulfillmentStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="prize_selected">Prize Selected</SelectItem>
                      <SelectItem value="cash_selected">Cash Selected</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Tracking Number (optional)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this fulfillment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Fulfillment Timeline */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-gray-400" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(fulfillment.created_at!).toLocaleString('en-GB')}</span>
                    </div>
                    {fulfillment.notified_at && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-blue-500" />
                        <span className="text-muted-foreground">Notified:</span>
                        <span>{new Date(fulfillment.notified_at).toLocaleString('en-GB')}</span>
                      </div>
                    )}
                    {fulfillment.responded_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-500" />
                        <span className="text-muted-foreground">Responded:</span>
                        <span>{new Date(fulfillment.responded_at).toLocaleString('en-GB')}</span>
                      </div>
                    )}
                    {fulfillment.dispatched_at && (
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-indigo-500" />
                        <span className="text-muted-foreground">Dispatched:</span>
                        <span>{new Date(fulfillment.dispatched_at).toLocaleString('en-GB')}</span>
                      </div>
                    )}
                    {fulfillment.delivered_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-600" />
                        <span className="text-muted-foreground">Delivered:</span>
                        <span>{new Date(fulfillment.delivered_at).toLocaleString('en-GB')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-orange-500" />
                      <span className="text-muted-foreground">Claim Deadline:</span>
                      <span>{new Date(fulfillment.claim_deadline).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                </div>

                {/* Winner Choice */}
                {fulfillment.choice && (
                  <div className="border-t pt-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Winner's Choice:</span>
                      <span className="ml-2 font-medium capitalize">{fulfillment.choice}</span>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {fulfillment.delivery_address && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Delivery Address
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      {typeof fulfillment.delivery_address === 'object' &&
                        fulfillment.delivery_address !== null && (
                          <div className="space-y-1">
                            {Object.entries(fulfillment.delivery_address).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Update Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleUpdateFulfillment}
                    disabled={updating || selectedStatus === fulfillment.status}
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    {updating ? 'Updating...' : 'Update Fulfillment'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
            <div>
              Winner ID: <span className="font-mono">{winner.id}</span>
            </div>
            {winner.ticket_id && (
              <div>
                Ticket ID: <span className="font-mono">{winner.ticket_id}</span>
              </div>
            )}
            {winner.created_at && (
              <div>Created: {new Date(winner.created_at).toLocaleString('en-GB')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Winner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this winner record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Winner Info */}
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              {winner.prize_image_url ? (
                <img
                  src={winner.prize_image_url}
                  alt={winner.display_name}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <div className="size-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white">
                  <Trophy className="size-6" />
                </div>
              )}
              <div>
                <div className="font-medium">{winner.display_name}</div>
                <div className="text-sm text-muted-foreground">{winner.prize_name}</div>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will only delete the winner display record. The
                underlying ticket and fulfillment data will remain.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteWinner}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Winner'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
