/**
 * Pre-fetches BTC price history from CryptoCompare and saves as static JSON.
 * Run: node scripts/fetch-btc.mjs
 * Outputs: public/data/btc_BRL.json, btc_ARS.json, btc_USD.json, etc.
 *
 * This eliminates all browser API calls, rate limiting, and loading failures.
 * Run this script periodically (e.g. weekly) to keep data fresh.
 *
 * Sources:
 *   BRL, ARS, USD, TRY, JPY → CryptoCompare histoday (2 pages = ~11 years)
 *   CNY → derived from BTC/USD × USD/CNY (Frankfurter)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data')
mkdirSync(OUT, { recursive: true })

const delay = ms => new Promise(r => setTimeout(r, ms))

// ── CryptoCompare ─────────────────────────────────────────────────────────────
async function fetchCC(tsym, toTs = null) {
  const params = new URLSearchParams({ fsym: 'BTC', tsym, limit: '2000' })
  if (toTs) params.set('toTs', String(toTs))
  const url = `https://min-api.cryptocompare.com/data/v2/histoday?${params}`

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CC ${res.status} for ${tsym}`)
    const j = await res.json()
    if (j.Response === 'Success') return j.Data
    if (j.Message?.toLowerCase().includes('rate limit')) {
      console.log(`  rate limit, waiting ${(attempt + 1) * 2}s...`)
      await delay((attempt + 1) * 2000)
      continue
    }
    throw new Error(`CC error for ${tsym}: ${j.Message}`)
  }
  throw new Error(`CC: too many retries for ${tsym}`)
}

async function fetchBtcHistory(tsym) {
  const page1 = await fetchCC(tsym)
  await delay(600)
  const page2 = await fetchCC(tsym, page1.TimeFrom)

  const map = new Map()
  for (const r of [...page2.Data, ...page1.Data]) {
    if (r.close > 0) {
      const date = new Date(r.time * 1000).toISOString().split('T')[0]
      map.set(date, r.close)
    }
  }

  return Array.from(map.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

// ── Frankfurter (for CNY derivation) ─────────────────────────────────────────
async function fetchFxSeries(currency, startDate) {
  const today = new Date().toISOString().split('T')[0]
  const res = await fetch(`https://api.frankfurter.app/${startDate}..${today}?from=USD&to=${currency}`)
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`)
  const j = await res.json()
  return j.rates // { "YYYY-MM-DD": { CNY: number } }
}

function forwardFill(rates, currency, btcUsd) {
  // Build a date→rate map with forward-fill for weekends
  const rateMap = new Map()
  let last = 0
  for (const dp of btcUsd) {
    const dayRates = rates[dp.time]
    if (dayRates?.[currency]) last = dayRates[currency]
    if (last > 0) rateMap.set(dp.time, last)
  }
  return rateMap
}

// ── Save ──────────────────────────────────────────────────────────────────────
function save(code, data) {
  if (!data || data.length === 0) throw new Error('empty data')
  const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time))
  writeFileSync(join(OUT, `btc_${code}.json`), JSON.stringify(sorted))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  console.log(`  ✓ ${code}: ${sorted.length} records, ${first.time} → ${last.time}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching BTC price history...\n')

  // Direct pairs
  const direct = ['BRL', 'ARS', 'USD', 'TRY', 'JPY']
  let btcUsd = null

  for (const sym of direct) {
    process.stdout.write(`  ${sym}... `)
    try {
      const data = await fetchBtcHistory(sym)
      save(sym, data)
      if (sym === 'USD') btcUsd = data
    } catch (e) {
      console.log(`  ✗ ${e.message}`)
    }
    await delay(800)
  }

  // CNY: derive from BTC/USD × USD/CNY
  process.stdout.write('  CNY (derived from BTC/USD × FX)... ')
  try {
    if (!btcUsd) btcUsd = await fetchBtcHistory('USD')
    const startDate = btcUsd[0].time
    const rates = await fetchFxSeries('CNY', startDate)
    const rateMap = forwardFill(rates, 'CNY', btcUsd)
    const cny = btcUsd
      .filter(d => rateMap.has(d.time))
      .map(d => ({ time: d.time, value: d.value * rateMap.get(d.time) }))
    save('CNY', cny)
  } catch (e) {
    console.log(`  ✗ ${e.message}`)
  }

  console.log('\nDone! Run this script weekly to keep data fresh.')
}

main().catch(console.error)
