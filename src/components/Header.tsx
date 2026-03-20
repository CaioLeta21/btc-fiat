import type { Language } from '../types'
import { t } from '../i18n'

interface Props {
  lang: Language
  onLangChange: (lang: Language) => void
}

export default function Header({ lang, onLangChange }: Props) {
  return (
    <header className="border-b border-[#262626] bg-[#0d0d0d]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-btc flex items-center justify-center text-black font-bold text-sm">
            ₿
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-none">
              {t(lang, 'title')}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
              letabuild.com
            </p>
          </div>
        </div>

        <button
          onClick={() => onLangChange(lang === 'pt' ? 'en' : 'pt')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f1f] border border-[#333] text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-all"
        >
          <span className="text-base">{lang === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
          <span className="font-medium">{lang === 'pt' ? 'PT' : 'EN'}</span>
          <span className="text-gray-600">→</span>
          <span>{lang === 'pt' ? 'EN' : 'PT'}</span>
        </button>
      </div>
    </header>
  )
}
