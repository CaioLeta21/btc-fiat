import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  LineStyle,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type LineSeriesOptions,
  type Time,
} from 'lightweight-charts'
import type { ChartSeries, ViewMode, Language } from '../types'
import { t } from '../i18n'

interface Props {
  series: ChartSeries[]
  logScale: boolean
  viewMode: ViewMode
  lang: Language
  loading: boolean
  startDate: string
  endDate: string
}

export default function ChartWrapper({ series, logScale, viewMode, lang, loading, startDate, endDate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111111' },
        textColor: '#9ca3af',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      crosshair: {
        vertLine: { color: '#F7931A55', width: 1 },
        horzLine: { color: '#F7931A55', width: 1 },
      },
      rightPriceScale: {
        borderColor: '#262626',
        mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
      timeScale: {
        borderColor: '#262626',
        timeVisible: true,
        secondsVisible: false,
        minBarSpacing: 0.1,
      },
      width: containerRef.current.clientWidth,
      height: 480,
    })

    chartRef.current = chart

    // Responsive resize
    const ro = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({ width: entries[0].contentRect.width })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesMapRef.current.clear()
    }
  }, [])

  // Update log scale
  useEffect(() => {
    chartRef.current?.applyOptions({
      rightPriceScale: {
        mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
    })
  }, [logScale])

  // Update series and set visible range
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const existingIds = new Set(seriesMapRef.current.keys())
    const newIds = new Set(series.map(s => s.id))

    // Remove stale series
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const s = seriesMapRef.current.get(id)
        if (s) chart.removeSeries(s)
        seriesMapRef.current.delete(id)
      }
    }

    // Add or update series
    for (const s of series) {
      if (seriesMapRef.current.has(s.id)) {
        // Update existing
        const existing = seriesMapRef.current.get(s.id)!
        existing.setData(s.data)
      } else {
        // Add new
        const opts: Partial<LineSeriesOptions> = {
          color: s.color,
          lineWidth: 2,
          lineStyle: s.dashed ? LineStyle.Dashed : LineStyle.Solid,
          priceScaleId: 'right',
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lastValueVisible: true,
          priceLineVisible: false,
        }
        const newSeries = chart.addLineSeries(opts)
        newSeries.setData(s.data)
        seriesMapRef.current.set(s.id, newSeries)
      }
    }

    if (series.length > 0) {
      // Explicitly set the visible range to match the selected date range
      try {
        chart.timeScale().setVisibleRange({
          from: startDate as unknown as Time,
          to: endDate as unknown as Time,
        })
      } catch {
        chart.timeScale().fitContent()
      }
    }
  }, [series, startDate, endDate])

  const formatYLabel = () => {
    switch (viewMode) {
      case 'price': return lang === 'pt' ? 'Preço em moeda local' : 'Price in local currency'
      case 'return': return lang === 'pt' ? 'Índice (base 100)' : 'Index (base 100)'
      case 'purchasing_power': return lang === 'pt' ? 'Índice (base 100)' : 'Index (base 100)'
      case 'm2': return lang === 'pt' ? 'M2 (base 100)' : 'M2 (base 100)'
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Y-axis label */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs text-gray-600">{formatYLabel()}</span>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 border border-btc border-t-transparent rounded-full animate-spin" />
            {t(lang, 'loading')}
          </div>
        )}
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="w-full" />

      {/* No data state */}
      {!loading && series.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-600 text-sm">{t(lang, 'chart_no_data')}</p>
        </div>
      )}
    </div>
  )
}
