import { useState } from 'react'
import Modal from './Modal'
import { MESES, DIAS, toISODate, buildMonthGrid } from '../lib/calendarGrid'

export default function DatePicker({ value, onChange, onClose }) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date()
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1))

  const todayISO = toISODate(new Date())
  const cells = buildMonthGrid(viewDate)

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  function selectDay(date) {
    onChange(toISODate(date))
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mes anterior"
          className="p-2 text-gray-500 text-lg"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-800">
          {MESES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Mes siguiente"
          className="p-2 text-gray-500 text-lg"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {DIAS.map((dia, index) => (
          <span key={`${dia}-${index}`}>{dia}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />
          const iso = toISODate(date)
          const isSelected = iso === value
          const isToday = iso === todayISO
          return (
            <button
              key={iso}
              type="button"
              onClick={() => selectDay(date)}
              className={`aspect-square rounded-lg text-sm flex items-center justify-center ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isToday
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
