import { useState, useEffect, useRef } from 'react'
import type { ViewMode, ChartSeries, Callout } from '../types'
import { CURRENCIES } from '../constants'
import {
  fetchBtcHistory,
  filterByDateRange,
  normalizeToBase,
} from '../services/cryptocompare'
import { fetchCPI, normalizeCPI } from '../services/worldbank'
import { fetchM2 } from '../services/fred'

interface ChartDataResult {
  series: ChartSeries[]
  callouts: Callout[]
  loading: boolean
  loadingCurrencies: string[]
  errors: Record<string, string>
}

export function useChartData(
  viewMode: ViewMode,
  startDate: string,
  endDate: string,
  selectedCurrencies: string[]
): ChartDataResult {
  const [series, setSeries] = useState<ChartSeries[]>([])
  const [callouts, setCallouts] = useState<Callout[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCurrencies, setLoadingCurrencies] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (selectedCurrencies.length === 0) {
      setSeries([])
      setCallouts([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const signal = controller.signal

    async function load() {
      setLoading(true)
      setErrors({})
      setLoadingCurrencies([])
      const newSeries: ChartSeries[] = []
      const newCallouts: Callout[]= []
      const newErrors: Record<string, string> = {}

      const currencies = CURRENCIES.filter(c => selectedCurrencies.includes(c.code))

      // Process each currency
      for (const currency of currencies) {
        if (signal.aborted) break
        setLoadingCurrencies(prev => [...prev, currency.code])

        try {
          if (viewMode === 'price' || viewMode === 'return') {
            const raw = await fetchBtcHistory(currency.code, signal)
            const filtered = filterByDateRange(raw, startDate, endDate)


            if (filtered.length === 0) {
              newErrors[currency.code] = 'no_data_range'
              continue
            }

            let seriesData = filtered
            if (viewMode === 'return') {
              seriesData = normalizeToBase(filtered, 100)
            }

            newSeries.push({
              id: currency.code,
              label: `${currency.flag} ${currency.code}`,
              color: currency.color,
              data: seriesData,
            })

            // Callout
            const first = filtered[0]
            const last = filtered[filtered.length - 1]
            if (first && last && first.value > 0) {
              newCallouts.push({
                currencyCode: currency.code,
                flag: currency.flag,
                country: currency.country,
                color: currency.color,
                startValue: first.value,
                endValue: last.value,
                multiplier: last.value / first.value,
                isPositive: last.value > first.value,
              })
            }

          } else if (viewMode === 'purchasing_power') {
            const raw = await fetchBtcHistory(currency.code, signal)
            const filtered = filterByDateRange(raw, startDate, endDate)

            if (filtered.length === 0) continue

            newSeries.push({
              id: currency.code,
              label: `${currency.flag} BTC/${currency.code}`,
              color: currency.color,
              data: normalizeToBase(filtered, 100),
            })

            // CPI (inflation) series
            const cpiRaw = await fetchCPI(currency.worldBankCode, signal)
            if (cpiRaw.length > 0) {
              const cpiNorm = normalizeCPI(cpiRaw, startDate).filter(d => d.time <= endDate)
              if (cpiNorm.length > 0) {
                newSeries.push({
                  id: `${currency.code}_cpi`,
                  label: `${currency.flag} CPI`,
                  color: currency.color,
                  data: cpiNorm,
                  dashed: true,
                })
              }
            }

            const first = filtered[0]
            const last = filtered[filtered.length - 1]
            if (first && last && first.value > 0) {
              newCallouts.push({
                currencyCode: currency.code,
                flag: currency.flag,
                country: currency.country,
                color: currency.color,
                startValue: first.value,
                endValue: last.value,
                multiplier: last.value / first.value,
                isPositive: true,
              })
            }

          } else if (viewMode === 'm2') {
            // Fetch ALL available M2 data (no startDate filter)
            const allM2 = await fetchM2(currency.code, signal)
            if (allM2.length === 0) {
              newErrors[currency.code] = 'no_m2_data'
              continue
            }

            // Reference: last data point at or before startDate (for correct 100 anchor)
            // Falls back to first available point if all data is after startDate
            const refPoint =
              [...allM2].filter(d => d.time <= startDate).pop() ?? allM2[0]
            const refValue = refPoint.value

            // Normalize ALL data relative to reference (= 100 at startDate)
            const normalizedAll = allM2.map(d => ({
              time: d.time,
              value: (d.value / refValue) * 100,
            }))

            // Filter to visible range
            const visible = normalizedAll.filter(
              d => d.time >= startDate && d.time <= endDate
            )
            // If no data in visible range, skip silently (data ended before startDate)
            if (visible.length === 0) continue

            newSeries.push({
              id: currency.code,
              label: `${currency.flag} M2 ${currency.code}`,
              color: currency.color,
              data: visible,
            })

            const last = visible[visible.length - 1]
            if (last) {
              newCallouts.push({
                currencyCode: currency.code,
                flag: currency.flag,
                country: currency.country,
                color: currency.color,
                startValue: 100,
                endValue: last.value,
                multiplier: last.value / 100,
                isPositive: last.value > 100,
              })
            }
          }
        } catch (e: unknown) {
          if (signal.aborted) break
          const msg = e instanceof Error ? e.message : 'Unknown error'
          newErrors[currency.code] = msg
          console.warn(`Error loading ${currency.code}:`, msg)
        } finally {
          setLoadingCurrencies(prev => prev.filter(c => c !== currency.code))
        }
      }

      if (!signal.aborted) {

        newCallouts.sort((a, b) => b.multiplier - a.multiplier)
        setSeries(newSeries)
        setCallouts(newCallouts)
        setErrors(newErrors)
        setLoading(false)
        setLoadingCurrencies([])
      }
    }

    load()
    return () => { controller.abort() }
  }, [viewMode, startDate, endDate, selectedCurrencies.join(',')])

  return { series, callouts, loading, loadingCurrencies, errors }
}
