/**
 * Pre-fetches monthly CPI data and saves as static JSON.
 * Run: node scripts/fetch-cpi.mjs
 * Outputs: public/data/cpi_BRL.json, cpi_ARS.json, etc.
 *
 * Sources por moeda:
 *   BRL → BCB (Banco Central do Brasil) série 433 IPCA MoM → índice acumulado (dados reais até dez/2025)
 *   USD → FRED CPIAUCSL (BLS, dados reais até ~1 mês atrás)
 *   ARS → INDEC via datos.gob.ar IPC Núcleo Nacional (dados reais até ~1 mês atrás)
 *   CNY → FRED CHNCPIALLMINMEI até abr/2025 + extensão com taxa IMF WEO 2025 (0,0%)
 *   JPY → World Bank anual + interpolação mensal + extensão com taxa IMF WEO 2025 (3,3%)
 *   TRY → FRED TURCPIALLMINMEI até abr/2025 + extensão com taxa IMF WEO 2025 (34,9%)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data')
mkdirSync(OUT, { recursive: true })

const FRED_KEY = '4426e4ddbd1f412eb13b5430b04d8536'
const delay = ms => new Promise(r => setTimeout(r, ms))

// ── Helpers ───────────────────────────────────────────────────────────────────
function dateAdd(yyyymm, months) {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(y, m - 1 + months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// Extend an index series forward using a known annual growth rate
function extendWithAnnualRate(data, untilDate, annualRatePct) {
  if (!data.length) return data
  const result = [...data]
  const monthlyRate = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1
  let last = result[result.length - 1]
  let current = last.time

  while (current < untilDate) {
    current = dateAdd(current, 1)
    if (current > untilDate) break
    last = { time: current, value: last.value * (1 + monthlyRate) }
    result.push(last)
  }
  return result
}

// ── FRED monthly CPI index ─────────────────────────────────────────────────────
async function fetchFredCPI(seriesId) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&observation_start=2000-01-01`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED ${res.status} for ${seriesId}`)
  const j = await res.json()
  return j.observations
    .filter(o => o.value !== '.')
    .map(o => ({ time: o.date, value: parseFloat(o.value) }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

// ── Brazil: BCB IPCA (série 433 = MoM %) → índice acumulado ──────────────────
// Dados reais publicados pelo IBGE, disponíveis via BCB API em tempo real
async function fetchBrazilCPI() {
  // Get full MoM history from BCB
  const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/2000&dataFinal=31/12/2025'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BCB ${res.status}`)
  const raw = await res.json()

  // Build cumulative index (base: Jan 2000 = 100)
  let index = 100.0
  const result = []
  for (const r of raw) {
    const [d, m, y] = r.data.split('/')
    const time = `${y}-${m}-${d}`
    index = index * (1 + parseFloat(r.valor) / 100)
    result.push({ time, value: Math.round(index * 10000) / 10000 })
  }
  return result.sort((a, b) => a.time.localeCompare(b.time))
}

// ── Argentina: INDEC via datos.gob.ar ────────────────────────────────────────
// IPC Núcleo Nacional, base dez/2016=100
async function fetchArgentinaCPI() {
  const url = 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INUCLEONAL_DICI_M_19&limit=500&sort=asc&format=json'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`INDEC ${res.status}`)
  const j = await res.json()
  return (j.data || [])
    .filter(r => r[1] !== null)
    .map(r => ({ time: r[0], value: r[1] }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

// ── Japan: World Bank annual + interpolação mensal ────────────────────────────
async function fetchJapanCPI() {
  const urlIndex = 'https://api.worldbank.org/v2/country/JP/indicator/FP.CPI.TOTL?format=json&per_page=100&mrv=100'
  const res = await fetch(urlIndex)
  const j = await res.json()

  const annual = (j[1] || [])
    .filter(o => o.value !== null)
    .map(o => ({ year: parseInt(o.date), value: o.value }))
    .sort((a, b) => a.year - b.year)

  // IMF WEO 2025 actual annual rate for Japan: 3.3%
  // Extend to current year
  const rates = { 2025: 3.3, 2026: 2.1 }
  let lastValue = annual[annual.length - 1].value
  let lastYear = annual[annual.length - 1].year

  for (let y = lastYear + 1; y <= new Date().getFullYear(); y++) {
    lastValue = lastValue * (1 + (rates[y] ?? 2.5) / 100)
    annual.push({ year: y, value: lastValue })
    lastYear = y
  }

  // Interpolate to monthly
  const monthly = []
  for (let i = 0; i < annual.length - 1; i++) {
    const { year: y0, value: v0 } = annual[i]
    const { year: y1, value: v1 } = annual[i + 1]
    const months = (y1 - y0) * 12
    for (let m = 0; m < months; m++) {
      const date = new Date(y0, m)
      const time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      monthly.push({ time, value: v0 + (v1 - v0) * (m / months) })
    }
  }
  const last = annual[annual.length - 1]
  monthly.push({ time: `${last.year}-12-01`, value: last.value })
  return monthly.sort((a, b) => a.time.localeCompare(b.time))
}

// ── Save ──────────────────────────────────────────────────────────────────────
function save(code, data) {
  if (!data || data.length === 0) throw new Error(`empty data for ${code}`)
  const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time))
  writeFileSync(join(OUT, `cpi_${code}.json`), JSON.stringify(sorted))
  console.log(`  ✓ ${code}: ${sorted.length} records, ${sorted[0].time} → ${sorted[sorted.length - 1].time}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching CPI data...\n')

  // Brazil — BCB (dados reais mensais até dez/2025)
  process.stdout.write('  BRL (BCB IPCA)... ')
  try {
    save('BRL', await fetchBrazilCPI())
  } catch (e) { console.log(`  ✗ ${e.message}`) }
  await delay(300)

  // USA — FRED CPIAUCSL (dados reais, ~1 mês de lag)
  process.stdout.write('  USD (FRED CPIAUCSL)... ')
  try {
    save('USD', await fetchFredCPI('CPIAUCSL'))
  } catch (e) { console.log(`  ✗ ${e.message}`) }
  await delay(300)

  // Argentina — INDEC (dados reais)
  process.stdout.write('  ARS (INDEC dados.gob.ar)... ')
  try {
    save('ARS', await fetchArgentinaCPI())
  } catch (e) { console.log(`  ✗ ${e.message}`) }
  await delay(300)

  // China — FRED até abr/2025 + extensão IMF 2025 (0,0% anual — deflação leve)
  process.stdout.write('  CNY (FRED + extensão IMF 2025)... ')
  try {
    const base = await fetchFredCPI('CHNCPIALLMINMEI')
    // IMF WEO 2025 actual for China: 0.0% (near-deflation)
    const extended = extendWithAnnualRate(base, '2025-12-01', 0.0)
    save('CNY', extended)
  } catch (e) { console.log(`  ✗ ${e.message}`) }
  await delay(300)

  // Turkey — FRED até abr/2025 + extensão IMF 2025 (34,9% anual)
  process.stdout.write('  TRY (FRED + extensão IMF 2025)... ')
  try {
    const base = await fetchFredCPI('TURCPIALLMINMEI')
    // IMF WEO 2025 actual for Turkey: 34.9% annual
    const extended = extendWithAnnualRate(base, '2025-12-01', 34.9)
    save('TRY', extended)
  } catch (e) { console.log(`  ✗ ${e.message}`) }
  await delay(300)

  // Japan — World Bank anual + interpolação + extensão IMF 2025 (3,3%)
  process.stdout.write('  JPY (World Bank + interpolação + IMF 2025)... ')
  try {
    save('JPY', await fetchJapanCPI())
  } catch (e) { console.log(`  ✗ ${e.message}`) }

  console.log('\nDone! Run monthly to keep data fresh.')
}

main().catch(console.error)
