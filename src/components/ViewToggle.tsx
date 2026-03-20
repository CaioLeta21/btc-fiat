import type { ViewMode, Language } from '../types'
import { t } from '../i18n'

interface Props {
  value: ViewMode
  onChange: (v: ViewMode) => void
  lang: Language
}

export default function ViewToggle({ value, onChange, lang }: Props) {
  const views: { id: ViewMode; icon: string; label: string }[] = [
    { id: 'price', icon: '₿', label: t(lang, 'view_price') },
    { id: 'return', icon: '📈', label: t(lang, 'view_return') },
    { id: 'purchasing_power', icon: '🛒', label: t(lang, 'view_purchasing_power') },
    { id: 'm2', icon: '🖨️', label: t(lang, 'view_m2') },
  ]

  const descriptions: Record<ViewMode, string> = {
    price: t(lang, 'desc_price'),
    return: t(lang, 'desc_return'),
    purchasing_power: t(lang, 'desc_purchasing_power'),
    m2: t(lang, 'desc_m2'),
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              value === v.id
                ? 'bg-btc text-black shadow-lg shadow-btc/20'
                : 'bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#333]'
            }`}
          >
            <span className="text-base">{v.icon}</span>
            <span className="hidden sm:inline">{v.label}</span>
            <span className="sm:hidden">{v.label.split(' ').slice(0, 2).join(' ')}</span>
          </button>
        ))}
      </div>
      <p className="text-gray-500 text-sm">{descriptions[value]}</p>
    </div>
  )
}
