'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DATE_RANGE_LABELS, type DateRange } from '@/lib/date-ranges'

const RANGES: DateRange[] = [
  'today',
  'yesterday',
  'this-week',
  'this-month',
  'this-year',
]

export default function RangeSelector({ current }: { current: DateRange }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`/admin/reports?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="range"
        className="text-sm font-medium text-brand-primary"
      >
        Zaman Aralığı:
      </label>
      <select
        id="range"
        value={current}
        onChange={handleChange}
        className="rounded-lg border border-brand-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
      >
        {RANGES.map((range) => (
          <option key={range} value={range}>
            {DATE_RANGE_LABELS[range]}
          </option>
        ))}
      </select>
    </div>
  )
}