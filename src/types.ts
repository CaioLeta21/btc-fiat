export type ViewMode = 'price' | 'return' | 'purchasing_power' | 'm2'
export type Language = 'pt' | 'en'

export interface DataPoint {
  time: string // 'YYYY-MM-DD'
  value: number
}

export interface ChartSeries {
  id: string
  label: string
  color: string
  data: DataPoint[]
  dashed?: boolean
}

export interface CurrencyConfig {
  code: string
  flag: string
  color: string
  name: Record<Language, string>
  country: Record<Language, string>
  coingeckoCode: string
  worldBankCode: string
  fredM2?: string | null
  hasBlueMarket?: boolean
  hasRedenominations?: boolean
  disclaimer?: 'ars'
}

export interface Callout {
  currencyCode: string
  flag: string
  country: Record<Language, string>
  color: string
  startValue: number
  endValue: number
  multiplier: number
  isPositive: boolean
}

export interface FetchState {
  loading: boolean
  error: string | null
}
