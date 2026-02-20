import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  googleId: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  signOut: () => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  signOut: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),
  setInitialized: (initialized) =>
    set({
      isInitialized: initialized,
    }),
}))
