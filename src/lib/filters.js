import { isWithinDateRange } from './format'

// Indica si un registro cumple el filtro: fechas (cada extremo opcional) y
// los selects de `fields` hasta `upTo` (exclusivo), en el orden en que vienen.
export function matchesFilter(item, filter, { getDate, fields }, upTo = fields.length) {
  if (!filter) return true
  if (filter.from || filter.to) {
    const range = { from: filter.from || '1900-01-01', to: filter.to || '2999-12-31' }
    if (!isWithinDateRange(getDate(item), range)) return false
  }
  return fields
    .slice(0, upTo)
    .every((field) => !filter[field.key] || String(field.getValue(item)) === filter[field.key])
}
