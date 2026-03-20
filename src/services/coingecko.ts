import type { DataPoint } from '../types'

const BASE = 'https://api.coingecko.com/api/v3'
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes
const cache = new Map<string, { data: DataPoint[]; ts: number }>()

function msToDate(ms: number): string {
  return new Date(ms).toISOString().split('T')[0]
}

function dedup(raw: [number, number][]): DataPoint[] {
  const map = new Map<string, number>()
  for (const [ms, value] of raw) {
    map.set(msToDate(ms), value)
  }
  return Array.from(map.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export async function fetchBtcHistory(
  currency: string,
  signal?: AbortSignal
): Promise<DataPoint[]> {
  const key = `btc_${currency}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  const url = `${BASE}/coins/bitcoin/market_chart?vs_currency=${currency}&days=max`
  const res = await fetch(url, { signal })

  if (!res.ok) throw new Error(`CoinGecko error: ${res.status} for ${currency}`)

  const json = await res.json()
  const data = dedup(json.prices as [number, number][])
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
