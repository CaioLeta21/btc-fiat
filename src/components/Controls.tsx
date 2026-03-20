import type { Language, ViewMode } from '../types'
import { CURRENCIES, DEFAULT_START, DEFAULT_END } from '../constants'
import { t } from '../i18n'

interface Props {
  lang: Language
  viewMode: ViewMode
  startDate: string
  endDate: string
  onStartChange: (d: string) => void
  onEndChange: (d: string) => void
  selectedCurrencies: string[]
  onCurrencyToggle: (code: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  logScale: boolean
  onLogScaleChange: (v: boolean) => void
}

export default function Controls({
  lang,
  viewMode,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  selectedCurrencies,
  onCurrencyToggle,
  onSelectAll,
  onClearAll,
  logScale,
  onLogScaleChange,
}: Props) {

  return (
    <div className="card p-4 space-y-4">
      {/* Date range */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {t(lang, 'date_from')}
          </label>
          <input
            type="date"
            value={startDate}
            min="2013-04-01"
            max={endDate}
            onChange={e => onStartChange(e.target.value)}
            className="bg-[#1f1f1f] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-btc transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {t(lang, 'date_to')}
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={DEFAULT_END}
            onChange={e => onEndChange(e.target.value)}
            className="bg-[#1f1f1f] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-btc transition-colors"
          />
        </div>

        {/* Quick presets */}
        <div className="flex gap-2">
          {['1A', '3A', '5A', '10A', 'Max'].map(preset => {
            const years: Record<string, number | null> = { '1A': 1, '3A': 3, '5A': 5, '10A': 10, 'Max': null }
            const label = lang === 'pt' ? preset : preset.replace('A', 'Y')
            return (
              <button
                key={preset}
                onClick={() => {
                  const yr = years[preset]
                  if (yr === null) {
                    onStartChange('2013-04-01')
                  } else {
                    const d = new Date()
                    d.setFullYear(d.getFullYear() - yr)
                    onStartChange(d.toISOString().split('T')[0])
                  }
                  onEndChange(DEFAULT_END)
                }}
                className="px-3 py-2 rounded-lg bg-[#1f1f1f] border border-[#333] text-gray-400 hover:text-white hover:bg-[#2a2a2a] text-xs font-medium transition-all"
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Options */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Log scale toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onLogScaleChange(!logScale)}
              className={`relative w-9 h-5 rounded-full transition-colors ${logScale ? 'bg-btc' : 'bg-[#333]'}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${logScale ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
            <span className="text-xs text-gray-400">{t(lang, 'log_scale')}</span>
          </label>

        </div>
      </div>

      {/* Currency selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {t(lang, 'currencies')}
            </span>
            {(viewMode === 'price' || viewMode === 'purchasing_power') && (
              <span className="text-xs text-btc/70 font-medium">
                {lang === 'pt' ? '— selecione 1' : '— select 1'}
              </span>
            )}
          </div>
          {viewMode !== 'price' && viewMode !== 'purchasing_power' && (
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="text-xs text-gray-500 hover:text-btc transition-colors"
              >
                {t(lang, 'select_all')}
              </button>
              <span className="text-gray-700">|</span>
              <button
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                {t(lang, 'clear_all')}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map(currency => {
            const isSelected = selectedCurrencies.includes(currency.code)
            return (
              <button
                key={currency.code}
                onClick={() => onCurrencyToggle(currency.code)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'text-white border-transparent'
                    : 'bg-[#1f1f1f] text-gray-500 border-[#333] hover:text-gray-300 hover:bg-[#2a2a2a]'
                }`}
                style={isSelected ? { backgroundColor: `${currency.color}22`, borderColor: currency.color, color: currency.color } : {}}
              >
                <span>{currency.flag}</span>
                <span>{currency.code}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
