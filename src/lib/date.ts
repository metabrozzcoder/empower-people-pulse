// Unified date formatting: dd/MMM/yyyy (e.g., 01/Jan/2025)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function toDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v as string | number)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(v: unknown): string {
  const d = toDate(v); if (!d) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mmm = MONTHS[d.getMonth()]
  return `${dd}/${mmm}/${d.getFullYear()}`
}

export function formatDateTime(v: unknown): string {
  const d = toDate(v); if (!d) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)} ${hh}:${mi}`
}

export function formatTime(v: unknown): string {
  const d = toDate(v); if (!d) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mi}`
}

export function formatMonthYear(v: unknown): string {
  const d = toDate(v); if (!d) return '—'
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
