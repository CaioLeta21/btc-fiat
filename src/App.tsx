import { useState } from 'react'
import type { ViewMode, Language } from './types'
import { DEFAULT_SELECTED, DEFAULT_START, DEFAULT_END } from './constants'
import { useChartData } from './hooks/useChartData'
import { t } from './i18n'

import Header from './components/Header'
import ViewToggle from './components/ViewToggle'
import Controls from './components/Controls'
import ChartWrapper from './components/ChartWrapper'
import Legend from './components/Legend'
import Callouts from './components/Callouts'
import Disclaimer from './components/Disclaimer'
import LoadingOverlay from './components/LoadingOverlay'
import ViewExplanation from './components/ViewExplanation'

export default function App() {
  const [lang, setLang] = useState<Language>('pt')
  const [viewMode, setViewMode] = useState<ViewMode>('return')
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(DEFAULT_SELECTED)
  const [logScale, setLogScale] = useState(false)

  const { series, callouts, loading, loadingCurrencies, errors } = useChartData(
    viewMode,
    startDate,
    endDate,
    selectedCurrencies
  )

  function handleViewChange(mode: ViewMode) {
    setViewMode(mode)
    if (mode === 'price' || mode === 'purchasing_power') {
      setSelectedCurrencies(prev => prev.length > 0 ? [prev[0]] : ['BRL'])
    }
  }

  function toggleCurrency(code: string) {
    if (viewMode === 'price' || viewMode === 'purchasing_power') {
      // Single select: clicking any currency selects only that one
      setSelectedCurrencies([code])
      return
    }
    setSelectedCurrencies(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header lang={lang} onLangChange={setLang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Subtitle */}
        <div className="space-y-1">
          <p className="text-gray-400 text-base">{t(lang, 'subtitle')}</p>
        </div>

        {/* View toggle */}
        <ViewToggle value={viewMode} onChange={handleViewChange} lang={lang} />

        {/* Controls */}
        <Controls
          lang={lang}
          viewMode={viewMode}
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          selectedCurrencies={selectedCurrencies}
          onCurrencyToggle={toggleCurrency}
          onSelectAll={() => setSelectedCurrencies(['BRL','ARS','USD','CNY','JPY','TRY'])}
          onClearAll={() => setSelectedCurrencies([])}
          logScale={logScale}
          onLogScaleChange={setLogScale}
        />

        {/* Loading status */}
        <LoadingOverlay loadingCurrencies={loadingCurrencies} lang={lang} />

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(errors).map(([code, msg]) => (
              <span key={code} className="tag-warning">
                {code}: {msg}
              </span>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="relative">
          <ChartWrapper
            series={series}
            logScale={logScale}
            viewMode={viewMode}
            lang={lang}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        </div>

        {/* View explanation */}
        <ViewExplanation
          viewMode={viewMode}
          lang={lang}
          series={series}
          startDate={startDate}
          endDate={endDate}
          selectedCurrencies={selectedCurrencies}
        />

        {/* Legend */}
        <Legend series={series} lang={lang} />

        {/* Callouts */}
        <Callouts
          callouts={callouts}
          viewMode={viewMode}
          lang={lang}
          startDate={startDate}
        />

        {/* Disclaimers */}
        <Disclaimer selectedCurrencies={selectedCurrencies} lang={lang} />

        {/* Footer */}
        <footer className="border-t border-[#1f1f1f] pt-6 pb-4 space-y-1">
          <p className="text-xs text-gray-600">{t(lang, 'sources')}</p>
          <p className="text-xs text-gray-700">{t(lang, 'updated')}</p>
        </footer>
      </main>
    </div>
  )
}
