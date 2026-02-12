import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

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
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div>
      <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
        {label} {required && '*'}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
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

        {isOpen && (
          <div
            className="absolute z-10 w-full mt-2 rounded-lg border-2 shadow-lg overflow-hidden"
            style={{ borderColor: '#e7e5e4', backgroundColor: 'white' }}
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
          </div>
        )}
      </div>
    </div>
  )
}

export default function PartnerApplicationForm({ isOpen, onClose }: PartnerApplicationFormProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    primary_platform: 'Instagram' as 'Instagram' | 'TikTok' | 'YouTube',
    social_profile_url: '',
    total_followers: '',
    program_interest: 'Not sure' as 'Affiliate' | 'Brand Ambassador' | 'Not sure'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isInfluencer, setIsInfluencer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingApplication, setHasExistingApplication] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [isOpen])

  const checkAuth = async () => {
    if (!isOpen) return

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)

        // Get user profile to check role and email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, role')
          .eq('id', user.id)
          .single()

        if (!profileError && profile) {
          setFormData(prev => ({ ...prev, email: profile.email }))
          setIsAdmin(profile.role === 'admin' || profile.role === 'super_admin')
          setIsInfluencer(profile.role === 'influencer')
        }

        // Check if user already has an application
        const { data: existingApplication, error: appError } = await supabase
          .from('influencers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!appError && existingApplication) {
          setHasExistingApplication(true)
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (err) {
      console.error('Error checking auth:', err)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to apply')
        return
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Insert application into influencers table
      const { error: insertError } = await supabase
        .from('influencers')
        .insert({
          user_id: user.id,
          display_name: formData.name,
          slug: slug,
          primary_platform: formData.primary_platform,
          social_profile_url: formData.social_profile_url,
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
        setFormData({
          name: '',
          email: '',
          primary_platform: 'Instagram',
          social_profile_url: '',
          total_followers: '',
          program_interest: 'Not sure'
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
          {isLoading ? (
            <div className="flex items-center justify-center py-10 sm:py-12">
              <div className="inline-block size-10 sm:size-12 border-4 border-t-[#496B71] rounded-full animate-spin" style={{ borderColor: '#e7e5e4', borderTopColor: '#496B71' }}></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#496B71' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold mb-2.5 sm:mb-3" style={{ color: '#151e20' }}>Login Required</h4>
              <p className="mb-5 sm:mb-6 text-sm sm:text-base" style={{ color: '#78716c' }}>You need to be logged in to apply for our partner program.</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl cursor-pointer transition-colors"
                style={{ backgroundColor: '#496B71', color: 'white' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a565a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#496B71')}
              >
                Login to Continue
              </button>
            </div>
          ) : isAdmin ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold mb-2.5 sm:mb-3" style={{ color: '#151e20' }}>Admin Access Restricted</h4>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>Admin and super admin accounts cannot apply for the partner program.</p>
            </div>
          ) : isInfluencer ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold mb-2.5 sm:mb-3" style={{ color: '#151e20' }}>Congratulations!</h4>
              <p className="mb-5 sm:mb-6 text-sm sm:text-base" style={{ color: '#78716c' }}>Your application has been approved! You're now a partner and can start earning commissions.</p>
              <button
                onClick={() => {
                  onClose()
                  navigate('/influencer/dashboard')
                }}
                className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl cursor-pointer transition-colors"
                style={{ backgroundColor: '#496B71', color: 'white' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a565a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#496B71')}
              >
                Go to Dashboard
              </button>
            </div>
          ) : hasExistingApplication ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold mb-2.5 sm:mb-3" style={{ color: '#151e20' }}>Application Already Submitted</h4>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>You have already submitted a partner application. We'll review it and get back to you within 2-3 business days.</p>
            </div>
          ) : submitSuccess ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold mb-2.5 sm:mb-3" style={{ color: '#151e20' }}>Application Submitted!</h4>
              <p className="text-sm sm:text-base" style={{ color: '#78716c' }}>We'll review your application and get back to you within 2-3 business days.</p>
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
                  placeholder="Your display name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#496B71'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e7e5e4'}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2"
                  style={{ borderColor: '#e7e5e4', color: '#78716c', backgroundColor: '#f5f5f4' }}
                />
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

              <div>
                <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: '#151e20' }}>
                  Social Profile URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://instagram.com/yourprofile"
                  value={formData.social_profile_url}
                  onChange={(e) => setFormData({ ...formData, social_profile_url: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#496B71'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e7e5e4'}
                />
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
                  onChange={(e) => setFormData({ ...formData, total_followers: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 transition-colors"
                  style={{ borderColor: '#e7e5e4', color: '#151e20' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#496B71'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e7e5e4'}
                />
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
        {!submitSuccess && !isLoading && isAuthenticated && !isAdmin && !isInfluencer && !hasExistingApplication && (
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
