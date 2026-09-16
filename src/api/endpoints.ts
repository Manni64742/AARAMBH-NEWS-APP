import { Platform } from 'react-native'
import { client, uploadUrl, getToken } from './client'
import {
  ApiResponse,
  AuthResponse,
  CategoryItem,
  CommentItem,
  ContentItem,
  LocationItem,
  MediaLibraryItem,
  NotificationItem,
  Pagination,
  ReporterProfile,
  User,
  UserPreferences,
  LiveStreamItem,
  ReporterPublicProfile,
  ActiveAdvertisementItem,
} from '../types'

type Paged<T> = { data: T[]; pagination: Pagination }

export const authApi = {
  login: async (identifier: string, password: string) =>
    (await client.post<ApiResponse<AuthResponse>>('/auth/login', { identifier, password })).data,
  register: async (payload: { name: string; identifier: string; password: string; role?: string }) =>
    (await client.post<ApiResponse<AuthResponse>>('/auth/register', payload)).data,
}

export const userApi = {
  profile: async () => (await client.get<ApiResponse<any>>('/users/profile')).data.data,
  updateProfile: async (patch: Partial<User>) =>
    (await client.put<ApiResponse<User>>('/users/profile', patch)).data.data,
  changePassword: async (currentPassword: string, newPassword: string) =>
    (await client.put<ApiResponse<null>>('/users/password', { currentPassword, newPassword })).data,
  preferences: async () => (await client.get<ApiResponse<UserPreferences>>('/users/preferences')).data.data,
  updatePreferences: async (patch: Partial<UserPreferences>) =>
    (await client.put<ApiResponse<UserPreferences>>('/users/preferences', patch)).data.data,
  history: async (page = 1, limit = 20) =>
    (await client.get<ApiResponse<ContentItem[]>>(`/users/history?page=${page}&limit=${limit}`)).data,
  clearHistory: async () => (await client.delete<ApiResponse<null>>('/users/history')).data,
  recordRead: async (contentId: string) =>
    (await client.post<ApiResponse<any>>(`/users/history/${contentId}`)).data,
}

export const contentApi = {
  list: async (params: Record<string, any>) => {
    try {
      return (await client.get<ApiResponse<ContentItem[]>>('/news', { params })).data
    } catch (err) {
      console.warn('Network error in contentApi.list:', err)
      return { success: false, data: [] as ContentItem[], pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } }
    }
  },
  feed: async (params: Record<string, any>) => {
    try {
      return (await client.get<ApiResponse<ContentItem[]>>('/news/feed', { params })).data
    } catch (err) {
      console.warn('Network error in contentApi.feed:', err)
      return { success: false, data: [] as ContentItem[], pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } }
    }
  },
  live: async (params: Record<string, any> = {}) => {
    try {
      return (await client.get<ApiResponse<ContentItem[]>>('/news', { params: { ...params, live: 'true', status: 'PUBLISHED' } })).data
    } catch (err) {
      console.warn('Network error in contentApi.live:', err)
      return { success: false, data: [] as ContentItem[], pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } }
    }
  },
  get: async (identifier: string) => {
    try {
      return (await client.get<ApiResponse<ContentItem>>(`/news/${identifier}`)).data.data
    } catch (err) {
      console.warn('Network error in contentApi.get:', err)
      return null
    }
  },
  homeBundles: async (language?: string) => {
    try {
      return (await client.get<ApiResponse<any>>('/news/home-bundles', { params: { language } })).data.data
    } catch (err) {
      console.warn('Network error in contentApi.homeBundles:', err)
      return null
    }
  },
  homeFeed: async (params?: { language?: string; limit?: number }) => {
    try {
      return (await client.get<ApiResponse<any>>('/news/home-feed', { params })).data.data
    } catch (err) {
      console.warn('Network error in contentApi.homeFeed:', err)
      return null
    }
  },
  groupedLatest: async (params: { category?: string; language?: string; page?: number; limit?: number }) => {
    try {
      return (await client.get<ApiResponse<any>>('/news/grouped-latest', { params })).data.data
    } catch (err) {
      console.warn('Network error in contentApi.groupedLatest:', err)
      return null
    }
  },
  create: async (payload: Record<string, any>) =>
    (await client.post<ApiResponse<ContentItem>>('/news', payload)).data.data,
  update: async (id: string, payload: Record<string, any>) =>
    (await client.put<ApiResponse<ContentItem>>(`/news/${id}`, payload)).data.data,
  recordView: async (id: string) =>
    (await client.post<ApiResponse<any>>(`/interactions/${id}/view`)).data,
  related: async (item: ContentItem) => {
    try {
      const idOrSlug = item._id || (item as any).slug
      if (idOrSlug) {
        const res = await client.get<ApiResponse<ContentItem[]>>(`/news/${idOrSlug}/related?limit=8`)
        if (res.data?.data && Array.isArray(res.data.data)) return res.data
      }
      const params: Record<string, any> = { limit: 8, status: 'PUBLISHED' }
      if (item.category?._id) params.category = item.category._id
      return (await client.get<ApiResponse<ContentItem[]>>('/news', { params })).data
    } catch {
      return { success: false, data: [] as ContentItem[] }
    }
  },
}

export const categoryApi = {
  list: async () => {
    try {
      return (await client.get<ApiResponse<CategoryItem[]>>('/categories')).data.data
    } catch (err) {
      console.warn('Network error in categoryApi.list:', err)
      return [] as CategoryItem[]
    }
  },
  tree: async () => {
    try {
      return (await client.get<ApiResponse<CategoryItem[]>>('/categories/tree')).data.data
    } catch (err) {
      console.warn('Network error in categoryApi.tree:', err)
      return [] as CategoryItem[]
    }
  },
}

export const liveStreamApi = {
  list: async () => {
    try {
      return (await client.get<ApiResponse<LiveStreamItem[]>>('/live-streams')).data.data
    } catch (err) {
      console.warn('Network error in liveStreamApi.list:', err)
      return [] as LiveStreamItem[]
    }
  },
}

export const locationApi = {
  states: async () => (await client.get<ApiResponse<LocationItem[]>>('/locations/states')).data.data,
  districts: async (state: string) =>
    (await client.get<ApiResponse<LocationItem[]>>(`/locations/districts/${state}`)).data.data,
  cities: async (district: string) =>
    (await client.get<ApiResponse<LocationItem[]>>(`/locations/cities/${district}`)).data.data,
  localities: async (city: string) =>
    (await client.get<ApiResponse<LocationItem[]>>(`/locations/localities/${city}`)).data.data,
  search: async (q: string) =>
    (await client.get<ApiResponse<LocationItem[]>>('/locations/search', { params: { q } })).data.data,
}

export const searchApi = {
  all: async (q: string, page = 1, limit = 20) => {
    try {
      return (await client.get<ApiResponse<any>>('/search', { params: { q, page, limit } })).data
    } catch (err) {
      console.warn('Network error in searchApi.all:', err)
      return { success: false, data: [] }
    }
  },
}

export const mediaApi = {
  upload: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData()
    if (Platform.OS === 'web' && file.uri.startsWith('blob:')) {
      const resp = await fetch(file.uri)
      const blob = await resp.blob()
      form.append('file', new File([blob], file.name || 'upload.jpg', { type: file.type || blob.type }))
    } else {
      form.append('file', {
        uri: file.uri,
        name: file.name || 'upload.jpg',
        type: file.type || 'image/jpeg',
      } as any)
    }
    const token = await getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    return (
      await client.post<ApiResponse<{ url: string; filename: string; mimetype: string }>>(
        '/media/upload',
        form,
        { headers }
      )
    ).data.data
  },
  library: async (kind?: 'IMAGE' | 'VIDEO' | 'AUDIO', limit = 50) =>
    (
      await client.get<ApiResponse<MediaLibraryItem[]>>('/media/library', {
        params: kind ? { kind, limit } : { limit },
      })
    ).data.data,
}

export const interactionApi = {
  toggle: async (contentId: string, type: 'LIKE' | 'FAVORITE' | 'BOOKMARK') =>
    (await client.post<ApiResponse<any>>(`/interactions/${contentId}/${type}`)).data,
  status: async (contentId: string) =>
    (await client.get<ApiResponse<any>>(`/interactions/${contentId}/status`)).data.data,
  list: async (type: 'LIKE' | 'FAVORITE' | 'BOOKMARK' | 'VIEW', page = 1, limit = 20) =>
    (await client.get<ApiResponse<ContentItem[]>>(`/interactions/list`, { params: { type, page, limit } })).data,
}

export const followApi = {
  toggle: async (targetType: 'CATEGORY' | 'REPORTER' | 'LOCATION', targetId: string) =>
    (await client.post<ApiResponse<any>>(`/follows/${targetType}/${targetId}`)).data,
  status: async (targetType: 'CATEGORY' | 'REPORTER' | 'LOCATION', targetId: string) =>
    (await client.get<ApiResponse<any>>(`/follows/${targetType}/${targetId}/status`)).data.data,
  list: async () => (await client.get<ApiResponse<any[]>>('/follows/names')).data.data,
}

export const notificationApi = {
  list: async (page = 1, limit = 20) =>
    (await client.get<ApiResponse<NotificationItem[]>>(`/notifications?page=${page}&limit=${limit}`)).data,
  publicList: async (page = 1, limit = 20) =>
    (await client.get<ApiResponse<NotificationItem[]>>(`/notifications/public?page=${page}&limit=${limit}`)).data,
  preferences: async () => (await client.get<ApiResponse<any>>('/notifications/preferences')).data.data,
  updatePreferences: async (patch: Record<string, boolean>) =>
    (await client.put<ApiResponse<any>>('/notifications/preferences', patch)).data.data,
  markRead: async (id: string) => (await client.post<ApiResponse<any>>(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await client.post<ApiResponse<any>>('/notifications/read-all')).data,
}

export const commentApi = {
  list: async (contentId: string) => {
    try {
      return (await client.get<ApiResponse<CommentItem[]>>(`/comments/${contentId}`)).data.data
    } catch (err) {
      console.warn('Network error in commentApi.list:', err)
      return [] as CommentItem[]
    }
  },
  add: async (contentId: string, commentText: string) =>
    (await client.post<ApiResponse<CommentItem>>('/comments', { contentId, commentText })).data.data,
}

export const reporterApi = {
  register: async (payload: Record<string, any>) =>
    (await client.post<ApiResponse<ReporterProfile>>('/reporters/register', payload)).data.data,
  profile: async () => (await client.get<ApiResponse<ReporterProfile>>('/reporters/profile')).data.data,
  stats: async () => (await client.get<ApiResponse<any>>('/reporters/stats')).data.data,
  submissions: async (params: Record<string, any>) =>
    (await client.get<ApiResponse<ContentItem[]>>('/reporters/submissions', { params })).data,
  submitEkyc: async (payload: Record<string, any>) =>
    (await client.post<ApiResponse<ReporterProfile>>('/reporters/ekyc', payload)).data.data,
  card: async () => (await client.get<ApiResponse<ReporterProfile>>('/reporters/card')).data.data,
  byUser: async (userId: string) => {
    try {
      return (await client.get<ApiResponse<ReporterPublicProfile>>(`/reporters/by-user/${userId}`)).data.data
    } catch (err) {
      console.warn('Network error in reporterApi.byUser:', err)
      return null
    }
  },
}

export const advertisementApi = {
  getActive: async (placement?: string, placements?: string[]): Promise<ActiveAdvertisementItem | null> => {
    try {
      const params: Record<string, any> = { _t: Date.now() }
      if (placement) params.placement = placement
      if (placements && placements.length > 0) params.placements = placements.join(',')
      const res = await client.get<ApiResponse<any>>('/advertisements/active', { params })
      return res.data?.data || null
    } catch (err) {
      console.warn('Network error in advertisementApi.getActive:', err)
      return null
    }
  },
  getActiveMap: async (placements: string[]): Promise<Record<string, ActiveAdvertisementItem>> => {
    try {
      const params = { placements: placements.join(','), _t: Date.now() }
      const res = await client.get<ApiResponse<Record<string, ActiveAdvertisementItem>>>('/advertisements/active', { params })
      return res.data?.data || {}
    } catch (err) {
      console.warn('Network error in advertisementApi.getActiveMap:', err)
      return {}
    }
  },
  recordClick: async (id: string) => {
    try {
      await client.post(`/advertisements/${id}/click`)
    } catch (err) {
      // silent
    }
  },
  recordImpression: async (id: string) => {
    try {
      await client.post(`/advertisements/${id}/impression`)
    } catch (err) {
      // silent
    }
  },
}

export { uploadUrl }
export type { Paged }

