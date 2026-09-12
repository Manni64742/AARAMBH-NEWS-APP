import { client } from './client'
import { MarketIndexItem } from '../types'

const FALLBACK_INDICES: MarketIndexItem[] = [
  { _id: 'idx-nifty-50', symbol: 'NIFTY 50', name: 'Nifty 50', value: 23338.35, change: -138.6, changePct: -0.59 },
  { _id: 'idx-sensex', symbol: 'SENSEX', name: 'BSE Sensex', value: 75180.79, change: -396.79, changePct: -0.53 },
  { _id: 'idx-adaniports', symbol: 'ADANIPORTS', name: 'Adani Ports', value: 1761.6, change: -6.4, changePct: -0.36 },
  { _id: 'idx-apollohosp', symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', value: 8923.0, change: 23.0, changePct: 0.26 },
  { _id: 'idx-asianpaint', symbol: 'ASIANPAINT', name: 'Asian Paints', value: 2463.0, change: -35.1, changePct: -1.41 },
  { _id: 'idx-axisbank', symbol: 'AXISBANK', name: 'Axis Bank', value: 1246.2, change: 0.2, changePct: 0.02 },
  { _id: 'idx-bajaj-auto', symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', value: 11680.0, change: -88.0, changePct: -0.75 },
  { _id: 'idx-bajajfinsv', symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', value: 1904.1, change: -36.4, changePct: -1.88 },
  { _id: 'idx-bel', symbol: 'BEL', name: 'Bharat Electronics', value: 404.2, change: 1.2, changePct: 0.3 },
  { _id: 'idx-bhartiartl', symbol: 'BHARTIARTL', name: 'Bharti Airtel', value: 1841.4, change: 4.4, changePct: 0.24 },
]

export const marketApi = {
  async list(): Promise<MarketIndexItem[]> {
    try {
      const res = await client.get<{ success: boolean; data: MarketIndexItem[] }>('/market/ticker')
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data
      }
    } catch {
      // Fallback if backend is offline or network fails
    }
    return FALLBACK_INDICES
  },
}