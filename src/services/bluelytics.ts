import type { DataPoint } from '../types'

const CACHE_TTL = 1000 * 60 * 60 // 1 hour
let cachedData: { data: DataPoint[]; ts: number } | null = null

interface BlueticsEntry {
  date: string
  source: string
  value_buy: number
  value_sell: number
}

export async function fetchBlueDollar(signal?: AbortSignal): Promise<DataPoint[]> {
  if (cachedData && Date.now() - cachedData.ts < CACHE_TTL) return cachedData.data

  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/evolution.json', { signal })
    if (!res.ok) throw new Error(`Bluelytics error: ${res.status}`)

    const json: BlueticsEntry[] = await res.json()
    // Filter only "Blue" source and use sell rate (USD/ARS_blue)
    const data: DataPoint[] = json
      .filter(e => e.source === 'Blue')
      .map(e => ({ time: e.date, value: e.value_sell }))
      .sort((a, b) => a.time.localeCompare(b.time))

    cachedData = { data, ts: Date.now() }
    return data
  } catch (e) {
    console.warn('Bluelytics unavailable:', e)
    return []
  }
}

// Convert USD/ARS_blue rates to BTC/ARS_blue prices
// btcUsd: BTC/USD price series, blueRate: USD/ARS_blue series
export function calcBtcBlue(
  btcUsd: DataPoint[],
  blueRate: DataPoint[]
): DataPoint[] {
  if (blueRate.length === 0) return []

  const rateMap = new Map(blueRate.map(d => [d.time, d.value]))
  const btcUsdMap = new Map(btcUsd.map(d => [d.time, d.value]))

  const result: DataPoint[] = []
  for (const [date, usdRate] of rateMap) {
    const btcPrice = btcUsdMap.get(date)
    if (btcPrice !== undefined) {
      result.push({ time: date, value: btcPrice * usdRate })
    }
  }

  return result.sort((a, b) => a.time.localeCompare(b.time))
}
