import { useState } from 'react'
import Modal from './Modal'
import DatePicker from './DatePicker'
import { formatDate, formatShortDate, todayISODate } from '../lib/format'

export default function DateRangeFilterButton({ value, onChange }) {
  const [showModal, setShowModal] = useState(false)
  const [from, setFrom] = useState(value?.from || todayISODate())
  const [to, setTo] = useState(value?.to || todayISODate())
  const [pickerField, setPickerField] = useState(null)

  function openModal() {
    setFrom(value?.from || todayISODate())
    setTo(value?.to || todayISODate())
    setShowModal(true)
  }

  function apply() {
    onChange({ from, to })
    setShowModal(false)
  }

  function clear() {
    onChange(null)
    setShowModal(false)
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
        {value ? `${formatShortDate(value.from)} – ${formatShortDate(value.to)}` : 'Filtrar por fecha'}
      </button>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <p className="font-semibold text-gray-800 mb-3">Filtrar por fecha</p>

          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-sm text-gray-600">Desde</span>
              <button
                type="button"
                onClick={() => setPickerField('from')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-left bg-white capitalize"
              >
                {formatDate(from)}
              </button>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-600">Hasta</span>
              <button
                type="button"
                onClick={() => setPickerField('to')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-left bg-white capitalize"
              >
                {formatDate(to)}
              </button>
            </div>
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
          value={pickerField === 'from' ? from : to}
          onChange={(date) => {
            if (pickerField === 'from') setFrom(date)
            else setTo(date)
            setPickerField(null)
          }}
          onClose={() => setPickerField(null)}
        />
      )}
    </>
  )
}
