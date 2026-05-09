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