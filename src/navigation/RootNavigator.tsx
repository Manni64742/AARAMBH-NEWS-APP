import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackHeaderProps } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { colors, fonts } from '../theme'
import { MainTabParamList, RootStackParamList } from './types'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { AarambhLoader } from '../components/AarambhLoader'
import { AarambhSplashScreen } from '../components/AarambhSplashScreen'
import { AppBackButton } from '../components/AppBackButton'
import { ErrorBoundary } from '../components/ErrorBoundary'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/HomeScreen'
import FeedScreen from '../screens/FeedScreen'
import VideosScreen from '../screens/VideosScreen'
import SavedScreen from '../screens/SavedScreen'
import ProfileScreen from '../screens/ProfileScreen'
import NewsDetailScreen from '../screens/NewsDetailScreen'
import CategoryNewsScreen from '../screens/CategoryNewsScreen'
import CategoryNewsListScreen from '../screens/CategoryNewsListScreen'
import SearchScreen from '../screens/SearchScreen'
import BookmarksScreen from '../screens/BookmarksScreen'
import FavoritesScreen from '../screens/FavoritesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import HistoryScreen from '../screens/HistoryScreen'
import SettingsScreen from '../screens/SettingsScreen'
import LocationPickerScreen from '../screens/LocationPickerScreen'
import AudioPlayerScreen from '../screens/AudioPlayerScreen'
import CategoriesScreen from '../screens/CategoriesScreen'
import LocationsScreen from '../screens/LocationsScreen'
import LiveNewsScreen from '../screens/LiveNewsScreen'
import ReporterDashboardScreen from '../screens/reporter/ReporterDashboardScreen'
import SubmitNewsScreen from '../screens/reporter/SubmitNewsScreen'
import MySubmissionsScreen from '../screens/reporter/MySubmissionsScreen'
import ReporterProfileScreen from '../screens/reporter/ReporterProfileScreen'
import EkycScreen from '../screens/reporter/EkycScreen'
import ReporterCardScreen from '../screens/reporter/ReporterCardScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import LanguageSelectScreen from '../screens/LanguageSelectScreen'
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen'
import { useLanguage } from '../context/LanguageContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { withReporterGate } from '../components/reporter/ReporterGate'
import * as Notifications from 'expo-notifications'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export function navigateToNewsDetail(contentId: string) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate('NewsDetailById', { id: contentId })
  }
}

const GatedDashboard = withReporterGate(ReporterDashboardScreen)
const GatedSubmitNews = withReporterGate(SubmitNewsScreen)
const GatedMySubmissions = withReporterGate(MySubmissionsScreen)
const GatedReporterProfile = withReporterGate(ReporterProfileScreen)
const GatedEkyc = withReporterGate(EkycScreen)
const GatedReporterCard = withReporterGate(ReporterCardScreen)

const tabIcons: Record<string, any> = {
  Home: 'home-outline',
  HomeActive: 'home',
  Latest: 'newspaper-outline',
  LatestActive: 'newspaper',
  Search: 'search-outline',
  SearchActive: 'search',
  Videos: 'play-circle-outline',
  VideosActive: 'play-circle',
  Profile: 'person-outline',
  ProfileActive: 'person',
}

const tabLabels: Record<string, { hi: string; en: string }> = {
  Home: { hi: 'होम', en: 'Home' },
  Latest: { hi: 'लेटेस्ट', en: 'Latest' },
  Search: { hi: 'खोजें', en: 'Search' },
  Videos: { hi: 'वीडियो', en: 'Videos' },
  Profile: { hi: 'प्रोफ़ाइल', en: 'Profile' },
}

function MainTabs() {
  const { colors } = useTheme()
  const { language } = useLanguage()
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, 18)

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabel: tabLabels[route.name]?.[language === 'hi' ? 'hi' : 'en'] || route.name,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.surfaceVariant,
          borderTopWidth: 1,
          height: 64 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 2,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontFamily: language === 'hi' ? fonts.devanagari[700] : fonts.inter[600],
          fontSize: 10.5,
          lineHeight: 14,
          marginTop: 2,
          includeFontPadding: false,
        },
        tabBarIcon: ({ color, focused }) => {
          const name = focused ? `${route.name}Active` : route.name
          return <Ionicons name={tabIcons[name] || tabIcons[route.name]} size={22} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Latest" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Videos" component={VideosScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AppStackHeader({ navigation, route, options, back }: NativeStackHeaderProps) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const title = options.title !== undefined ? options.title : route.name

  return (
    <View
      style={{
        width: '100%',
        height: insets.top + 48,
        paddingTop: insets.top,
        zIndex: 100,
        backgroundColor: Platform.OS === 'web'
          ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
          : (isDark ? '#1a1c20' : '#ffffff'),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        ...Platform.select({
          web: {
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          },
          default: {},
        }),
      }}
    >
      <View
        style={{
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
        }}
      >
        {back ? (
          <AppBackButton
            onPress={() => navigation.goBack()}
            size={34}
            style={{ marginRight: 8 }}
          />
        ) : null}
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.sans[700],
            fontSize: 16.5,
            color: colors.text,
            marginLeft: back ? 0 : 4,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </View>
  )
}

export default function RootNavigator() {
  const { user, loading } = useAuth()
  const { isLanguageSelected, isLoading: languageLoading } = useLanguage()
  const { colors, fontScale, isDark } = useTheme()
  const [onboardingReady, setOnboardingReady] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)
  const [splashFinished, setSplashFinished] = useState(false)

  useEffect(() => {
    // Automatically set default preferences: Interests = ALL, Location = All India
    Promise.all([
      AsyncStorage.getItem('aarambh_onboarding_done'),
      AsyncStorage.getItem('aarambh_guest_interests'),
      AsyncStorage.getItem('aarambh_location'),
    ])
      .then(async ([done, interests, loc]) => {
        const updates: Promise<void>[] = []
        if (done !== '1') {
          updates.push(AsyncStorage.setItem('aarambh_onboarding_done', '1'))
        }
        if (!interests) {
          updates.push(AsyncStorage.setItem('aarambh_guest_interests', JSON.stringify(['ALL'])))
        }
        if (!loc) {
          updates.push(AsyncStorage.setItem('aarambh_location', JSON.stringify({ label: 'All India', country: 'India' })))
        }
        if (updates.length > 0) {
          await Promise.all(updates)
        }
        setOnboardingDone(true)
      })
      .catch(() => setOnboardingDone(true))
      .finally(() => setOnboardingReady(true))
  }, [])

  const isDataReady = !loading && !languageLoading && onboardingReady && onboardingDone !== null

  if (!splashFinished) {
    return (
      <AarambhSplashScreen
        isReady={isDataReady}
        minDurationMs={2000}
        onFinish={() => setSplashFinished(true)}
      />
    )
  }

  return (
    <ErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          Notifications.getLastNotificationResponseAsync()
            .then((response) => {
              const contentId = response?.notification?.request?.content?.data?.contentId
              if (contentId) navigateToNewsDetail(String(contentId))
            })
            .catch(() => {})
        }}
      >
        <Stack.Navigator
          initialRouteName={isLanguageSelected ? 'Main' : 'LanguageSelect'}
          screenOptions={{
            header: (props) => <AppStackHeader {...props} />,
            headerShown: true,
          }}
        >
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Saved" component={SavedScreen} options={{ title: 'Saved' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal', title: 'Login' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal', title: 'Create Account' }} />
          <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NewsDetailById" component={NewsDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CategoryNews" component={CategoryNewsScreen} options={{ title: '' }} />
          <Stack.Screen name="CategoryNewsList" component={CategoryNewsListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'Bookmarks' }} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Reading History' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} options={{ title: 'Language Settings' }} />
          <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ title: 'Change Location' }} />
          <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{ title: 'Audio News' }} />
          <Stack.Screen name="Categories" component={CategoriesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Locations" component={LocationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveNews" component={LiveNewsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ReporterDashboard" component={GatedDashboard} options={{ title: 'Reporter Dashboard' }} />
          <Stack.Screen name="SubmitNews" component={GatedSubmitNews} options={{ title: 'Create Article' }} />
          <Stack.Screen name="MySubmissions" component={GatedMySubmissions} options={{ title: 'My Submissions' }} />
          <Stack.Screen name="ReporterProfileScreen" component={GatedReporterProfile} options={{ title: 'Reporter Profile' }} />
          <Stack.Screen name="Ekyc" component={GatedEkyc} options={{ title: 'eKYC' }} />
          <Stack.Screen name="ReporterCard" component={GatedReporterCard} options={{ title: 'Press Card' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({})
