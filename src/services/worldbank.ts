import type { DataPoint } from '../types'

// CPI data is pre-fetched from FRED/INDEC and stored as static JSON in /public/data/cpi_*.json
// Run scripts/fetch-cpi.mjs to update. Sources:
//   BRL/USD/CNY/TRY → FRED OECD monthly series
//   ARS → INDEC via datos.gob.ar (monthly through current month)
//   JPY → World Bank annual + monthly interpolation

const CACHE_TTL = 1000 * 60 * 60 // 1h in-memory cache
const cache = new Map<string, { data: DataPoint[]; ts: number }>()

export async function fetchCPI(
  countryCode: string,
  signal?: AbortSignal
): Promise<DataPoint[]> {
  const key = `cpi_${countryCode}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  // Map World Bank country code to currency code for file lookup
  const codeMap: Record<string, string> = {
    BR: 'BRL', AR: 'ARS', US: 'USD', CN: 'CNY', JP: 'JPY', TR: 'TRY',
  }
  const currencyCode = codeMap[countryCode] ?? countryCode

  try {
    const res = await fetch(`/data/cpi_${currencyCode}.json`, { signal })
    if (!res.ok) throw new Error(`CPI file not found for ${currencyCode}`)
    const data: DataPoint[] = await res.json()
    cache.set(key, { data, ts: Date.now() })
    return data
  } catch (e) {
    console.warn(`CPI fetch failed for ${countryCode}:`, e)
    return []
  }
}

// Normalize CPI: index 100 at startDate, showing cumulative inflation
export function normalizeCPI(data: DataPoint[], startDate: string): DataPoint[] {
  // Use last available point at or before startDate as base (100 anchor)
  const refPoint = [...data].filter(d => d.time <= startDate).pop() ?? data[0]
  if (!refPoint) return []
  const base = refPoint.value
  return data
    .filter(d => d.time >= refPoint.time)
    .map(d => ({ time: d.time, value: (d.value / base) * 100 }))
}
