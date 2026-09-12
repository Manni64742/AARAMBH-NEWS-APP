import axios, { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApiUrl, API_BASE } from '../config'

const TOKEN_KEY = 'aarambh_token'

export const client = axios.create({
  baseURL: getApiUrl(),
  timeout: 20000,
})

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string | null) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token)
  else await AsyncStorage.removeItem(TOKEN_KEY)
}

client.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const err = error as AxiosError<any>
  return err?.response?.data?.message || err?.message || fallback
}

export function uploadUrl() {
  return `${API_BASE}/api/v1/media/upload`
}
