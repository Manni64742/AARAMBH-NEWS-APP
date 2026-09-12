import { client, uploadUrl, getToken } from './client'
import {
  USE_MOCK_DATA,
  mockCategories,
  mockComments,
  mockContentGet,
  mockContentList,
  mockContentRelated,
  mockLiveStreams,
  mockLocationSearch,
  mockReporter,
  mockSearch,
} from '../mock'
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
  list: async (params: Record<string, any>) =>
    USE_MOCK_DATA ? mockContentList(params) : (await client.get<ApiResponse<ContentItem[]>>('/news', { params })).data,
  feed: async (params: Record<string, any>) =>
    USE_MOCK_DATA ? mockContentList(params) : (await client.get<ApiResponse<ContentItem[]>>('/news/feed', { params })).data,
  get: async (identifier: string) =>
    USE_MOCK_DATA
      ? mockContentGet(identifier)
      : (await client.get<ApiResponse<ContentItem>>(`/news/${identifier}`)).data.data,
  create: async (payload: Record<string, any>) =>
    (await client.post<ApiResponse<ContentItem>>('/news', payload)).data.data,
  update: async (id: string, payload: Record<string, any>) =>
    (await client.put<ApiResponse<ContentItem>>(`/news/${id}`, payload)).data.data,
  recordView: async (id: string) =>
    (await client.post<ApiResponse<any>>(`/interactions/${id}/view`)).data,
  related: async (item: ContentItem) => {
    if (USE_MOCK_DATA) return mockContentRelated(item)
    const params: Record<string, any> = { limit: 10, status: 'PUBLISHED' }
    if (item.category?._id) params.category = item.category._id
    return (await client.get<ApiResponse<ContentItem[]>>('/news', { params })).data
  },
}

export const categoryApi = {
  list: async () =>
    USE_MOCK_DATA ? mockCategories('list') : (await client.get<ApiResponse<CategoryItem[]>>('/categories')).data.data,
  tree: async () =>
    USE_MOCK_DATA ? mockCategories('tree') : (await client.get<ApiResponse<CategoryItem[]>>('/categories/tree')).data.data,
}

export const liveStreamApi = {
  list: async () =>
    USE_MOCK_DATA ? mockLiveStreams() : (await client.get<ApiResponse<LiveStreamItem[]>>('/live-streams')).data.data,
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
    USE_MOCK_DATA
      ? mockLocationSearch()
      : (await client.get<ApiResponse<LocationItem[]>>('/locations/search', { params: { q } })).data.data,
}

export const searchApi = {
  all: async (q: string, page = 1, limit = 20) =>
    USE_MOCK_DATA
      ? mockSearch(q, page, limit)
      : (await client.get<ApiResponse<any>>('/search', { params: { q, page, limit } })).data,
}

export const mediaApi = {
  upload: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData()
    form.append('file', file as any)
    const token = await getToken()
    return (
      await client.post<ApiResponse<{ url: string; filename: string; mimetype: string }>>(
        '/media/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: token ? `Bearer ${token}` : '' } }
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
  preferences: async () => (await client.get<ApiResponse<any>>('/notifications/preferences')).data.data,
  updatePreferences: async (patch: Record<string, boolean>) =>
    (await client.put<ApiResponse<any>>('/notifications/preferences', patch)).data.data,
  markRead: async (id: string) => (await client.post<ApiResponse<any>>(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await client.post<ApiResponse<any>>('/notifications/read-all')).data,
}

export const commentApi = {
  list: async (contentId: string) =>
    USE_MOCK_DATA
      ? mockComments(contentId)
      : (await client.get<ApiResponse<CommentItem[]>>(`/comments/${contentId}`)).data.data,
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
  byUser: async (userId: string) =>
    USE_MOCK_DATA
      ? mockReporter(userId)
      : (await client.get<ApiResponse<ReporterPublicProfile>>(`/reporters/by-user/${userId}`)).data.data,
}

export { uploadUrl }
export type { Paged }
