import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatDate } from '../lib/format'
import { MESES, DIAS, toISODate, buildMonthGrid } from '../lib/calendarGrid'

export default function Calendario() {
  const [periods, setPeriods] = useState([])
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: periodsData }, { data: pendientesData }] = await Promise.all([
        supabase.from('pay_periods').select('mes, quincena, pay_date').order('pay_date', { ascending: true }),
        supabase.from('pendientes').select('titulo, amount, due_date').order('due_date', { ascending: true }),
      ])
      setPeriods(periodsData || [])
      setPendientes(pendientesData || [])
      setLoading(false)
    }
    load()
  }, [])

  const periodByDate = new Map(periods.map((period) => [period.pay_date, period]))
  const pendientesByDate = new Map()
  pendientes.forEach((pendiente) => {
    const list = pendientesByDate.get(pendiente.due_date) || []
    list.push(pendiente)
    pendientesByDate.set(pendiente.due_date, list)
  })

  const cells = buildMonthGrid(viewDate)
  const todayISO = toISODate(new Date())
  const periodsInMonth = periods.filter((period) => {
    const [year, month] = period.pay_date.split('-').map(Number)
    return year === viewDate.getFullYear() && month - 1 === viewDate.getMonth()
  })
  const pendientesInMonth = pendientes.filter((pendiente) => {
    const [year, month] = pendiente.due_date.split('-').map(Number)
    return year === viewDate.getFullYear() && month - 1 === viewDate.getMonth()
  })

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-800">Calendario</h1>

      <div className="bg-white rounded-2xl shadow-sm p-4">
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
            const pendientesDelDia = pendientesByDate.get(iso)
            const hasPendiente = Boolean(pendientesDelDia?.length)
            const isToday = iso === todayISO

            let circleClass = 'w-7 h-7 rounded-full flex items-center justify-center text-sm relative '
            let content
            if (period) {
              circleClass += 'bg-yellow-400 text-gray-900 font-bold'
              content = '₡'
            } else if (hasPendiente) {
              circleClass += 'bg-orange-400 text-white font-semibold'
              content = date.getDate()
            } else if (isToday) {
              circleClass += 'bg-blue-600 text-white font-semibold'
              content = date.getDate()
            } else {
              circleClass += 'text-gray-700'
              content = date.getDate()
            }
            if (isToday && (period || hasPendiente)) {
              circleClass += ' ring-2 ring-blue-600'
            }

            const titleParts = []
            if (period) titleParts.push(`${period.mes} · Quincena ${period.quincena}`)
            if (hasPendiente) {
              titleParts.push(...pendientesDelDia.map((p) => `Pendiente: ${p.titulo}`))
            }

            return (
              <div
                key={iso}
                title={titleParts.length ? titleParts.join(' / ') : undefined}
                className="aspect-square flex items-center justify-center"
              >
                <span className={circleClass}>
                  {content}
                  {period && hasPendiente && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
                  )}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Fecha de pago
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Pendiente
          </span>
        </div>
      </div>

      {!loading && (
        <div className="space-y-3">
          <div className="space-y-1">
            {periodsInMonth.length === 0 ? (
              <p className="text-sm text-gray-400">Sin fechas de pago este mes.</p>
            ) : (
              periodsInMonth.map((period) => (
                <div key={period.pay_date} className="flex items-center gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-xs font-bold">
                    ₡
                  </span>
                  <p className="text-sm text-gray-600 capitalize">
                    {formatDate(period.pay_date)} — {period.mes} · Quincena {period.quincena}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-1">
            {pendientesInMonth.length === 0 ? (
              <p className="text-sm text-gray-400">Sin pendientes este mes.</p>
            ) : (
              pendientesInMonth.map((pendiente, index) => (
                <div key={`${pendiente.due_date}-${index}`} className="flex items-center gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-orange-400 text-white flex items-center justify-center text-xs font-bold">
                    P
                  </span>
                  <p className="text-sm text-gray-600 capitalize">
                    {formatDate(pendiente.due_date)} — {pendiente.titulo}: {formatCurrency(pendiente.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
