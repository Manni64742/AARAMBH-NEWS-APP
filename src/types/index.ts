export type UserRole = 'USER' | 'REPORTER' | 'ADMIN' | 'SUPER_ADMIN'
export type ContentType = 'ARTICLE' | 'SHORT_NEWS' | 'VIDEO' | 'SHORT_VIDEO' | 'AUDIO' | 'POLL' | 'LIVE_BLOG' | 'FACT_CHECK'
export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SCHEDULED' | 'REJECTED' | 'ARCHIVED'
export type ArticleBlockType = 'TEXT' | 'IMAGE' | 'GALLERY' | 'VIDEO' | 'AUDIO' | 'YOUTUBE' | 'ADVERTISEMENT' | 'QUOTE' | 'HEADING' | 'DIVIDER' | 'EMBED' | 'RELATED_STORY'

export interface GalleryImage {
  id: string
  url: string
  caption?: string
  alt?: string
  credit?: string
}

export interface ArticleBlock {
  id: string
  type: ArticleBlockType
  html?: string
  text?: string
  url?: string
  title?: string
  caption?: string
  alt?: string
  credit?: string
  level?: 'h2' | 'h3'
  embedUrl?: string
  relatedContentId?: string
  relatedTitle?: string
  adSlot?: string
  items?: GalleryImage[]
}

export interface User {
  _id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  role: UserRole
  isVerified?: boolean
  preferredLanguages?: string[]
  location?: any
}

export interface CategoryItem {
  _id: string
  name: { en: string; hi: string }
  slug: string
  level?: string
  parentId?: string
  displayOrder?: number
  isActive?: boolean
  isFeatured?: boolean
  subCategories?: CategoryItem[]
}

export interface MediaLibraryItem {
  _id: string
  originalName: string
  filename: string
  url: string
  mimetype: string
  kind: 'IMAGE' | 'VIDEO' | 'AUDIO'
  size: number
  createdAt: string
}

export interface LocationItem {
  _id: string
  name: { en: string; hi: string }
  type: string
  slug: string
  parentId?: string
  hierarchy?: any
  isActive?: boolean
}

export type PriorityLevel = 'NORMAL' | 'HIGH' | 'CRITICAL'
export type EditorialTone = 'NEWS' | 'OPINION' | 'ANALYSIS' | 'INTERVIEW' | 'EXPLAINER' | 'REPORT' | 'PRESS_RELEASE'
export type SponsorType = 'NONE' | 'SPONSORED' | 'PARTNER' | 'ADVERTISEMENT'

export interface EditorialFlags {
  isBreaking?: boolean
  breakingPriority?: number
  breakingExpiresAt?: string
  isFeatured?: boolean
  priority?: PriorityLevel
  isLiveCoverage?: boolean
  isDeveloping?: boolean
  isExclusive?: boolean
  editorialTone?: EditorialTone
  isSponsored?: boolean
  sponsorType?: SponsorType
  sponsorName?: string
  isPressRelease?: boolean
  isUpdated?: boolean
  isCorrection?: boolean
  correctionNote?: string
  showOnHome?: boolean
  isEditorPick?: boolean
  sendPushNotification?: boolean
  [key: string]: any
}

export interface ContentItem {
  _id: string
  title: string
  slug: string
  summary?: string
  content?: string
  bodyBlocks?: ArticleBlock[]
  contentType: ContentType
  status: ContentStatus
  author?: { _id: string; name: string; avatar?: string }
  category?: CategoryItem
  subCategory?: CategoryItem
  tags?: string[]
  language?: string
  location?: { primary?: any; scope?: string }
  featuredImage?: { url: string; caption?: string; alt?: string; credit?: string }
  flags?: EditorialFlags
  metrics?: { views?: number; uniqueViewers?: number; likes?: number; shares?: number; comments?: number }
  viewsCount?: number
  likesCount?: number
  trendingScore?: number
  publishedAt?: string
  scheduledFor?: string
  createdAt: string
  updatedAt?: string
  videoPayload?: { videoUrl: string; thumbnail?: string; duration?: number }
  shortVideoPayload?: { videoUrl: string; thumbnail?: string; duration?: number }
  youtubeUrl?: string
  youtubeId?: string
  imageCaption?: string
  imageCredit?: string
}

export interface CommentItem {
  _id: string
  contentId: string
  userId: { _id: string; name: string; avatar?: string }
  commentText: string
  status: string
  createdAt: string
}

export interface ReporterProfile {
  _id: string
  userId: User
  reporterId: string
  badge: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  idProofType?: string
  idProofNumber?: string
  idProofDocumentUrl?: string
  kycStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'
  kycRequired?: boolean
  profilePhotoUrl?: string
  assignedLocations?: LocationItem[]
  assignedCategories?: CategoryItem[]
  isAutoPublishAllowed: boolean
  rejectionReason?: string
  stats?: Record<string, number>
}

export interface NotificationItem {
  _id: string
  type: string
  title: string
  body?: string
  contentId?: string
  read: boolean
  createdAt: string
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  unread?: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  statusCode: number
  data: T
  pagination?: Pagination
}

export interface AuthResponse {
  user: User
  tokens: { accessToken: string; refreshToken: string; expiresIn?: string }
}

export interface UserPreferences {
  languages: string[]
  interests: string[]
  notifications: {
    breaking: boolean
    localNews: boolean
    followedCategory: boolean
    followedReporter: boolean
    followedLocation: boolean
    trending: boolean
  }
}

export interface LocationState {
  country?: string
  state?: string
  district?: string
  city?: string
  locality?: string
  label?: string
  multiCity?: string[]
  cities?: string[]
}

export interface LiveStreamItem {
  _id: string
  title: { en: string; hi?: string }
  description?: { en?: string; hi?: string }
  youtubeUrl: string
  youtubeId: string
  thumbnailUrl?: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED'
  isActive?: boolean
  displayOrder?: number
  scheduledFor?: string
  createdAt?: string
}

export interface ReporterPublicProfile {
  reporterId: string
  name: string
  photo: string
  designation: string
  badge: string
}

export interface MarketIndexItem {
  _id: string
  symbol: string
  name: string
  value: number
  change: number
  changePct: number
  isLive?: boolean
}
