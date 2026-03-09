interface ContactInformationProps {
  mobileNumber: string
  setMobileNumber: (number: string) => void
  isMobileValid: boolean
}

const ContactInformation = ({
  mobileNumber,
  setMobileNumber,
  isMobileValid,
}: ContactInformationProps) => {
  return (
    <div className="mb-6">
      <h3
        className="text-lg font-bold mb-4"
        style={{ color: '#151e20', fontFamily: "'Fraunces', serif" }}
      >
        Contact & Delivery
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#151e20' }}>
          Mobile Number <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="tel"
          value={mobileNumber}
          onChange={(e) => {
            // Allow only numbers and spaces
            const value = e.target.value.replace(/[^\d\s]/g, '')
            setMobileNumber(value)
          }}
          placeholder="07xxx xxxxxx"
          autoComplete="tel"
          className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:outline-none"
          style={{
            backgroundColor: '#f5f5f4',
            borderWidth: '1px',
            borderColor: mobileNumber && !isMobileValid ? '#ef4444' : '#e7e5e4',
            color: '#151e20',
          }}
        />
        {mobileNumber && !isMobileValid ? (
          <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
            Please enter a valid UK mobile number (e.g., 07xxx xxxxxx)
          </p>
        ) : (
          <p className="text-xs mt-1.5" style={{ color: '#78716c' }}>
            Required for winner contact and delivery coordination
          </p>
        )}
      </div>
    </div>
  )
}

export default ContactInformation
