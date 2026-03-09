import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

interface TermsCheckboxesProps {
  agreeTerms: boolean
  setAgreeTerms: (agree: boolean) => void
  isUKResident: boolean
  setIsUKResident: (resident: boolean) => void
  isOver18: boolean
  setIsOver18: (over18: boolean) => void
  canProceed: boolean
  isMobileValid: boolean
  mobileNumber: string
}

const TermsCheckboxes = ({
  agreeTerms,
  setAgreeTerms,
  isUKResident,
  setIsUKResident,
  isOver18,
  setIsOver18,
  canProceed,
  isMobileValid,
  mobileNumber,
}: TermsCheckboxesProps) => {
  return (
    <div
      className="rounded-xl p-6 mb-6 space-y-4"
      style={{ backgroundColor: '#f5f5f4', borderWidth: '1px', borderColor: '#e7e5e4' }}
    >
      <div className="mb-2">
        <span className="font-bold" style={{ color: '#151e20' }}>
          Entry Requirements
        </span>
      </div>

      {/* Terms and Conditions Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
            style={{
              backgroundColor: agreeTerms ? '#496B71' : 'white',
              borderColor: agreeTerms ? '#496B71' : '#d1d5db',
            }}
          >
            {agreeTerms && <Check size={14} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
          I agree to the{' '}
          <Link to="/terms-of-use" className="font-medium hover:underline cursor-pointer" style={{ color: '#496B71' }} target="_blank">
            Terms of Use
          </Link>
          {' '}and{' '}
          <Link to="/Prize-Competition-Terms-and-Conditions" className="font-medium hover:underline cursor-pointer" style={{ color: '#496B71' }} target="_blank">
            Prize Competition Terms and Conditions
          </Link>
        </span>
      </label>

      {/* UK Resident Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={isUKResident}
            onChange={(e) => setIsUKResident(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
            style={{
              backgroundColor: isUKResident ? '#496B71' : 'white',
              borderColor: isUKResident ? '#496B71' : '#d1d5db',
            }}
          >
            {isUKResident && <Check size={14} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
          I confirm I am a <strong>UK resident</strong>
        </span>
      </label>

      {/* Over 18 Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={isOver18}
            onChange={(e) => setIsOver18(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
            style={{
              backgroundColor: isOver18 ? '#496B71' : 'white',
              borderColor: isOver18 ? '#496B71' : '#d1d5db',
            }}
          >
            {isOver18 && <Check size={14} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        <span className="text-sm leading-relaxed" style={{ color: '#151e20' }}>
          I confirm I am <strong>over 18 years of age</strong>
        </span>
      </label>

      {!canProceed && (
        <p className="text-xs pt-2" style={{ color: '#78716c' }}>
          {!isMobileValid && mobileNumber
            ? 'Please enter a valid UK mobile number and confirm all requirements above'
            : !isMobileValid
            ? 'Please enter a mobile number and confirm all requirements above'
            : 'Please confirm all boxes above to complete your purchase'}
        </p>
      )}
    </div>
  )
}

export default TermsCheckboxes
