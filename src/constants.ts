import type { CurrencyConfig } from './types'

export const CURRENCIES: CurrencyConfig[] = [
  {
    code: 'BRL',
    flag: '🇧🇷',
    color: '#22c55e',
    name: { pt: 'Real', en: 'Real' },
    country: { pt: 'Brasil', en: 'Brazil' },
    coingeckoCode: 'brl',
    worldBankCode: 'BR',
    fredM2: 'MABMM301BRM189S',
  },
  {
    code: 'ARS',
    flag: '🇦🇷',
    color: '#3b82f6',
    name: { pt: 'Peso', en: 'Peso' },
    country: { pt: 'Argentina', en: 'Argentina' },
    coingeckoCode: 'ars',
    worldBankCode: 'AR',
    fredM2: null,
    hasBlueMarket: true,
    disclaimer: 'ars',
  },
  {
    code: 'USD',
    flag: '🇺🇸',
    color: '#9ca3af',
    name: { pt: 'Dólar', en: 'Dollar' },
    country: { pt: 'EUA', en: 'USA' },
    coingeckoCode: 'usd',
    worldBankCode: 'US',
    fredM2: 'M2SL',
  },
  {
    code: 'CNY',
    flag: '🇨🇳',
    color: '#ec4899',
    name: { pt: 'Yuan', en: 'Yuan' },
    country: { pt: 'China', en: 'China' },
    coingeckoCode: 'cny',
    worldBankCode: 'CN',
    fredM2: 'MABMM301CNM189S',
  },
  {
    code: 'JPY',
    flag: '🇯🇵',
    color: '#06b6d4',
    name: { pt: 'Iene', en: 'Yen' },
    country: { pt: 'Japão', en: 'Japan' },
    coingeckoCode: 'jpy',
    worldBankCode: 'JP',
    fredM2: 'MABMM301JPM189S',
  },
  {
    code: 'TRY',
    flag: '🇹🇷',
    color: '#84cc16',
    name: { pt: 'Lira', en: 'Lira' },
    country: { pt: 'Turquia', en: 'Turkey' },
    coingeckoCode: 'try',
    worldBankCode: 'TR',
    fredM2: 'MABMM301TRM189S',
  },
]

export const DEFAULT_SELECTED = ['BRL', 'ARS', 'USD', 'TRY']

const _start = new Date()
_start.setFullYear(_start.getFullYear() - 5)
export const DEFAULT_START = _start.toISOString().split('T')[0]
export const DEFAULT_END = new Date().toISOString().split('T')[0]

export const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c]))
