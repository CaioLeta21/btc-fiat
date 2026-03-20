import type { Language } from '../types'
import { t } from '../i18n'

interface Props {
  selectedCurrencies: string[]
  lang: Language
}

export default function Disclaimer({ selectedCurrencies, lang }: Props) {
  const disclaimers: Array<{ key: string; title: string; body: string; type: 'warning' | 'error' }> = []

  if (selectedCurrencies.includes('ARS')) {
    disclaimers.push({
      key: 'ars',
      title: t(lang, 'disclaimer_ars_title'),
      body: t(lang, 'disclaimer_ars_body'),
      type: 'warning',
    })
  }

  if (disclaimers.length === 0) return null

  return (
    <div className="space-y-2">
      {disclaimers.map(d => (
        <div
          key={d.key}
          className={`rounded-xl border p-4 space-y-1 ${
            d.type === 'error'
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-yellow-500/5 border-yellow-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{d.type === 'error' ? '⚠️' : '💡'}</span>
            <span
              className={`text-sm font-medium ${
                d.type === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              {d.title}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed pl-6">{d.body}</p>
        </div>
      ))}
    </div>
  )
}
