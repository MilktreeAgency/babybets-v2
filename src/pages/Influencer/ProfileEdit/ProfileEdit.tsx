import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { Save, ArrowLeft, Upload, X } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Influencer = Database['public']['Tables']['influencers']['Row']

export default function ProfileEdit() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [formData, setFormData] = useState({
    display_name: '',
    page_bio: '',
    social_profile_url: '',
    profile_image_url: ''
  })
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadInfluencerData()
  }, [])

  const loadInfluencerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      // Check if user is an influencer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'influencer') {
        navigate('/')
        return
      }

      // Load influencer data
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (influencerError) throw influencerError
      setInfluencer(influencerData)
      setFormData({
        display_name: influencerData.display_name || '',
        page_bio: influencerData.page_bio || '',
        social_profile_url: influencerData.social_profile_url || '',
        profile_image_url: influencerData.profile_image_url || ''
      })
    } catch (error) {
      console.error('Error loading influencer data:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file: File) => {
    try {
      setUploadingProfile(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${influencer?.id}-profile-${Date.now()}.${fileExt}`
      const filePath = `influencer-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, profile_image_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploadingProfile(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      uploadImage(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      if (!influencer) throw new Error('No influencer data')

      console.log('Updating influencer profile:', influencer.id, formData)

      const { data, error: updateError } = await supabase
        .from('influencers')
        .update({
          display_name: formData.display_name,
          page_bio: formData.page_bio,
          social_profile_url: formData.social_profile_url,
          profile_image_url: formData.profile_image_url
        })
        .eq('id', influencer.id)
        .select()

      console.log('Update result:', { data, error: updateError })

      if (updateError) {
        console.error('Update error details:', updateError)
        throw updateError
      }

      console.log('Profile updated successfully')
      setSuccess(true)
      setTimeout(() => {
        navigate('/influencer/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block size-12 border-4 border-border border-t-[#496B71] rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!influencer) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFBF7' }}>
      <Header />

      <div className="flex-1 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/influencer/dashboard')}
              className="flex items-center gap-2 mb-4 font-bold cursor-pointer hover:underline"
              style={{ color: '#496B71' }}
            >
              <ArrowLeft className="size-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Edit Profile
            </h1>
            <p className="text-lg mt-2" style={{ color: '#78716c' }}>
              Update your public profile information
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                Profile updated successfully! Redirecting...
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border space-y-6" style={{ borderColor: '#e7e5e4' }}>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 transition-colors"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Page Bio
                </label>
                <textarea
                  rows={5}
                  value={formData.page_bio}
                  onChange={(e) => setFormData({ ...formData, page_bio: e.target.value })}
                  placeholder="Longer bio for your public partner page..."
                  className="w-full px-4 py-3 rounded-lg border-2 transition-colors resize-none"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#151e20' }}>
                  Social Profile URL
                </label>
                <input
                  type="url"
                  value={formData.social_profile_url}
                  onChange={(e) => setFormData({ ...formData, social_profile_url: e.target.value })}
                  placeholder="https://instagram.com/yourprofile"
                  className="w-full px-4 py-3 rounded-lg border-2 transition-colors"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                />
              </div>
            </div>

            {/* Profile Image */}
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e7e5e4' }}>
              <label className="block text-sm font-bold mb-4" style={{ color: '#151e20' }}>
                Profile Image
              </label>
              <div className="flex items-start gap-6">
                {formData.profile_image_url ? (
                  <div className="relative">
                    <img
                      src={formData.profile_image_url}
                      alt="Profile"
                      className="size-32 rounded-full object-cover border-2"
                      style={{ borderColor: '#e7e5e4' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, profile_image_url: '' }))}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white cursor-pointer hover:bg-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="size-32 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: '#e7e5e4' }}>
                    <Upload className="size-8" style={{ color: '#78716c' }} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                    disabled={uploadingProfile}
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold transition-colors cursor-pointer"
                    style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                  >
                    <Upload className="size-5" />
                    {uploadingProfile ? 'Uploading...' : 'Upload Image'}
                  </label>
                  <p className="text-sm mt-2" style={{ color: '#78716c' }}>
                    Recommended: Square image, at least 400x400px, max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/influencer/dashboard')}
                className="flex-1 py-3 font-bold rounded-lg border-2 transition-colors cursor-pointer"
                style={{ borderColor: '#e7e5e4', color: '#151e20' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#496B71', color: 'white' }}
              >
                <Save className="size-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
