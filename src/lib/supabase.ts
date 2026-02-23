import { createClient } from '@supabase/supabase-js'
import type { CustomDatabase } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<CustomDatabase>(supabaseUrl, supabaseAnonKey)

/**
 * Storage helpers
 */
export const uploadImage = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    return { url: null, error }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return { url: publicUrl, error: null }
}

export const deleteImage = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}
