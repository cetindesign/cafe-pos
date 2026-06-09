'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DATE_RANGE_LABELS, type DateRange } from '@/lib/date-ranges'

const RANGES: DateRange[] = [
  'today',
  'yesterday',
  'this-week',
  'this-month',
  'this-year',
]

export default function RangeSelector({
  current,
  customStart,
  customEnd,
}: {
  current: DateRange
  customStart?: string
  customEnd?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Uygulanmış mod tamamen URL'den türetilir: start & end varsa özel moddayız.
  const isCustom = Boolean(customStart && customEnd)

  // Dropdown'da "Özel Aralık" seçilince tarih alanlarını göstermek için
  // küçük bir UI bayrağı. Uygulanan (kalıcı) filtre yine URL'dir.
  const [showCustom, setShowCustom] = useState(isCustom)

  // Tarih input'larının yerel durumu SADECE "Uygula" öncesi geçici buffer'dır.
  const [start, setStart] = useState(customStart ?? '')
  const [end, setEnd] = useState(customEnd ?? '')

  // URL değişince UI'ı senkronla (preset'e geçince buffer'ı temizle, modu yansıt).
  useEffect(() => {
    setStart(customStart ?? '')
    setEnd(customEnd ?? '')
    setShowCustom(isCustom)
  }, [customStart, customEnd, isCustom])

  // Başlangıç bitişten sonra mı? (her ikisi de doluysa kontrol et)
  const invalid = start !== '' && end !== '' && start > end

  // Dropdown değişimi: "Özel Aralık" seçilince tarih alanlarını aç (URL'i Uygula
  // güncelleyecek); bir preset seçilince range'i yaz, özel aralık paramlarını sil.
  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    params.delete('start')
    params.delete('end')
    router.push(`/admin/reports?${params.toString()}`)
  }

  // Özel aralığı uygula: start/end'i yaz, preset'i sil (modu devral).
  function handleApply() {
    if (!start || !end || invalid) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('start', start)
    params.set('end', end)
    params.delete('range')
    router.push(`/admin/reports?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex items-center gap-3">
        <label
          htmlFor="range"
          className="text-sm font-medium text-brand-primary"
        >
          Zaman Aralığı:
        </label>
        <select
          id="range"
          value={showCustom ? 'custom' : current}
          onChange={handleSelectChange}
          className="rounded-lg border border-brand-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
        >
          {RANGES.map((range) => (
            <option key={range} value={range}>
              {DATE_RANGE_LABELS[range]}
            </option>
          ))}
          <option value="custom">Özel Aralık</option>
        </select>
      </div>

      {/* Tarih alanları yalnızca "Özel Aralık" seçiliyken görünür */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Başlangıç tarihi"
            className="rounded-lg border border-brand-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
          />
          <span className="text-sm text-neutral-400">–</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="Bitiş tarihi"
            className="rounded-lg border border-brand-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={!start || !end || invalid}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            Uygula
          </button>
        </div>
      )}

      {showCustom && invalid && (
        <p className="text-xs text-red-600">
          Başlangıç tarihi bitiş tarihinden sonra olamaz.
        </p>
      )}
    </div>
  )
}
