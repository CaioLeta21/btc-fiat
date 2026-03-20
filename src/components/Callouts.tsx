import type { Callout, ViewMode, Language } from '../types'
import { t } from '../i18n'

interface Props {
  callouts: Callout[]
  viewMode: ViewMode
  lang: Language
  startDate: string
}

function formatMultiplier(m: number, lang: Language): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}k×`
  if (m >= 100) return `${m.toFixed(0)}×`
  if (m >= 10) return `${m.toFixed(1)}×`
  return `${m.toFixed(2)}×`
}

function formatPct(m: number): string {
  const pct = (m - 1) * 100
  if (pct >= 100000) return `+${(pct / 1000).toFixed(0)}k%`
  if (pct > 0) return `+${pct.toFixed(0)}%`
  return `${pct.toFixed(1)}%`
}

function formatPrice(value: number, code: string): string {
  const isLarge = value >= 1_000_000
  const isMedium = value >= 1_000
  if (isLarge) return `${(value / 1_000_000).toFixed(2)}M`
  if (isMedium) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(2)
}

export default function Callouts({ callouts, viewMode, lang, startDate }: Props) {
  if (callouts.length === 0) return null

  const year = startDate.slice(0, 4)

  const title = {
    price: t(lang, 'callout_title_price'),
    return: t(lang, 'callout_title_return'),
    purchasing_power: t(lang, 'callout_title_pp'),
    m2: t(lang, 'callout_title_m2'),
  }[viewMode]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider px-1">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {callouts.map(c => {
          const pct = formatPct(c.multiplier)
          const mult = formatMultiplier(c.multiplier, lang)
          const isNegative = c.multiplier < 1

          return (
            <div
              key={c.currencyCode}
              className="card p-3 space-y-1.5 hover:border-[#333] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="text-xs text-gray-500 font-medium">{c.currencyCode}</span>
                </div>
                <span
                  className="text-xs font-bold"
                  style={{ color: isNegative ? '#ef4444' : '#22c55e' }}
                >
                  {pct}
                </span>
              </div>

              <div>
                <div className="text-xs text-gray-600">
                  {lang === 'pt' ? `Desde ${year}` : `Since ${year}`}
                </div>
                <div
                  className="text-base font-bold"
                  style={{ color: c.color }}
                >
                  {mult}
                </div>
              </div>

              {viewMode === 'return' && (
                <div className="text-xs text-gray-600 border-t border-[#222] pt-1.5">
                  {lang === 'pt' ? 'R$100 →' : '$100 →'}{' '}
                  <span className="text-gray-300 font-medium">
                    R${formatPrice(100 * c.multiplier, c.currencyCode)}
                  </span>
                </div>
              )}

              {viewMode === 'price' && (
                <div className="text-xs text-gray-600 border-t border-[#222] pt-1.5">
                  <span className="text-gray-400">
                    {formatPrice(c.startValue, c.currencyCode)} → {formatPrice(c.endValue, c.currencyCode)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
