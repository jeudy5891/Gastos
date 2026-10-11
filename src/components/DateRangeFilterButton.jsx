import { useState } from 'react'
import Modal from './Modal'
import DatePicker from './DatePicker'
import { formatDate, formatShortDate, todayISODate } from '../lib/format'
import { matchesFilter } from '../lib/filters'

// `fields` (opcional): filtros tipo select que dependen en cascada de la fecha
// y de los anteriores, ej. [{ key, label, options: [{ value, label }], getValue }].
// Requiere `items` y `getDate` para calcular qué opciones quedan disponibles.
// Sin `fields`, el valor es { from, to } o null (solo rango de fechas).
export default function DateRangeFilterButton({
  value,
  onChange,
  label = 'Filtrar por fecha',
  fields = [],
  items = [],
  getDate,
}) {
  const hasFields = fields.length > 0
  const [showModal, setShowModal] = useState(false)
  const [draft, setDraft] = useState({})
  const [pickerField, setPickerField] = useState(null)

  function openModal() {
    if (hasFields) {
      setDraft({ ...value })
    } else {
      setDraft({ from: value?.from || todayISODate(), to: value?.to || todayISODate() })
    }
    setShowModal(true)
  }

  // Al cambiar un criterio, se limpian los selects posteriores que ya no tengan registros.
  function updateDraft(key, newValue) {
    const next = { ...draft, [key]: newValue }
    fields.forEach((field, index) => {
      if (!next[field.key]) return
      const available = items.some(
        (item) =>
          matchesFilter(item, next, { getDate, fields }, index) &&
          String(field.getValue(item)) === next[field.key]
      )
      if (!available) next[field.key] = ''
    })
    setDraft(next)
  }

  function apply() {
    if (!hasFields) {
      onChange({ from: draft.from, to: draft.to })
    } else {
      const result = Object.fromEntries(Object.entries(draft).filter(([, v]) => v))
      onChange(Object.keys(result).length > 0 ? result : null)
    }
    setShowModal(false)
  }

  function clear() {
    onChange(null)
    setShowModal(false)
  }

  let buttonText = label
  if (value && !hasFields) {
    buttonText = `${formatShortDate(value.from)} – ${formatShortDate(value.to)}`
  } else if (value) {
    const activeCount = (value.from || value.to ? 1 : 0) + fields.filter((field) => value[field.key]).length
    buttonText = `${label} (${activeCount})`
  }

  function renderDateField(key, title) {
    return (
      <div className="space-y-1">
        <span className="text-sm text-gray-600">{title}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPickerField(key)}
            className={`flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base text-left bg-white capitalize ${
              draft[key] ? '' : 'text-gray-400'
            }`}
          >
            {draft[key] ? formatDate(draft[key]) : 'Cualquier fecha'}
          </button>
          {hasFields && draft[key] && (
            <button
              type="button"
              onClick={() => updateDraft(key, '')}
              aria-label={`Limpiar ${title}`}
              className="rounded-lg border border-gray-300 px-3 text-gray-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap ${
          value ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-700'
        }`}
      >
        {buttonText}
      </button>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <p className="font-semibold text-gray-800 mb-3">{label}</p>

          <div className="space-y-3">
            {renderDateField('from', 'Desde')}
            {renderDateField('to', 'Hasta')}

            {fields.map((field, index) => {
              const availableValues = new Set(
                items
                  .filter((item) => matchesFilter(item, draft, { getDate, fields }, index))
                  .map((item) => String(field.getValue(item)))
              )
              return (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm text-gray-600" htmlFor={`filter-${field.key}`}>
                    {field.label}
                  </label>
                  <select
                    id={`filter-${field.key}`}
                    value={draft[field.key] || ''}
                    onChange={(event) => updateDraft(field.key, event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-white"
                  >
                    <option value="">Todos</option>
                    {field.options
                      .filter((option) => availableValues.has(option.value))
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={clear}
              className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700"
            >
              Quitar filtro
            </button>
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded-lg bg-blue-600 text-white py-3 font-medium"
            >
              Aplicar
            </button>
          </div>
        </Modal>
      )}

      {pickerField && (
        <DatePicker
          value={draft[pickerField]}
          onChange={(date) => {
            updateDraft(pickerField, date)
            setPickerField(null)
          }}
          onClose={() => setPickerField(null)}
        />
      )}
    </>
  )
}
