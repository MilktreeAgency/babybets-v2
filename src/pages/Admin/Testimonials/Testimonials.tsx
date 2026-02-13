import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardHeader } from '../components'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Eye,
  EyeOff,
  GripVertical,
  Save
} from 'lucide-react'

interface Testimonial {
  id: string
  video_url: string
  quote: string
  author_name: string
  display_order: number
  is_active: boolean
  url?: string | null
  created_at: string
  updated_at: string
}

interface TestimonialsSectionSettings {
  headline: string
  description: string
}

const VIDEOS_BUCKET = 'videos'

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  // Section settings state
  const [sectionSettings, setSectionSettings] = useState({
    headline: '',
    description: ''
  })
  const [savingSectionSettings, setSavingSectionSettings] = useState(false)

  const [form, setForm] = useState({
    video_url: '',
    quote: '',
    author_name: '',
    display_order: 0,
    is_active: true,
    url: ''
  })

  // Load testimonials
  const loadTestimonials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      setTestimonials(data || [])
    } catch (error) {
      console.error('Error loading testimonials:', error)
      toast.error('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  // Load section settings
  const loadSectionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'testimonials_section')
        .single()

      if (error) throw error

      if (data && data.setting_value) {
        const settingValue = data.setting_value as unknown as TestimonialsSectionSettings
        setSectionSettings({
          headline: settingValue.headline || '',
          description: settingValue.description || ''
        })
      }
    } catch (error) {
      console.error('Error loading section settings:', error)
      toast.error('Failed to load section settings')
    }
  }

  // Save section settings
  const handleSaveSectionSettings = async () => {
    if (!sectionSettings.headline || !sectionSettings.description) {
      toast.error('Please fill in both headline and description')
      return
    }

    try {
      setSavingSectionSettings(true)

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: {
            headline: sectionSettings.headline,
            description: sectionSettings.description
          }
        })
        .eq('setting_key', 'testimonials_section')

      if (error) throw error

      toast.success('Section settings updated successfully')
    } catch (error) {
      console.error('Error saving section settings:', error)
      toast.error('Failed to save section settings')
    } finally {
      setSavingSectionSettings(false)
    }
  }

  // Handle video file upload
  const handleVideoUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingVideo(true)

      // Get file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4'

      // Generate completely random filename
      const randomString = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      const fileName = `${randomString}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from(VIDEOS_BUCKET)
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from(VIDEOS_BUCKET)
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading video:', error)
      toast.error('Failed to upload video')
      return null
    } finally {
      setUploadingVideo(false)
    }
  }

  useEffect(() => {
    loadTestimonials()
    loadSectionSettings()
  }, [])

  // Handle create new
  const handleCreate = () => {
    setForm({
      video_url: '',
      quote: '',
      author_name: '',
      display_order: testimonials.length + 1,
      is_active: true,
      url: ''
    })
    setSelectedTestimonial(null)
    setVideoFile(null)
    setEditDialogOpen(true)
  }

  // Handle edit
  const handleEdit = (testimonial: Testimonial) => {
    setForm({
      video_url: testimonial.video_url,
      quote: testimonial.quote,
      author_name: testimonial.author_name,
      display_order: testimonial.display_order,
      is_active: testimonial.is_active,
      url: testimonial.url || ''
    })
    setSelectedTestimonial(testimonial)
    setVideoFile(null)
    setEditDialogOpen(true)
  }

  // Handle save
  const handleSave = async () => {
    // Check if we need to upload a video first
    let videoUrl = form.video_url

    if (videoFile) {
      const uploadedUrl = await handleVideoUpload(videoFile)
      if (!uploadedUrl) {
        return // Upload failed, don't proceed
      }
      videoUrl = uploadedUrl
    }

    if (!videoUrl || !form.quote || !form.author_name) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      const testimonialData = {
        ...form,
        video_url: videoUrl
      }

      if (selectedTestimonial) {
        // Update existing
        const { error } = await supabase
          .from('testimonials')
          .update({
            ...testimonialData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTestimonial.id)

        if (error) throw error
        toast.success('Testimonial updated successfully')
      } else {
        // Create new
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData])

        if (error) throw error
        toast.success('Testimonial created successfully')
      }

      setEditDialogOpen(false)
      setVideoFile(null)
      loadTestimonials()
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast.error('Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTestimonial) return

    try {
      setDeleting(true)

      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', selectedTestimonial.id)

      if (error) throw error

      toast.success('Testimonial deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedTestimonial(null)
      loadTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast.error('Failed to delete testimonial')
    } finally {
      setDeleting(false)
    }
  }

  // Handle toggle active
  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({
          is_active: !testimonial.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', testimonial.id)

      if (error) throw error

      toast.success(testimonial.is_active ? 'Testimonial hidden' : 'Testimonial shown')
      loadTestimonials()
    } catch (error) {
      console.error('Error toggling testimonial:', error)
      toast.error('Failed to update testimonial')
    }
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Testimonials' }
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Testimonials</h1>
              <p className="text-muted-foreground mt-1">
                Manage customer testimonial videos for the homepage
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors"
            >
              <Plus className="size-4" />
              Add Testimonial
            </button>
          </div>

          {/* Section Settings */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Section Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Control the headline and description text displayed above testimonials
                </p>
              </div>
              <button
                onClick={handleSaveSectionSettings}
                disabled={savingSectionSettings}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-success-fg text-white rounded-lg hover:bg-admin-success-text transition-colors disabled:opacity-50"
              >
                <Save className="size-4" />
                {savingSectionSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-headline">Headline</Label>
                <Input
                  id="section-headline"
                  placeholder="Win amazing prizes at unbeatable odds"
                  value={sectionSettings.headline}
                  onChange={(e) => setSectionSettings({ ...sectionSettings, headline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="section-description">Description</Label>
                <Textarea
                  id="section-description"
                  placeholder="Real families winning real prizes every week..."
                  value={sectionSettings.description}
                  onChange={(e) => setSectionSettings({ ...sectionSettings, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Testimonials List */}
          <div className="bg-admin-card-bg border border-border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No testimonials</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Add customer testimonials with videos to display on your homepage
                </p>
                <button
                  onClick={handleCreate}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors"
                >
                  <Plus className="size-4" />
                  Add Testimonial
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Drag Handle */}
                      <div className="pt-3 cursor-move">
                        <GripVertical className="size-5 text-muted-foreground" />
                      </div>

                      {/* Video Preview */}
                      <div className="shrink-0">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted/50">
                          <video
                            src={testimonial.video_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-base mb-1">
                              {testimonial.author_name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              "{testimonial.quote}"
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              testimonial.is_active
                                ? 'bg-admin-success-bg text-admin-success-text'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {testimonial.is_active ? 'Active' : 'Hidden'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              Order: {testimonial.display_order}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTestimonial(testimonial)
                            setPreviewDialogOpen(true)
                          }}
                          className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Video className="size-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(testimonial)}
                          className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-colors"
                          title={testimonial.is_active ? 'Hide' : 'Show'}
                        >
                          {testimonial.is_active ? (
                            <Eye className="size-4 text-admin-success-fg" />
                          ) : (
                            <EyeOff className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(testimonial)}
                          className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTestimonial(testimonial)
                            setDeleteDialogOpen(true)
                          }}
                          className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4 text-admin-error-text" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
            </DialogTitle>
            <DialogDescription>
              Manage customer testimonial with video for homepage display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="video_file">Upload Video *</Label>
              <Input
                id="video_file"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setVideoFile(file)
                    // Clear URL if file is selected
                    setForm({ ...form, video_url: '' })
                  }
                }}
                className="cursor-pointer"
              />
              {videoFile && (
                <p className="text-xs text-admin-success-text mt-1">
                  Selected: {videoFile.name}
                </p>
              )}
              {!videoFile && form.video_url && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {form.video_url.split('/').pop()}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Upload a video file (MP4, WebM, or MOV format, max 100MB)
              </p>
            </div>

            <div>
              <Label htmlFor="quote">Quote *</Label>
              <Textarea
                id="quote"
                placeholder="Customer testimonial quote..."
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="author_name">Author Name *</Label>
              <Input
                id="author_name"
                placeholder="John Doe"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="url">Link URL (Optional)</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://instagram.com/username"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL to open when testimonial is clicked (e.g., Instagram profile, product page)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="cursor-pointer h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">Active (visible on site)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setVideoFile(null)
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploadingVideo}
              className="cursor-pointer"
            >
              {uploadingVideo ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Preview Testimonial</DialogTitle>
          </DialogHeader>

          {selectedTestimonial && (
            <div className="space-y-4">
              <div className="aspect-9/16 rounded-lg overflow-hidden bg-muted max-w-xs mx-auto">
                <video
                  src={selectedTestimonial.video_url}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm italic mb-2">
                  "{selectedTestimonial.quote}"
                </p>
                <p className="text-xs font-semibold">
                  {selectedTestimonial.author_name}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setPreviewDialogOpen(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer bg-admin-error-text hover:bg-admin-error-text/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
