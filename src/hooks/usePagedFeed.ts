import { useCallback, useEffect, useRef, useState } from 'react'
import { Pagination } from '../types'
import { errorMessage } from '../api/client'

interface Options<T> {
  load: (page: number) => Promise<{ data: T[]; pagination?: Pagination }>
  initialPage?: number
}

export function usePagedFeed<T = any>({ load, initialPage = 1 }: Options<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const pageRef = useRef(initialPage)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const apply = useCallback((res: { data: T[]; pagination?: Pagination }, append: boolean) => {
    setItems((prev) => (append ? [...prev, ...res.data] : res.data))
    setPagination(res.pagination || null)
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const res = await load(1)
      pageRef.current = 1
      apply(res, false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [load, apply])

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNextPage || loadingMore || loading || refreshing) return
    setLoadingMore(true)
    try {
      const next = pageRef.current + 1
      const res = await load(next)
      pageRef.current = next
      apply(res, true)
    } catch {
      // silent on pagination failure
    } finally {
      setLoadingMore(false)
    }
  }, [pagination, loadingMore, loading, refreshing, load, apply])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { items, loading, refreshing, loadingMore, error, pagination, refresh, loadMore, setLoading }
}
