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
