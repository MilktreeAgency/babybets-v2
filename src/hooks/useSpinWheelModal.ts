import { useState, useEffect } from 'react'

interface UseSpinWheelModalReturn {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const STORAGE_KEY = 'babybets_wheel_shown'
const DELAY_MS = 5000 // Show after 5 seconds

export function useSpinWheelModal(): UseSpinWheelModalReturn {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if wheel has been shown before
    const hasSeenWheel = localStorage.getItem(STORAGE_KEY)

    if (hasSeenWheel) {
      return
    }

    // Show the wheel after a delay
    const timer = setTimeout(() => {
      setIsOpen(true)
      localStorage.setItem(STORAGE_KEY, 'true')
    }, DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  const openModal = () => setIsOpen(true)

  const closeModal = () => setIsOpen(false)

  return {
    isOpen,
    openModal,
    closeModal,
  }
}
