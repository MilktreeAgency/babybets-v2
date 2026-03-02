import { useState } from 'react'

interface CardPaymentProps {
  cardNumber: string
  setCardNumber: (value: string) => void
  expiryDate: string
  setExpiryDate: (value: string) => void
  cvv: string
  setCvv: (value: string) => void
  cardholderName: string
  setCardholderName: (value: string) => void
}

export function CardPayment({
  cardNumber,
  setCardNumber,
  expiryDate,
  setExpiryDate,
  cvv,
  setCvv,
  cardholderName,
  setCardholderName,
}: CardPaymentProps) {
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    return formatted.slice(0, 19) // Max 16 digits + 3 spaces
  }

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  // Format CVV (3-4 digits)
  const formatCVV = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value))
  }

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(formatCVV(e.target.value))
  }

  // Validate card number using Luhn algorithm
  const isCardNumberValid = () => {
    const cleaned = cardNumber.replace(/\s/g, '')
    if (cleaned.length < 13 || cleaned.length > 19) return false

    let sum = 0
    let isEven = false

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10)

      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  // Validate expiry date
  const isExpiryValid = () => {
    if (expiryDate.length !== 5) return false
    const [month, year] = expiryDate.split('/')
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt('20' + year, 10)

    if (monthNum < 1 || monthNum > 12) return false

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (yearNum < currentYear) return false
    if (yearNum === currentYear && monthNum < currentMonth) return false

    return true
  }

  // Validate CVV
  const isCVVValid = () => {
    return cvv.length >= 3 && cvv.length <= 4
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="cardholderName"
          className="block text-sm font-medium mb-2"
          style={{ color: '#44403c' }}
        >
          Cardholder Name
        </label>
        <input
          id="cardholderName"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Smith"
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: '#e7e5e4',
            backgroundColor: 'white',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#496B71'
            e.target.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e7e5e4'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      <div>
        <label
          htmlFor="cardNumber"
          className="block text-sm font-medium mb-2"
          style={{ color: '#44403c' }}
        >
          Card Number
        </label>
        <input
          id="cardNumber"
          type="text"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: cardNumber && !isCardNumberValid() ? '#ef4444' : '#e7e5e4',
            backgroundColor: 'white',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#496B71'
            e.target.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = cardNumber && !isCardNumberValid() ? '#ef4444' : '#e7e5e4'
            e.target.style.boxShadow = 'none'
          }}
        />
        {cardNumber && !isCardNumberValid() && (
          <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
            Invalid card number
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="expiryDate"
            className="block text-sm font-medium mb-2"
            style={{ color: '#44403c' }}
          >
            Expiry Date
          </label>
          <input
            id="expiryDate"
            type="text"
            value={expiryDate}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: expiryDate && !isExpiryValid() ? '#ef4444' : '#e7e5e4',
              backgroundColor: 'white',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#496B71'
              e.target.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = expiryDate && !isExpiryValid() ? '#ef4444' : '#e7e5e4'
              e.target.style.boxShadow = 'none'
            }}
          />
          {expiryDate && !isExpiryValid() && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
              Invalid expiry
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cvv"
            className="block text-sm font-medium mb-2"
            style={{ color: '#44403c' }}
          >
            CVV
          </label>
          <input
            id="cvv"
            type="text"
            value={cvv}
            onChange={handleCVVChange}
            placeholder="123"
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: cvv && !isCVVValid() ? '#ef4444' : '#e7e5e4',
              backgroundColor: 'white',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#496B71'
              e.target.style.boxShadow = '0 0 0 3px rgba(73, 107, 113, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cvv && !isCVVValid() ? '#ef4444' : '#e7e5e4'
              e.target.style.boxShadow = 'none'
            }}
          />
          {cvv && !isCVVValid() && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
              Invalid CVV
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#78716c' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Your card details are encrypted and secure</span>
        </div>
      </div>
    </div>
  )
}

// Export validation helpers
export const validateCardDetails = (
  cardNumber: string,
  expiryDate: string,
  cvv: string,
  cardholderName: string
): boolean => {
  // Validate card number using Luhn algorithm
  const cleaned = cardNumber.replace(/\s/g, '')
  if (cleaned.length < 13 || cleaned.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }

  if (sum % 10 !== 0) return false

  // Validate expiry
  if (expiryDate.length !== 5) return false
  const [month, year] = expiryDate.split('/')
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt('20' + year, 10)

  if (monthNum < 1 || monthNum > 12) return false

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (yearNum < currentYear) return false
  if (yearNum === currentYear && monthNum < currentMonth) return false

  // Validate CVV
  if (cvv.length < 3 || cvv.length > 4) return false

  // Validate cardholder name
  if (!cardholderName.trim()) return false

  return true
}
