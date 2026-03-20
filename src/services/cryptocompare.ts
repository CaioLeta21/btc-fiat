import type { DataPoint } from '../types'

// BTC price data is pre-fetched and stored as static JSON in /public/data/btc_*.json
// Run scripts/fetch-btc.mjs to update. This eliminates all browser API calls and rate limiting.

const CACHE_TTL = 1000 * 60 * 60 // 1h in-memory cache
const cache = new Map<string, { data: DataPoint[]; ts: number }>()

export async function fetchBtcHistory(
  currency: string,
  signal?: AbortSignal
): Promise<DataPoint[]> {
  const key = `btc_${currency}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  const res = await fetch(`/data/btc_${currency}.json`, { signal })
  if (!res.ok) throw new Error(`BTC data not found for ${currency}`)
  const data: DataPoint[] = await res.json()
  cache.set(key, { data, ts: Date.now() })
  return data
}

export function filterByDateRange(data: DataPoint[], start: string, end: string): DataPoint[] {
  return data.filter(d => d.time >= start && d.time <= end)
}

export function normalizeToBase(data: DataPoint[], base = 100): DataPoint[] {
  if (data.length === 0) return []
  const first = data[0].value
  if (first === 0) return data
  return data.map(d => ({ time: d.time, value: (d.value / first) * base }))
}
