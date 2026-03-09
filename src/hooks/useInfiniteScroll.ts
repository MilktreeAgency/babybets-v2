import { useState, useEffect, useCallback, useRef } from 'react'
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'

interface UseInfiniteScrollOptions<T extends Record<string, unknown>, R = T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryBuilder: () => PostgrestFilterBuilder<any, any, any, unknown>
  pageSize?: number
  dependencies?: unknown[]
  transform?: (items: T[]) => Promise<R[]>
}

interface UseInfiniteScrollReturn<R> {
  data: R[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  observerRef: (node: HTMLElement | null) => void
}

export function useInfiniteScroll<T extends Record<string, unknown>, R = T>({
  queryBuilder,
  pageSize = 20,
  dependencies = [],
  transform,
}: UseInfiniteScrollOptions<T, R>): UseInfiniteScrollReturn<R> {
  const [data, setData] = useState<R[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef(false)

  // Initial load and refresh when dependencies change
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setPage(0)
      setData([])
      setHasMore(true)

      const query = queryBuilder()
      const { data: newData, error } = await query
        .range(0, pageSize - 1)

      if (error) throw error

      const items = (newData || []) as T[]
      const transformedItems = transform ? await transform(items) : (items as unknown as R[])
      setData(transformedItems)
      setHasMore(items.length === pageSize)
    } catch (error) {
      console.error('Error loading initial data:', error)
      setData([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [queryBuilder, pageSize, transform, ...dependencies])

  // Load more data when scrolling
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return

    try {
      loadingRef.current = true
      setLoadingMore(true)

      const nextPage = page + 1
      const start = nextPage * pageSize
      const end = start + pageSize - 1

      const query = queryBuilder()
      const { data: newData, error } = await query
        .range(start, end)

      if (error) throw error

      const items = (newData || []) as T[]
      const transformedItems = transform ? await transform(items) : (items as unknown as R[])
      setData((prev) => [...prev, ...transformedItems])
      setPage(nextPage)
      setHasMore(items.length === pageSize)
    } catch (error) {
      console.error('Error loading more data:', error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
      loadingRef.current = false
    }
  }, [queryBuilder, page, pageSize, hasMore, transform, ...dependencies])

  // Refresh data (reset and reload)
  const refresh = useCallback(async () => {
    await loadInitialData()
  }, [loadInitialData])

  // Set up intersection observer for infinite scroll
  const observerCallback = useCallback((node: HTMLElement | null) => {
    if (loading || loadingMore) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        loadMore()
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
    })

    if (node) {
      observerRef.current.observe(node)
    }
  }, [loading, loadingMore, hasMore, loadMore])

  // Initial load
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    observerRef: observerCallback,
  }
}
