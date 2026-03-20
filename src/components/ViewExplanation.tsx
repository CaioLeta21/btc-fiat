import type { ViewMode, Language, ChartSeries } from '../types'
import { CURRENCIES } from '../constants'
import { t } from '../i18n'

interface Props {
  viewMode: ViewMode
  lang: Language
  series: ChartSeries[]
  startDate: string
  endDate: string
  selectedCurrencies: string[]
}

function formatPct(v: number, lang: Language): string {
  const n = Math.round(Math.abs(v))
  return lang === 'pt'
    ? `${n.toLocaleString('pt-BR')}%`
    : `${n.toLocaleString('en-US')}%`
}

function formatDate(dateStr: string, lang: Language): string {
  const [y, m] = dateStr.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, 1)
  if (lang === 'pt') {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function detectWindow(startDate: string, endDate: string, lang: Language): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  if (lang === 'pt') {
    if (diffYears <= 1.4) return '1 ano'
    if (diffYears <= 2.4) return '2 anos'
    if (diffYears <= 4) return '3 anos'
    if (diffYears <= 7) return '5 anos'
    if (diffYears <= 11) return '10 anos'
    return 'histórico completo'
  } else {
    if (diffYears <= 1.4) return '1 year'
    if (diffYears <= 2.4) return '2 years'
    if (diffYears <= 4) return '3 years'
    if (diffYears <= 7) return '5 years'
    if (diffYears <= 11) return '10 years'
    return 'full history'
  }
}

// Correct pluralization for currency names in Portuguese
function pluralizePt(name: string): string {
  const map: Record<string, string> = {
    'Real': 'Reais',
    'Peso': 'Pesos',
    'Dólar': 'Dólares',
    'Yuan': 'Yuans',
    'Iene': 'Ienes',
    'Lira': 'Liras',
  }
  return map[name] ?? name + 's'
}

function buildPurchasingPowerText(
  currencyCode: string,
  series: ChartSeries[],
  startDate: string,
  endDate: string,
  lang: Language
): string {
  const currencyConfig = CURRENCIES.find(c => c.code === currencyCode)
  if (!currencyConfig) return ''

  const btcSeries = series.find(s => s.id === currencyCode)
  const cpiSeries = series.find(s => s.id === `${currencyCode}_cpi`)

  if (!btcSeries || btcSeries.data.length === 0) return ''

  const btcEnd = btcSeries.data[btcSeries.data.length - 1].value
  const btcGainPct = btcEnd - 100

  const cpiEnd = cpiSeries && cpiSeries.data.length > 0
    ? cpiSeries.data[cpiSeries.data.length - 1].value
    : null
  const inflationPct = cpiEnd !== null ? cpiEnd - 100 : null

  const window = detectWindow(startDate, endDate, lang)
  const from = formatDate(startDate, lang)
  const to = formatDate(endDate, lang)

  const countryName = lang === 'pt' ? currencyConfig.country.pt : currencyConfig.country.en
  const currencyNameRaw = lang === 'pt' ? currencyConfig.name.pt : currencyConfig.name.en
  const currencyPlural = lang === 'pt' ? pluralizePt(currencyNameRaw) : currencyNameRaw + 's'

  if (lang === 'pt') {
    const windowPhrase = `Nos últimos ${window} (${from} a ${to})`

    if (inflationPct === null) {
      return `${windowPhrase}, o Bitcoin valorizou ${formatPct(btcGainPct, lang)} em ${currencyPlural}. Não há dados de inflação disponíveis para ${countryName} nesse período para comparação.`
    }

    const btcProtegeu = btcGainPct > inflationPct
    const diff = Math.abs(btcGainPct - inflationPct)

    if (btcProtegeu) {
      if (inflationPct <= 0) {
        return `${windowPhrase}, o Bitcoin valorizou ${formatPct(btcGainPct, lang)} em ${currencyPlural} enquanto a inflação em ${countryName} foi praticamente zero ou negativa. O Bitcoin entregou retorno real expressivo nessa janela.`
      }
      return `${windowPhrase}, o Bitcoin valorizou ${formatPct(btcGainPct, lang)} em ${currencyPlural}, enquanto a inflação acumulada em ${countryName} foi de ${formatPct(inflationPct, lang)}. O Bitcoin superou a inflação em ${formatPct(diff, lang)}, preservando e multiplicando o poder de compra de quem optou por essa reserva de valor.`
    } else {
      if (btcGainPct < 0) {
        return `${windowPhrase}, o Bitcoin caiu ${formatPct(Math.abs(btcGainPct), lang)} em ${currencyPlural} enquanto a inflação acumulada em ${countryName} foi de ${formatPct(inflationPct, lang)}. Nessa janela específica, o Bitcoin não protegeu o poder de compra: quem saiu ficou atrás da inflação em ${formatPct(diff, lang)}.`
      }
      return `${windowPhrase}, o Bitcoin valorizou ${formatPct(btcGainPct, lang)} em ${currencyPlural}, mas a inflação acumulada em ${countryName} foi de ${formatPct(inflationPct, lang)}. Nessa janela, o Bitcoin não foi suficiente para proteger o poder de compra: a inflação correu mais rápido que a valorização do Bitcoin em ${formatPct(diff, lang)}.`
    }
  } else {
    const windowPhrase = `Over the last ${window} (${from} to ${to})`

    if (inflationPct === null) {
      return `${windowPhrase}, Bitcoin appreciated ${formatPct(btcGainPct, lang)} in ${currencyPlural}. No inflation data is available for ${countryName} in this period for comparison.`
    }

    const btcProtegeu = btcGainPct > inflationPct
    const diff = Math.abs(btcGainPct - inflationPct)

    if (btcProtegeu) {
      if (inflationPct <= 0) {
        return `${windowPhrase}, Bitcoin appreciated ${formatPct(btcGainPct, lang)} in ${currencyPlural} while inflation in ${countryName} was near zero or negative. Bitcoin delivered strong real returns in this window.`
      }
      return `${windowPhrase}, Bitcoin appreciated ${formatPct(btcGainPct, lang)} in ${currencyPlural}, while accumulated inflation in ${countryName} was ${formatPct(inflationPct, lang)}. Bitcoin outpaced inflation by ${formatPct(diff, lang)}, preserving and multiplying the purchasing power of those who chose this store of value.`
    } else {
      if (btcGainPct < 0) {
        return `${windowPhrase}, Bitcoin fell ${formatPct(Math.abs(btcGainPct), lang)} in ${currencyPlural} while accumulated inflation in ${countryName} was ${formatPct(inflationPct, lang)}. In this specific window, Bitcoin did not protect purchasing power: holders fell behind inflation by ${formatPct(diff, lang)}.`
      }
      return `${windowPhrase}, Bitcoin appreciated ${formatPct(btcGainPct, lang)} in ${currencyPlural}, but accumulated inflation in ${countryName} was ${formatPct(inflationPct, lang)}. In this window, Bitcoin was not enough to protect purchasing power: inflation outpaced Bitcoin's appreciation by ${formatPct(diff, lang)}.`
    }
  }
}

export default function ViewExplanation({
  viewMode,
  lang,
  series,
  startDate,
  endDate,
  selectedCurrencies,
}: Props) {
  if (viewMode !== 'return' && viewMode !== 'purchasing_power') return null

  const titleKey = viewMode === 'return' ? 'explain_return_title' : 'explain_pp_title'
  const bodyKey = viewMode === 'return' ? 'explain_return_body' : 'explain_pp_body'

  const currencyCode = selectedCurrencies[0]

  const dynamicText = viewMode === 'purchasing_power'
    ? buildPurchasingPowerText(currencyCode, series, startDate, endDate, lang)
    : null

  return (
    <div className="card p-4 space-y-3 border-l-2 border-btc/40">
      <div>
        <p className="text-xs text-btc/70 font-medium uppercase tracking-wider mb-1">
          {t(lang, titleKey)}
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          {t(lang, bodyKey)}
        </p>
      </div>

      {dynamicText && (
        <div className="pt-2 border-t border-[#222]">
          <p className="text-sm text-gray-300 leading-relaxed">
            {dynamicText}
          </p>
        </div>
      )}
    </div>
  )
}
