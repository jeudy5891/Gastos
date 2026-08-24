import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../Modal'
import DatePicker from '../DatePicker'
import { IconTrash } from '../icons'
import { formatDate, todayISODate } from '../../lib/format'

const QUINCENAS = [1, 2]

export default function FechasPagoTab() {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mes, setMes] = useState('')
  const [quincena, setQuincena] = useState(1)
  const [payDate, setPayDate] = useState(todayISODate())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('pay_periods')
      .select('id, mes, quincena, pay_date')
      .order('pay_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPeriods(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(event) {
    event.preventDefault()
    if (!mes.trim()) {
      setError('Ingresá el mes')
      return
    }

    setSaving(true)
    setError('')
    const { error: insertError } = await supabase
      .from('pay_periods')
      .insert({ mes: mes.trim(), quincena, pay_date: payDate })
    setSaving(false)

    if (insertError) {
      setError('No se pudo agregar (¿ya existe esa fecha?)')
      return
    }

    setMes('')
    setQuincena(1)
    setPayDate(todayISODate())
    load()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('pay_periods').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar')
      return
    }

    setPendingDelete(null)
    load()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="mes">
              Mes
            </label>
            <input
              id="mes"
              type="text"
              value={mes}
              onChange={(event) => setMes(event.target.value)}
              placeholder="Ej: Agosto"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm text-gray-600">Quincena</span>
            <div className="grid grid-cols-2 gap-2">
              {QUINCENAS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuincena(q)}
                  className={`rounded-lg py-3 font-medium border ${
                    quincena === q
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-sm text-gray-600">Fecha de pago</span>
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-left bg-white capitalize"
          >
            {formatDate(payDate)}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Agregar'}
        </button>
      </form>

      {loading && <p className="text-gray-500">Cargando…</p>}
      {!loading && periods.length === 0 && (
        <p className="text-gray-500">Todavía no hay fechas registradas.</p>
      )}

      <ul className="space-y-2">
        {periods.map((period) => (
          <li
            key={period.id}
            className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-800">
                {period.mes} · Quincena {period.quincena}
              </p>
              <p className="text-sm text-gray-500 capitalize">{formatDate(period.pay_date)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteError('')
                setPendingDelete(period)
              }}
              aria-label="Eliminar"
              className="text-gray-400 hover:text-red-600 p-1"
            >
              <IconTrash className="w-5 h-5" />
            </button>
          </li>
        ))}
      </ul>

      {showDatePicker && (
        <DatePicker value={payDate} onChange={setPayDate} onClose={() => setShowDatePicker(false)} />
      )}

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar fecha de pago</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar {pendingDelete.mes} · Quincena {pendingDelete.quincena}?
          </p>
          {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 text-white py-3 font-medium disabled:opacity-50"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
