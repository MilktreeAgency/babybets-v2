import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { validateCartItems } from '@/lib/cartValidation'

export interface CartItem {
  competitionId: string
  competitionTitle: string
  competitionSlug: string
  imageUrl: string
  quantity: number
  pricePerTicket: number
  totalPrice: number
}

interface CartStore {
  items: CartItem[]
  isCartOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (competitionId: string) => void
  updateQuantity: (competitionId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  setCartOpen: (open: boolean) => void
  validateCart: () => Promise<{ removedCount: number; reasons: string[] }>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      setCartOpen: (open) => {
        set({ isCartOpen: open })
      },

      addItem: (item) => {
        // Validate item has valid prices before adding to cart
        if (!item.pricePerTicket || item.pricePerTicket <= 0) {
          console.error('Cannot add item with invalid pricePerTicket:', item)
          throw new Error('Invalid price per ticket')
        }
        if (!item.totalPrice || item.totalPrice <= 0) {
          console.error('Cannot add item with invalid totalPrice:', item)
          throw new Error('Invalid total price')
        }
        if (!item.quantity || item.quantity <= 0) {
          console.error('Cannot add item with invalid quantity:', item)
          throw new Error('Invalid quantity')
        }

        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.competitionId === item.competitionId
          )

          if (existingItemIndex > -1) {
            // Update existing item
            const newItems = [...state.items]
            newItems[existingItemIndex] = item
            return { items: newItems }
          }

          // Add new item
          return { items: [...state.items, item] }
        })
      },

      removeItem: (competitionId) => {
        set((state) => ({
          items: state.items.filter((item) => item.competitionId !== competitionId),
        }))
      },

      updateQuantity: (competitionId, quantity) => {
        if (quantity <= 0) {
          console.error('Cannot update to invalid quantity:', quantity)
          return
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.competitionId === competitionId) {
              const newTotalPrice = item.pricePerTicket * quantity

              // Validate the new total price
              if (!newTotalPrice || newTotalPrice <= 0) {
                console.error('Invalid total price after quantity update:', { item, quantity, newTotalPrice })
                return item // Return unchanged item if price would be invalid
              }

              return { ...item, quantity, totalPrice: newTotalPrice }
            }
            return item
          }),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0)
      },

      validateCart: async () => {
        const currentItems = get().items

        if (currentItems.length === 0) {
          return { removedCount: 0, reasons: [] }
        }

        const { validItems, removedItems } = await validateCartItems(currentItems)

        // Update cart with only valid items
        if (removedItems.length > 0) {
          set({ items: validItems })

          // Return info about removed items
          return {
            removedCount: removedItems.length,
            reasons: removedItems.map((removed) =>
              `${removed.item.competitionTitle}: ${removed.reason}`
            ),
          }
        }

        // If prices changed but items are still valid, update with new data
        if (JSON.stringify(validItems) !== JSON.stringify(currentItems)) {
          set({ items: validItems })
        }

        return { removedCount: 0, reasons: [] }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
