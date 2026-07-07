// Unified date formatting with a user-selectable preference.
// Default: dd/MMM/yyyy (e.g., 01/Jan/2025)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export type DateFormat = 'dd/mmm/yyyy' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd'
export type TimeFormat = '12' | '24'

const DATE_KEY = 'ark:dateFormat'
const TIME_KEY = 'ark:timeFormat'

export function getDateFormat(): DateFormat {
  if (typeof window === 'undefined') return 'dd/mmm/yyyy'
  const v = window.localStorage.getItem(DATE_KEY) as DateFormat | null
  return v ?? 'dd/mmm/yyyy'
}
export function setDateFormat(f: DateFormat) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DATE_KEY, f)
  window.dispatchEvent(new Event('ark:date-format-changed'))
}
export function getTimeFormat(): TimeFormat {
  if (typeof window === 'undefined') return '24'
  const v = window.localStorage.getItem(TIME_KEY) as TimeFormat | null
  return v ?? '24'
}
export function setTimeFormat(f: TimeFormat) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TIME_KEY, f)
  window.dispatchEvent(new Event('ark:date-format-changed'))
}

function toDate(v: unknown): Date | null {
  if (v === undefined) return new Date()
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v as string | number)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(v?: unknown, fmt: DateFormat = getDateFormat()): string {
  const d = toDate(v); if (!d) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const mmm = MONTHS[d.getMonth()]
  const yyyy = d.getFullYear()
  switch (fmt) {
    case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`
    case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`
    case 'yyyy-mm-dd': return `${yyyy}-${mm}-${dd}`
    case 'dd/mmm/yyyy':
    default: return `${dd}/${mmm}/${yyyy}`
  }
}

export function formatDateTime(v?: unknown): string {
  const d = toDate(v); if (!d) return '—'
  return `${formatDate(d)} ${formatTime(d)}`
}

export function formatTime(v?: unknown): string {
  const d = toDate(v); if (!d) return '—'
  const tf = getTimeFormat()
  let h = d.getHours()
  const mi = String(d.getMinutes()).padStart(2, '0')
  if (tf === '12') {
    const suffix = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${String(h).padStart(2, '0')}:${mi} ${suffix}`
  }
  return `${String(h).padStart(2, '0')}:${mi}`
}

export function getCurrentLocale(): string {
  if (typeof document !== 'undefined') {
    const l = document.documentElement.getAttribute('lang')
    if (l) return l
  }
  if (typeof window !== 'undefined') {
    const l = window.localStorage.getItem('app_language')
    if (l) return l
  }
  return 'en'
}

export function formatMonthYear(v?: unknown, locale: string = getCurrentLocale()): string {
  const d = toDate(v); if (!d) return '—'
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
}
