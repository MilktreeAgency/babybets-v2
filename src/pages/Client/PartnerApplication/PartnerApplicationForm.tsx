import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface PartnerApplicationFormProps {
  isOpen: boolean
  onClose: () => void
}

interface CustomSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  required?: boolean
}

function CustomSelect({ label, value, options, onChange, required }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div>
      <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
        {label} {required && '*'}
      </label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-9 sm:pr-10 text-sm sm:text-base rounded-lg border-2 transition-colors text-left cursor-pointer relative"
          style={{
            borderColor: isOpen ? '#496B71' : '#e7e5e4',
            color: '#151e20',
            backgroundColor: 'white'
          }}
        >
          {selectedOption?.label || 'Select...'}
          <ChevronDown
            size={18}
            className="sm:w-5 sm:h-5 transition-transform duration-200"
            style={{
              color: '#78716c',
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)'
            }}
          />
        </button>

        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className="rounded-lg border-2 shadow-lg overflow-hidden"
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
              borderColor: '#e7e5e4',
              backgroundColor: 'white'
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-left transition-colors flex items-center justify-between cursor-pointer"
                style={{
                  backgroundColor: value === option.value ? 'rgba(73, 107, 113, 0.05)' : 'white',
                  color: '#151e20'
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.backgroundColor = '#f5f5f4'
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.backgroundColor = 'white'
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(73, 107, 113, 0.05)'
                  }
                }}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check size={14} className="sm:w-4 sm:h-4" style={{ color: '#496B71' }} />
                )}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}

export default function PartnerApplicationForm({ isOpen, onClose }: PartnerApplicationFormProps) {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    primary_platform: 'Instagram' as 'Instagram' | 'TikTok' | 'YouTube',
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
    total_followers: '',
    program_interest: 'Not sure' as 'Affiliate' | 'Brand Ambassador' | 'Not sure'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isAutoFilled, setIsAutoFilled] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
    social_urls: '',
    total_followers: ''
  })

  // Auto-fill name and email if user is logged in
  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
      setIsAutoFilled(true)
      // Clear any previous errors when modal opens
      setFieldErrors({
        name: '',
        email: '',
        instagram_url: '',
        tiktok_url: '',
        facebook_url: '',
        social_urls: '',
        total_followers: ''
      })
    } else if (isOpen && !user) {
      setIsAutoFilled(false)
      // Clear any previous errors when modal opens
      setFieldErrors({
        name: '',
        email: '',
        instagram_url: '',
        tiktok_url: '',
        facebook_url: '',
        social_urls: '',
        total_followers: ''
      })
    }
  }, [isOpen, user])

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      instagram_url: '',
      tiktok_url: '',
      facebook_url: '',
      social_urls: '',
      total_followers: ''
    }

    let isValid = true

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
      isValid = false
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
      isValid = false
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Validate at least one social URL is provided
    const hasInstagram = formData.instagram_url.trim()
    const hasTikTok = formData.tiktok_url.trim()
    const hasFacebook = formData.facebook_url.trim()

    if (!hasInstagram && !hasTikTok && !hasFacebook) {
      errors.social_urls = 'At least one social media URL is required'
      isValid = false
    }

    // Validate Instagram URL if provided
    if (hasInstagram) {
      try {
        new URL(formData.instagram_url)
      } catch {
        errors.instagram_url = 'Please enter a valid URL'
        isValid = false
      }
    }

    // Validate TikTok URL if provided
    if (hasTikTok) {
      try {
        new URL(formData.tiktok_url)
      } catch {
        errors.tiktok_url = 'Please enter a valid URL'
        isValid = false
      }
    }

    // Validate Facebook URL if provided
    if (hasFacebook) {
      try {
        new URL(formData.facebook_url)
      } catch {
        errors.facebook_url = 'Please enter a valid URL'
        isValid = false
      }
    }

    // Validate total followers
    if (!formData.total_followers) {
      errors.total_followers = 'Total followers is required'
      isValid = false
    } else if (parseInt(formData.total_followers) < 100) {
      errors.total_followers = 'Minimum 100 followers required'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Check if slug already exists (name-based uniqueness)
      const { data: existingApplication } = await supabase
        .from('influencers')
        .select('id')
        .eq('slug', formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
        .maybeSingle()

      if (existingApplication) {
        setFieldErrors({ ...fieldErrors, name: 'An application with this name already exists' })
        return
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Determine the primary social URL based on selected platform (for backwards compatibility)
      const primarySocialUrl =
        formData.primary_platform === 'Instagram' ? formData.instagram_url :
        formData.primary_platform === 'TikTok' ? formData.tiktok_url :
        formData.facebook_url || formData.instagram_url || formData.tiktok_url

      // Insert application into influencers table
      const { error: insertError } = await supabase
        .from('influencers')
        .insert({
          user_id: user?.id || null,
          email: formData.email,
          display_name: formData.name,
          slug: slug,
          primary_platform: formData.primary_platform,
          social_profile_url: primarySocialUrl,
          instagram_url: formData.instagram_url || null,
          tiktok_url: formData.tiktok_url || null,
          facebook_url: formData.facebook_url || null,
          total_followers: formData.total_followers,
          bio: formData.program_interest,
          commission_tier: 1,
          is_active: false
        })

      if (insertError) throw insertError

      setSubmitSuccess(true)
      setTimeout(() => {
        onClose()
        setSubmitSuccess(false)
        setIsAutoFilled(false)
        setFormData({
          name: '',
          email: '',
          primary_platform: 'Instagram',
          instagram_url: '',
          tiktok_url: '',
          facebook_url: '',
          total_followers: '',
          program_interest: 'Not sure'
        })
        setFieldErrors({
          name: '',
          email: '',
          instagram_url: '',
          tiktok_url: '',
          facebook_url: '',
          social_urls: '',
          total_followers: ''
        })
      }, 2000)
    } catch (err) {
      console.error('Error submitting application:', err)
      setError('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-5 md:p-6"
      onClick={onClose}
    >
      <div
        className="rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'white' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 pb-3 sm:pb-4 border-b" style={{ borderColor: '#e7e5e4' }}>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold pr-3 sm:pr-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
            Apply to Join Our Partner Program
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            style={{ color: '#78716c' }}
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6">
          {submitSuccess ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold mb-2.5 sm:mb-3" style={{ color: '#151e20' }}>Application Submitted!</h4>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>We'll review your application and send you login credentials via email if approved (typically within 2-3 business days).</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="p-3 sm:p-4 rounded-lg text-sm sm:text-base" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  placeholder="Your display name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (fieldErrors.name) {
                      setFieldErrors({ ...fieldErrors, name: '' })
                    }
                  }}
                  disabled={isAutoFilled}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: fieldErrors.name ? '#dc2626' : '#e7e5e4',
                    color: '#151e20',
                    backgroundColor: isAutoFilled ? '#f5f5f5' : 'white',
                    cursor: isAutoFilled ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => !isAutoFilled && !fieldErrors.name && (e.currentTarget.style.borderColor = '#496B71')}
                  onBlur={(e) => !fieldErrors.name && (e.currentTarget.style.borderColor = '#e7e5e4')}
                />
                {fieldErrors.name ? (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#dc2626' }}>
                    {fieldErrors.name}
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#78716c' }}>
                    {isAutoFilled ? 'Auto-filled from your account' : `${formData.name.length}/25 characters`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  maxLength={100}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: '' })
                    }
                  }}
                  disabled={isAutoFilled}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: fieldErrors.email ? '#dc2626' : '#e7e5e4',
                    color: '#151e20',
                    backgroundColor: isAutoFilled ? '#f5f5f5' : 'white',
                    cursor: isAutoFilled ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => !isAutoFilled && !fieldErrors.email && (e.currentTarget.style.borderColor = '#496B71')}
                  onBlur={(e) => !fieldErrors.email && (e.currentTarget.style.borderColor = '#e7e5e4')}
                />
                {fieldErrors.email ? (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#dc2626' }}>
                    {fieldErrors.email}
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#78716c' }}>
                    {isAutoFilled ? 'Auto-filled from your account' : `${formData.email.length}/100 characters`}
                  </p>
                )}
              </div>

              <CustomSelect
                label="Primary Platform"
                value={formData.primary_platform}
                options={[
                  { value: 'Instagram', label: 'Instagram' },
                  { value: 'TikTok', label: 'TikTok' },
                  { value: 'YouTube', label: 'YouTube' }
                ]}
                onChange={(value) => setFormData({ ...formData, primary_platform: value as 'Instagram' | 'TikTok' | 'YouTube' })}
                required
              />

              {/* Social Media URLs Section */}
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
                  Social Media Links *
                </label>
                <p className="text-[10px] sm:text-xs mb-3" style={{ color: '#78716c' }}>
                  At least one social media link is required
                </p>

                {/* Instagram URL */}
                <div className="mb-3">
                  <label className="block text-[10px] sm:text-xs font-semibold mb-1" style={{ color: '#78716c' }}>
                    Instagram
                  </label>
                  <input
                    type="url"
                    maxLength={200}
                    placeholder="https://instagram.com/yourprofile"
                    value={formData.instagram_url}
                    onChange={(e) => {
                      setFormData({ ...formData, instagram_url: e.target.value })
                      if (fieldErrors.instagram_url || fieldErrors.social_urls) {
                        setFieldErrors({ ...fieldErrors, instagram_url: '', social_urls: '' })
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                    style={{
                      borderColor: fieldErrors.instagram_url ? '#dc2626' : '#e7e5e4',
                      color: '#151e20'
                    }}
                    onFocus={(e) => !fieldErrors.instagram_url && (e.currentTarget.style.borderColor = '#496B71')}
                    onBlur={(e) => !fieldErrors.instagram_url && (e.currentTarget.style.borderColor = '#e7e5e4')}
                  />
                  {fieldErrors.instagram_url && (
                    <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#dc2626' }}>
                      {fieldErrors.instagram_url}
                    </p>
                  )}
                </div>

                {/* TikTok URL */}
                <div className="mb-3">
                  <label className="block text-[10px] sm:text-xs font-semibold mb-1" style={{ color: '#78716c' }}>
                    TikTok
                  </label>
                  <input
                    type="url"
                    maxLength={200}
                    placeholder="https://tiktok.com/@yourprofile"
                    value={formData.tiktok_url}
                    onChange={(e) => {
                      setFormData({ ...formData, tiktok_url: e.target.value })
                      if (fieldErrors.tiktok_url || fieldErrors.social_urls) {
                        setFieldErrors({ ...fieldErrors, tiktok_url: '', social_urls: '' })
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                    style={{
                      borderColor: fieldErrors.tiktok_url ? '#dc2626' : '#e7e5e4',
                      color: '#151e20'
                    }}
                    onFocus={(e) => !fieldErrors.tiktok_url && (e.currentTarget.style.borderColor = '#496B71')}
                    onBlur={(e) => !fieldErrors.tiktok_url && (e.currentTarget.style.borderColor = '#e7e5e4')}
                  />
                  {fieldErrors.tiktok_url && (
                    <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#dc2626' }}>
                      {fieldErrors.tiktok_url}
                    </p>
                  )}
                </div>

                {/* Facebook URL */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold mb-1" style={{ color: '#78716c' }}>
                    Facebook
                  </label>
                  <input
                    type="url"
                    maxLength={200}
                    placeholder="https://facebook.com/yourprofile"
                    value={formData.facebook_url}
                    onChange={(e) => {
                      setFormData({ ...formData, facebook_url: e.target.value })
                      if (fieldErrors.facebook_url || fieldErrors.social_urls) {
                        setFieldErrors({ ...fieldErrors, facebook_url: '', social_urls: '' })
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                    style={{
                      borderColor: fieldErrors.facebook_url ? '#dc2626' : '#e7e5e4',
                      color: '#151e20'
                    }}
                    onFocus={(e) => !fieldErrors.facebook_url && (e.currentTarget.style.borderColor = '#496B71')}
                    onBlur={(e) => !fieldErrors.facebook_url && (e.currentTarget.style.borderColor = '#e7e5e4')}
                  />
                  {fieldErrors.facebook_url && (
                    <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#dc2626' }}>
                      {fieldErrors.facebook_url}
                    </p>
                  )}
                </div>

                {/* General error if no social URLs provided */}
                {fieldErrors.social_urls && (
                  <p className="text-[10px] sm:text-xs mt-2" style={{ color: '#dc2626' }}>
                    {fieldErrors.social_urls}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
                  Total Followers *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  placeholder="e.g., 5000"
                  value={formData.total_followers}
                  onChange={(e) => {
                    setFormData({ ...formData, total_followers: e.target.value })
                    if (fieldErrors.total_followers) {
                      setFieldErrors({ ...fieldErrors, total_followers: '' })
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: fieldErrors.total_followers ? '#dc2626' : '#e7e5e4',
                    color: '#151e20'
                  }}
                  onFocus={(e) => !fieldErrors.total_followers && (e.currentTarget.style.borderColor = '#496B71')}
                  onBlur={(e) => !fieldErrors.total_followers && (e.currentTarget.style.borderColor = '#e7e5e4')}
                />
                {fieldErrors.total_followers && (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: '#dc2626' }}>
                    {fieldErrors.total_followers}
                  </p>
                )}
              </div>

              <CustomSelect
                label="Program Interest"
                value={formData.program_interest}
                options={[
                  { value: 'Affiliate', label: 'Affiliate Programme (10-15% commission)' },
                  { value: 'Brand Ambassador', label: 'Brand Ambassador (20-25% commission)' },
                  { value: 'Not sure', label: 'Not sure - help me decide' }
                ]}
                onChange={(value) => setFormData({ ...formData, program_interest: value as 'Affiliate' | 'Brand Ambassador' | 'Not sure' })}
                required
              />
            </form>
          )}
        </div>

        {/* Fixed Footer */}
        {!submitSuccess && (
          <div className="p-5 sm:p-6 pt-3 sm:pt-4 border-t" style={{ borderColor: '#e7e5e4' }}>
            <div className="flex gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#e7e5e4', color: '#151e20' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#496B71', color: 'white' }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#3a565a')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#496B71'}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-center" style={{ color: '#78716c' }}>
              By submitting this form, you agree to our Terms & Conditions and Privacy Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
