import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Competition, Database } from '@/types'

interface UseCompetitionsOptions {
  category?: string
  featured?: boolean
  limit?: number
  showOnHomepage?: boolean
}

interface UseCompetitionsReturn {
  competitions: Competition[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCompetitions(options: UseCompetitionsOptions = {}): UseCompetitionsReturn {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCompetitions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('competitions')
        .select('*')
        .eq('status', 'active' as Database['public']['Enums']['competition_status'])
        .order('is_featured', { ascending: false })
        .order('end_datetime', { ascending: true })

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category as Database['public']['Enums']['competition_category'])
      }

      if (options.featured !== undefined) {
        query = query.eq('is_featured', options.featured)
      }

      if (options.showOnHomepage !== undefined) {
        query = query.eq('show_on_homepage', options.showOnHomepage)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setCompetitions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch competitions'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompetitions()
  }, [options.category, options.featured, options.limit, options.showOnHomepage])

  return {
    competitions,
    isLoading,
    error,
    refetch: fetchCompetitions
  }
}

interface UseCompetitionReturn {
  competition: Competition | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCompetition(slug: string): UseCompetitionReturn {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCompetition = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('competitions')
        .select('*')
        .eq('slug', slug)
        .single()

      if (fetchError) throw fetchError

      setCompetition(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch competition'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (slug) {
      fetchCompetition()
    }
  }, [slug])

  return {
    competition,
    isLoading,
    error,
    refetch: fetchCompetition
  }
}
