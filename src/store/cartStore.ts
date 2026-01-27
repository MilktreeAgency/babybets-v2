import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
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
        set((state) => ({
          items: state.items.map((item) =>
            item.competitionId === competitionId
              ? { ...item, quantity, totalPrice: item.pricePerTicket * quantity }
              : item
          ),
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
    }),
    {
      name: 'cart-storage',
    }
  )
)
