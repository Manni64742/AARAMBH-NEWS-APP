import { NavigatorScreenParams } from '@react-navigation/native'
import { ContentItem } from '../types'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

export type MainTabParamList = {
  Home: undefined
  Latest: undefined
  Search: undefined
  Videos: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  Login: undefined
  Register: undefined
  Main: NavigatorScreenParams<MainTabParamList>
  LanguageSelect: undefined
  Onboarding: undefined
  Saved: undefined
  NewsDetail: { item: ContentItem }
  NewsDetailById: { id: string }
  CategoryNews: { categoryId: string; subCategoryId?: string; title: string }
  CategoryNewsList: { title: string; sectionTitle?: string; items: any[] }
  Search: undefined
  Bookmarks: undefined
  Favorites: undefined
  Notifications: undefined
  History: undefined
  Settings: undefined
  LanguageSettings: undefined
  LocationPicker: undefined
  AudioPlayer: undefined
  Categories: undefined
  Locations: undefined
  LiveNews: undefined
  ReporterDashboard: undefined
  SubmitNews: { contentType?: string; item?: ContentItem } | undefined
  MySubmissions: undefined
  ReporterProfileScreen: undefined
  Ekyc: undefined
  ReporterCard: undefined
}
