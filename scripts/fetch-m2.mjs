/**
 * Pre-fetches M2 money supply data from multiple sources.
 * Run: node scripts/fetch-m2.mjs
 * Outputs: public/data/m2_*.json  (array of {time: "YYYY-MM-DD", value: number})
 *
 * Sources by country:
 *   USD → FRED M2SL             (monthly, to present)
 *   BRL → BCB API               (monthly, to present)
 *   JPY → BOJ API MD02           (monthly, real data to present — no registration needed)
 *   TRY → TCMB EVDS3 API        (monthly, real data to present — key required)
 *   CNY → IMF IFS via DBnomics  (monthly real data to 2025-06)
 *   ARS → World Bank annual     (annual to 2024, interpolated monthly)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data')
mkdirSync(OUT, { recursive: true })

const FRED_KEY = '4426e4ddbd1f412eb13b5430b04d8536'
const TCMB_KEY = '9GrfsCOgQu'
const delay = ms => new Promise(r => setTimeout(r, ms))

// ── FRED ─────────────────────────────────────────────────────────────────────
async function fetchFRED(seriesId) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&frequency=m&aggregation_method=eop&observation_start=2010-01-01`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED ${res.status} for ${seriesId}`)
  const j = await res.json()
  return j.observations
    .filter(o => o.value !== '.' && o.value !== 'NA')
    .map(o => ({ time: o.date, value: parseFloat(o.value) }))
}

// ── BCB (Brazil M2) ───────────────────────────────────────────────────────────
async function fetchBCB() {
  const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.27840/dados?formato=json&dataInicial=01/01/2010&dataFinal=31/12/2026'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BCB ${res.status}`)
  const j = await res.json()
  return j.map(o => {
    const [d, m, y] = o.data.split('/')
    return { time: `${y}-${m}-${d}`, value: parseFloat(o.valor) }
  })
}

// ── TCMB (Turkey) — EVDS3 API, key required ──────────────────────────────────
async function fetchTCMB(seriesCode, apiKey) {
  // TP.PBD.G02 = M2 Monetary Aggregates (monthly, in thousands TRY)
  const url = `https://evds3.tcmb.gov.tr/igmevdsms-dis/series=${seriesCode}&startDate=01-01-2010&endDate=01-03-2030&type=json`
  const res = await fetch(url, { headers: { key: apiKey, 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`TCMB ${res.status}`)
  const j = await res.json()
  const items = j.items || []
  if (!items.length) throw new Error('TCMB: no data')
  const field = seriesCode.replace(/\./g, '_')
  return items
    .filter(d => d[field] != null)
    .map(d => {
      // Tarih format: "2024-3" = year-month
      const [y, m] = d.Tarih.split('-')
      return { time: `${y}-${String(m).padStart(2, '0')}-01`, value: parseFloat(d[field]) }
    })
    .sort((a, b) => a.time.localeCompare(b.time))
}

// ── BOJ (Bank of Japan) — public API, no registration needed ─────────────────
async function fetchBOJ(seriesCode, db = 'MD02') {
  const url = `https://www.stat-search.boj.or.jp/api/v1/getDataCode?format=json&lang=en&db=${db}&startDate=201001&endDate=203001&code=${seriesCode}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`BOJ ${res.status} for ${seriesCode}`)
  const j = await res.json()
  const s = j.RESULTSET?.[0]
  const dates = s?.VALUES?.SURVEY_DATES || []
  const values = s?.VALUES?.VALUES || []
  if (!dates.length) throw new Error(`BOJ: no data for ${seriesCode}`)
  return dates.map((d, i) => {
    const ds = String(d)
    return { time: `${ds.slice(0, 4)}-${ds.slice(4, 6)}-01`, value: values[i] }
  }).filter(d => d.value != null)
}

// ── IMF IFS via DBnomics (real monthly data) ─────────────────────────────────
async function fetchIMFIFS(seriesCode) {
  const url = `https://api.db.nomics.world/v22/series?series_ids=IMF/IFS/${seriesCode}&observations=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DBnomics ${res.status} for ${seriesCode}`)
  const j = await res.json()
  const doc = j.series?.docs?.[0]
  if (!doc || !doc.period?.length) throw new Error(`No data for ${seriesCode}`)
  return doc.period
    .map((p, i) => ({ time: p + '-01', value: doc.value[i] }))
    .filter(d => d.value !== null && !isNaN(d.value))
    .sort((a, b) => a.time.localeCompare(b.time))
}

// ── World Bank (annual → monthly interpolation) ───────────────────────────────
async function fetchWorldBank(countryCode) {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/FM.LBL.BMNY.CN?format=json&per_page=50&mrv=50&date=2010:2026`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WorldBank ${res.status}`)
  const j = await res.json()
  const annual = (j[1] || [])
    .filter(o => o.value !== null)
    .map(o => ({ year: parseInt(o.date), value: o.value }))
    .sort((a, b) => a.year - b.year)

  if (annual.length < 2) return []

  // Linear interpolation: annual mid-year anchor → monthly
  const monthly = []
  for (let i = 0; i < annual.length - 1; i++) {
    const y0 = annual[i].year, v0 = annual[i].value
    const y1 = annual[i + 1].year, v1 = annual[i + 1].value
    const steps = (y1 - y0) * 12
    for (let m = 0; m < steps; m++) {
      const date = new Date(y0, 6 + m, 1) // Jul anchor
      const time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      monthly.push({ time, value: v0 + (v1 - v0) * (m / steps) })
    }
  }
  // Last year: extend to Dec
  const last = annual[annual.length - 1]
  for (let m = 0; m < 6; m++) {
    const date = new Date(last.year, 6 + m, 1)
    const time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
    if (time > monthly[monthly.length - 1]?.time) {
      monthly.push({ time, value: last.value })
    }
  }
  return monthly
}

// ── Merge: FRED monthly + World Bank annual extension ─────────────────────────
// Takes FRED data (more accurate monthly) and extends with WB interpolation after the FRED cutoff
async function fetchFREDextended(fredSeries, wbCountryCode) {
  const [fredData, wbData] = await Promise.all([
    fetchFRED(fredSeries),
    fetchWorldBank(wbCountryCode),
  ])

  if (fredData.length === 0) return wbData
  if (wbData.length === 0) return fredData

  const fredCutoff = fredData[fredData.length - 1].time
  const lastFredValue = fredData[fredData.length - 1].value

  // Get WB data after FRED cutoff, rescale to match FRED's last value
  const wbAfter = wbData.filter(d => d.time > fredCutoff)
  if (wbAfter.length === 0) return fredData

  // Find WB value closest to FRED cutoff for rescaling
  const wbAtCutoff = wbData.reduce((closest, d) => {
    return Math.abs(d.time.localeCompare(fredCutoff)) < Math.abs(closest.time.localeCompare(fredCutoff))
      ? d : closest
  })
  const scale = wbAtCutoff.value > 0 ? lastFredValue / wbAtCutoff.value : 1

  const extension = wbAfter.map(d => ({ time: d.time, value: d.value * scale }))
  return [...fredData, ...extension]
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function save(code, data) {
  if (!data || data.length === 0) throw new Error('empty data')
  const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time))
  // Remove duplicates (keep last)
  const deduped = []
  const seen = new Set()
  for (const d of sorted) {
    if (!seen.has(d.time)) { seen.add(d.time); deduped.push(d) }
  }
  writeFileSync(join(OUT, `m2_${code}.json`), JSON.stringify(deduped))
  const last = deduped[deduped.length - 1]
  console.log(`  ✓ ${code}: ${deduped.length} records, latest ${last.time.slice(0, 7)}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching M2 data...\n')

  const tasks = [
    { code: 'USD', label: 'FRED M2SL',         fn: () => fetchFRED('M2SL') },
    { code: 'BRL', label: 'BCB API',            fn: () => fetchBCB() },
    { code: 'JPY', label: 'BOJ API (real monthly)', fn: () => fetchBOJ('MAM1NAM2M2MO') },
    { code: 'TRY', label: 'TCMB EVDS3 (real monthly)', fn: () => fetchTCMB('TP.PBD.G02', TCMB_KEY) },
    { code: 'CNY', label: 'IMF IFS/DBnomics monthly', fn: () => fetchIMFIFS('M.CN.34____XDC') },
    { code: 'ARS', label: 'World Bank annual',  fn: () => fetchWorldBank('AR') },
  ]

  for (const { code, label, fn } of tasks) {
    process.stdout.write(`  ${code} (${label})... `)
    try {
      await save(code, await fn())
    } catch (e) {
      console.log(`  ✗ ${e.message}`)
    }
    await delay(350)
  }

  console.log('\nDone!')
}

main().catch(console.error)
