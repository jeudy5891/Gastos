const currencyFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount) {
  return currencyFormatter.format(amount ?? 0)
}

const dateFormatter = new Intl.DateTimeFormat('es-CR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(isoDate) {
  if (!isoDate) return ''
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`))
}

export function todayISODate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDaysISO(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

const shortDateFormatter = new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short' })

export function formatShortDate(isoDate) {
  if (!isoDate) return ''
  return shortDateFormatter.format(new Date(`${isoDate}T00:00:00`))
}

// Filtra registros con fecha y hora (created_at) por un rango de días,
// usando el día calendario local (no UTC) como límite.
export function isWithinDateRange(isoTimestamp, range) {
  if (!range) return true
  const [fy, fm, fd] = range.from.split('-').map(Number)
  const [ty, tm, td] = range.to.split('-').map(Number)
  const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0)
  const end = new Date(ty, tm - 1, td, 23, 59, 59, 999)
  const value = new Date(isoTimestamp)
  return value >= start && value <= end
}

// Filtra registros que ya son solo fecha (ej. payment_date), comparando
// directo como texto ISO (YYYY-MM-DD ordena igual que cronológicamente).
export function isDateOnlyWithinRange(isoDate, range) {
  if (!range) return true
  return isoDate >= range.from && isoDate <= range.to
}
