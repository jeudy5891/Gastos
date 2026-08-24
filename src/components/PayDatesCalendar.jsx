import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDate } from '../lib/format'
import { MESES, DIAS, toISODate, buildMonthGrid } from '../lib/calendarGrid'
import Modal from './Modal'

export default function PayDatesCalendar({ onClose }) {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('pay_periods')
        .select('mes, quincena, pay_date')
        .order('pay_date', { ascending: true })
      setPeriods(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const periodByDate = new Map(periods.map((period) => [period.pay_date, period]))
  const cells = buildMonthGrid(viewDate)
  const periodsInMonth = periods.filter((period) => {
    const [year, month] = period.pay_date.split('-').map(Number)
    return year === viewDate.getFullYear() && month - 1 === viewDate.getMonth()
  })

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
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
          const period = periodByDate.get(iso)
          return (
            <div
              key={iso}
              title={period ? `${period.mes} · Quincena ${period.quincena}` : undefined}
              className="aspect-square flex items-center justify-center"
            >
              {period ? (
                <span className="w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-sm font-bold">
                  ₡
                </span>
              ) : (
                <span className="text-sm text-gray-700">{date.getDate()}</span>
              )}
            </div>
          )
        })}
      </div>

      {!loading && (
        <div className="mt-4 space-y-1">
          {periodsInMonth.length === 0 ? (
            <p className="text-sm text-gray-400">Sin fechas de pago este mes.</p>
          ) : (
            periodsInMonth.map((period) => (
              <p key={period.pay_date} className="text-sm text-gray-600 capitalize">
                {formatDate(period.pay_date)} — {period.mes} · Quincena {period.quincena}
              </p>
            ))
          )}
        </div>
      )}
    </Modal>
  )
}
