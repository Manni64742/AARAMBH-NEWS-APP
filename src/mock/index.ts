import { ApiResponse, CategoryItem, CommentItem, ContentItem, LiveStreamItem, LocationItem, Pagination, ReporterPublicProfile } from '../types'
import { MOCK_CATEGORIES, MOCK_COMMENTS, MOCK_LIVE_STREAMS, MOCK_NEWS, MOCK_REPORTERS } from './mockData'

/**
 * DEMO MODE — backend is not connected yet.
 * Set to `false` (and delete the guards in src/api/endpoints.ts) to restore the
 * real REST API responses.
 */
export const USE_MOCK_DATA = false

const ok = <T>(data: T, pagination?: Pagination): ApiResponse<T> =>
  pagination
    ? { success: true, message: 'Success', statusCode: 200, data, pagination }
    : { success: true, message: 'Success', statusCode: 200, data }

function paginated(list: ContentItem[], page = 1, limit = 20): ApiResponse<ContentItem[]> {
  const safe = Math.max(1, Number(limit) || 20)
  const start = (Math.max(1, Number(page) || 1) - 1) * safe
  return ok(list.slice(start, start + safe), {
    total: list.length,
    page: Math.max(1, Number(page) || 1),
    limit: safe,
    totalPages: Math.max(1, Math.ceil(list.length / safe)),
    hasNextPage: start + safe < list.length,
    hasPrevPage: page > 1,
  })
}

const noLocation = (params: Record<string, any>) =>
  !params.state && !params.district && !params.city && !params.locality

export function filterMockNews(params: Record<string, any>): ContentItem[] {
  let list = [...MOCK_NEWS]

  if (params.status && params.status !== 'PUBLISHED' && params.status !== 'ALL') {
    list = list.filter((i) => i.status === params.status)
  }
  if (params.contentType === 'VIDEO') {
    list = list.filter(
      (i) =>
        i.contentType === 'VIDEO' ||
        !!(i.youtubeId || i.youtubeUrl || i.videoPayload?.videoUrl || i.bodyBlocks?.some((b: any) => b.type === 'YOUTUBE' || b.type === 'VIDEO'))
    )
  } else if (params.contentType === 'SHORT_VIDEO') {
    list = list.filter(
      (i) =>
        i.contentType === 'SHORT_VIDEO' &&
        !!(i.shortVideoPayload?.videoUrl || i.videoPayload?.videoUrl)
    )
  }
  if (params.breaking === 'true') list = list.filter((i) => i.flags?.isBreaking)
  if (params.featured === 'true') list = list.filter((i) => i.flags?.isFeatured)
  if (params.category) {
    const c = params.category
    const isMarketQuery =
      c === 'cat-market' || c === 'market' || c === 'share-market' || c === 'finance'
    list = list.filter((i) => {
      if (isMarketQuery) {
        return (
          i.category?._id === 'cat-market' ||
          i.category?.slug === 'market' ||
          i.category?.slug === 'share-market' ||
          i.category?.slug === 'finance'
        )
      }
      return i.category?._id === c || i.category?.slug === c
    })
  }
  if (params.subCategory) {
    list = list.filter((i) => i.subCategory?._id === params.subCategory || i.subCategory?.slug === params.subCategory)
  }
  if (!params.category && !noLocation(params)) {
    const eq = (a?: string, b?: string) => !!b && !!a && a.toLowerCase() === String(b).toLowerCase()
    const locationFiltered = list.filter((i) => {
      const p = i.location?.primary || {}
      if (params.state && !eq(p.state, params.state)) return false
      if (params.district && !eq(p.district, params.district)) return false
      if (params.city && !eq(p.city, params.city)) return false
      if (params.locality && !eq(p.locality, params.locality)) return false
      return true
    })
    // Demo mode: never return an empty feed just because the device location
    // doesn't match the sample articles — fall back to the full list.
    if (locationFiltered.length > 0) list = locationFiltered
  }
  if (params.search) {
    const q = String(params.search).toLowerCase()
    list = list.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.summary || '').toLowerCase().includes(q) ||
      (i.tags || []).some((t) => t.toLowerCase().includes(q))
    )
  }
  if (params.sort === 'trending') list.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
  else if (params.sort === 'views') list.sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))
  else list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())

  if (params.language) {
    const lang = String(params.language).toLowerCase()
    const langFiltered = list.filter((i) => {
      const itemLang = (i.language || 'hi').toLowerCase()
      if (lang === 'hi') {
        return itemLang === 'hi' || itemLang === 'hi-en' || itemLang === 'hinglish'
      }
      if (lang === 'en') {
        return itemLang === 'en' || itemLang === 'hi-en'
      }
      return itemLang === lang
    })
    if (langFiltered.length > 0) list = langFiltered
  }

  if (params.excludeNewsId) list = list.filter((i) => i._id !== params.excludeNewsId)
  return list
}

export function mockContentList(params: Record<string, any> = {}) {
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 20
  const body = filterMockNews({ ...params, limit: 99999, page: 1 })
  return paginated(body, page, limit)
}

export function mockContentGet(identifier: string): ContentItem {
  const item = MOCK_NEWS.find((i) => i._id === identifier || i.slug === identifier)
  if (!item) {
    const error: any = new Error('Content not found')
    error.response = { data: { message: 'Content not found' } }
    throw error
  }
  return item
}

export function mockContentRelated(item: ContentItem): ApiResponse<ContentItem[]> {
  const sameCategory = MOCK_NEWS.filter((i) => i._id !== item._id && i.category?._id === item.category?._id)
  const byTags = MOCK_NEWS.filter((i) =>
    i._id !== item._id &&
    i.category?._id !== item.category?._id &&
    (i.tags || []).some((t) => (item.tags || []).includes(t))
  )
  const rest = MOCK_NEWS.filter((i) => i._id !== item._id && !sameCategory.includes(i) && !byTags.includes(i))
  const data = [...sameCategory, ...byTags, ...rest].slice(0, 10)
  return ok(data, { total: data.length, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false })
}

export function mockCategories(kind: 'list' | 'tree'): CategoryItem[] {
  if (kind === 'tree') {
    return MOCK_CATEGORIES.map((c) => ({
      ...c,
      subCategories: c.subCategories?.filter((s) => s.isActive !== false) || [],
    }))
  }
  return MOCK_CATEGORIES.filter((c) => c.isActive !== false)
}

export function mockLiveStreams(): LiveStreamItem[] {
  return MOCK_LIVE_STREAMS.filter((s) => s.isActive !== false)
}

export function mockLocationSearch(): LocationItem[] {
  return []
}

export function mockComments(contentId: string): CommentItem[] {
  return MOCK_COMMENTS.filter((c) => c.contentId === contentId)
}

export function mockReporter(userId: string): ReporterPublicProfile {
  const profile = MOCK_REPORTERS.find((r) => r.reporterId === userId)
  if (!profile) {
    const error: any = new Error('Reporter not found')
    error.response = { data: { message: 'Reporter not found' } }
    throw error
  }
  return profile
}

export function mockSearch(q: string, page = 1, limit = 20): ApiResponse<any> {
  const hits = filterMockNews({ search: q, limit: 99999, page: 1 })
  const start = (Math.max(1, Number(page) || 1) - 1) * (Number(limit) || 20)
  const data = hits.slice(start, start + (Number(limit) || 20))
  const results = data.map((i) => ({ _id: i._id, title: i.title, slug: i.slug, summary: i.summary, type: 'CONTENT', contentItemId: i._id }))
  return ok(results, {
    total: hits.length,
    page: Math.max(1, Number(page) || 1),
    limit: Number(limit) || 20,
    totalPages: Math.max(1, Math.ceil(hits.length / (Number(limit) || 20))),
    hasNextPage: start + (Number(limit) || 20) < hits.length,
    hasPrevPage: page > 1,
  })
}