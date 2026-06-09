export type DateRange = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'this-year'

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Bugün',
  yesterday: 'Dün',
  'this-week': 'Bu Hafta',
  'this-month': 'Bu Ay',
  'this-year': 'Bu Yıl',
}

/**
 * Verilen aralık adına göre başlangıç ve bitiş zamanlarını döndürür.
 * Tüm tarihler kullanıcının yerel saatine göre hesaplanır,
 * sonra ISO string olarak Supabase'e gönderilir.
 */
export function getDateRange(range: DateRange): {
  start: string
  end: string
} {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break

    case 'yesterday':
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break

    case 'this-week': {
      // Pazartesi'yi haftanın başlangıcı say
      const day = start.getDay() // 0 = Pazar, 1 = Pazartesi, ...
      const diff = day === 0 ? 6 : day - 1
      start.setDate(start.getDate() - diff)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    }

    case 'this-month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break

    case 'this-year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export function isValidDateRange(value: string): value is DateRange {
  return ['today', 'yesterday', 'this-week', 'this-month', 'this-year'].includes(
    value
  )
}

// Özel aralık başlığında kullanılan kısa Türkçe ay adları
const SHORT_MONTHS = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
]

/**
 * Bir değerin geçerli bir "YYYY-MM-DD" tarihi olup olmadığını kontrol eder.
 * Hem format hem de takvimsel geçerlilik (örn. 2026-02-31 geçersiz) doğrulanır.
 */
export function isValidDateParam(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Kullanıcının seçtiği özel başlangıç/bitiş tarihlerini ISO string'lere çevirir.
 * Aralık dahildir (inclusive): başlangıç günün başı (00:00:00),
 * bitiş ise günün sonu (23:59:59.999). Yerel saate göre hesaplanır.
 */
export function getCustomDateRange(
  startParam: string,
  endParam: string
): { start: string; end: string } {
  const [sy, sm, sd] = startParam.split('-').map(Number)
  const [ey, em, ed] = endParam.split('-').map(Number)

  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0)
  const end = new Date(ey, em - 1, ed, 23, 59, 59, 999)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Özel aralık için sayfa başlığında gösterilecek etiketi üretir.
 * Örnek: "5 Haz – 9 Haz".
 */
export function formatCustomRangeLabel(
  startParam: string,
  endParam: string
): string {
  const label = (value: string) => {
    const [, month, day] = value.split('-').map(Number)
    return `${day} ${SHORT_MONTHS[month - 1]}`
  }
  return `${label(startParam)} – ${label(endParam)}`
}