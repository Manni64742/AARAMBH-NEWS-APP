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
  Onboarding: undefined
  Saved: undefined
  NewsDetail: { item: ContentItem }
  NewsDetailById: { id: string }
  CategoryNews: { categoryId: string; subCategoryId?: string; title: string }
  Search: undefined
  Bookmarks: undefined
  Favorites: undefined
  Notifications: undefined
  History: undefined
  Settings: undefined
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
