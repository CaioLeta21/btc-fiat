import type { DataPoint } from '../types'

// M2 data is pre-fetched from FRED/ECB and stored as static JSON files in /public/data/
// Run scripts/fetch-m2.mjs to update the data.
// This avoids CORS issues with FRED and ECB APIs.

const CACHE_TTL = 1000 * 60 * 60 // 1h in-memory cache
const cache = new Map<string, { data: DataPoint[]; ts: number }>()

// Returns ALL available M2 data for the currency (no date filtering).
// Caller is responsible for filtering and normalization.
export async function fetchM2(
  currencyCode: string,
  signal?: AbortSignal
): Promise<DataPoint[]> {
  const key = `m2_${currencyCode}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  try {
    const res = await fetch(`/data/m2_${currencyCode}.json`, { signal })
    if (!res.ok) throw new Error(`M2 file not found for ${currencyCode}`)
    const data: DataPoint[] = await res.json()
    cache.set(key, { data, ts: Date.now() })
    return data
  } catch (e) {
    console.warn(`M2 unavailable for ${currencyCode}:`, e)
    return []
  }
}

export function normalizeM2(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) return []
  const base = data[0].value
  if (base === 0) return data
  return data.map(d => ({ time: d.time, value: (d.value / base) * 100 }))
}
