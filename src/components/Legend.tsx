import type { ChartSeries, Language } from '../types'

interface Props {
  series: ChartSeries[]
  lang: Language
}

export default function Legend({ series, lang }: Props) {
  if (series.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {series.map(s => (
        <div key={s.id} className="flex items-center gap-1.5">
          <div
            className="w-5 h-0.5 rounded-full"
            style={{
              backgroundColor: s.color,
              borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
              background: s.dashed ? 'none' : s.color,
            }}
          >
            {s.dashed && (
              <svg width="20" height="2" viewBox="0 0 20 2">
                <line
                  x1="0" y1="1" x2="20" y2="1"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />
              </svg>
            )}
          </div>
          <span className="text-xs text-gray-400">{s.label}</span>
        </div>
      ))}
    </div>
  )
}
