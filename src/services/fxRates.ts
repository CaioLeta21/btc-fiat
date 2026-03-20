import type { DataPoint } from '../types'

// Used to derive BTC/CNY and BTC/JPY from BTC/USD × USD/local
// Frankfurter uses ECB data, covers CNY and JPY with daily rates

const CACHE_TTL = 1000 * 60 * 60 * 4 // 4 hours
const cache = new Map<string, { data: Map<string, number>; ts: number }>()

// Returns a map of date → USD/currency rate
export async function fetchFxRates(
  currencies: string[], // e.g. ['CNY', 'JPY']
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<Map<string, Map<string, number>>> {
  // result: currency → (date → rate)
  const result = new Map<string, Map<string, number>>()
  for (const c of currencies) result.set(c, new Map())

  const key = `fx_${currencies.sort().join('_')}_${startDate}_${endDate}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    // Split cached flat map back to per-currency
    for (const [dateKey, rate] of cached.data) {
      const [curr, date] = dateKey.split('|')
      result.get(curr)?.set(date, rate)
    }
    return result
  }

  try {
    const params = `${startDate}..${endDate}?from=USD&to=${currencies.join(',')}`
    const res = await fetch(`https://api.frankfurter.app/${params}`)
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`)

    const json = await res.json()
    const rates: Record<string, Record<string, number>> = json.rates ?? {}

    // Frankfurter only has weekday data — forward-fill weekends
    const allDates = generateDateRange(startDate, endDate)
    const lastKnown: Record<string, number> = {}

    for (const curr of currencies) lastKnown[curr] = 0

    for (const date of allDates) {
      const dayRates = rates[date]
      if (dayRates) {
        for (const curr of currencies) {
          if (dayRates[curr]) lastKnown[curr] = dayRates[curr]
        }
      }
      for (const curr of currencies) {
        if (lastKnown[curr] > 0) {
          result.get(curr)?.set(date, lastKnown[curr])
        }
      }
    }

    // Cache flat
    const flat = new Map<string, number>()
    for (const curr of currencies) {
      for (const [date, rate] of result.get(curr)!) {
        flat.set(`${curr}|${date}`, rate)
      }
    }
    cache.set(key, { data: flat, ts: Date.now() })
  } catch (e) {
    console.warn('Frankfurter FX failed:', e)
  }

  return result
}

// Derive BTC/local from BTC/USD × USD/local
export function deriveBtcLocal(
  btcUsd: DataPoint[],
  usdToLocal: Map<string, number>
): DataPoint[] {
  return btcUsd
    .map(d => {
      const rate = usdToLocal.get(d.time)
      if (!rate) return null
      return { time: d.time, value: d.value * rate }
    })
    .filter((d): d is DataPoint => d !== null)
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  const endDate = new Date(end)
  while (cur <= endDate) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}
