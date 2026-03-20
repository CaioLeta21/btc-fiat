import type { Language } from '../types'
import { CURRENCY_MAP } from '../constants'
import { t } from '../i18n'

interface Props {
  loadingCurrencies: string[]
  lang: Language
}

export default function LoadingOverlay({ loadingCurrencies, lang }: Props) {
  if (loadingCurrencies.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="w-3.5 h-3.5 border-2 border-btc border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-gray-500">{t(lang, 'loading_currency')}:</span>
      {loadingCurrencies.map(code => {
        const c = CURRENCY_MAP[code]
        return (
          <span key={code} className="text-xs text-gray-400">
            {c?.flag} {code}
          </span>
        )
      })}
    </div>
  )
}
