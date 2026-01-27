import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export interface UpdateProfileInput {
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  address_line1?: string
  address_line2?: string
  city?: string
  county?: string
  postcode?: string
  country?: string
  marketing_email?: boolean
  marketing_sms?: boolean
}

export type { Profile }

class ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      throw error
    }

    return data
  }

  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return data
  }

  async updateAddress(userId: string, address: {
    address_line1: string
    address_line2?: string
    city: string
    county?: string
    postcode: string
    country: string
  }): Promise<Profile> {
    return this.updateProfile(userId, address)
  }
}

export const profileService = new ProfileService()
