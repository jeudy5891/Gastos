import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePendientes } from '../hooks/usePendientes'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatDate, isDateOnlyWithinRange, todayISODate } from '../lib/format'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'
import DateRangeFilterButton from '../components/DateRangeFilterButton'
import { IconPencil, IconTrash } from '../components/icons'

export default function Pendientes() {
  const { user } = useAuth()
  const { pendientes, loading: loadingPendientes, refresh } = usePendientes()
  const [dateFilter, setDateFilter] = useState(null)
  const filteredPendientes = pendientes.filter((pendiente) =>
    isDateOnlyWithinRange(pendiente.due_date, dateFilter),
  )

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayISODate())
  const [note, setNote] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function resetForm() {
    setEditingId(null)
    setTitulo('')
    setAmount('')
    setDueDate(todayISODate())
    setNote('')
  }

  function startEdit(pendiente) {
    setEditingId(pendiente.id)
    setTitulo(pendiente.titulo)
    setAmount(String(pendiente.amount))
    setDueDate(pendiente.due_date)
    setNote(pendiente.note || '')
    setError('')
    setSuccess(false)
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const amountNumber = Number(amount)
    if (!titulo.trim()) {
      setError('Ingresá el pendiente')
      return
    }
    if (!amountNumber || amountNumber <= 0) {
      setError('Ingresá un monto válido')
      return
    }
    if (!dueDate) {
      setError('Elegí la fecha límite de pago')
      return
    }

    setSaving(true)
    const payload = {
      titulo: titulo.trim(),
      amount: amountNumber,
      due_date: dueDate,
      note: note.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('pendientes').update(payload).eq('id', editingId)
      : await supabase.from('pendientes').insert({ ...payload, user_id: user.id })
    setSaving(false)

    if (saveError) {
      setError('No se pudo guardar el pendiente')
      return
    }

    resetForm()
    setSuccess(true)
    refresh()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('pendientes').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar el pendiente')
      return
    }

    setPendingDelete(null)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Pendientes</h1>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm()
              setShowForm(false)
            } else {
              setShowForm(true)
            }
          }}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium"
        >
          {showForm ? 'Cancelar' : '+ Pendiente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="titulo">
              Pendiente
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ej: Pagar matrícula"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="amount">
              Monto (₡)
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm text-gray-600">Fecha límite de pago</span>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-left bg-white capitalize"
            >
              {formatDate(dueDate)}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="note">
              Nota (opcional)
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Pendiente guardado ✔</p>}

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 text-white py-3 font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar pendiente'}
            </button>
          </div>
        </form>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800">Pendientes</h2>
          <DateRangeFilterButton value={dateFilter} onChange={setDateFilter} />
        </div>
        {loadingPendientes && <p className="text-gray-500">Cargando…</p>}
        {!loadingPendientes && filteredPendientes.length === 0 && (
          <p className="text-gray-500">
            {dateFilter ? 'No hay pendientes en ese rango de fechas.' : 'Todavía no hay pendientes registrados.'}
          </p>
        )}
        <ul className="space-y-2">
          {filteredPendientes.map((pendiente) => (
            <li key={pendiente.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">{pendiente.titulo}</p>
                  <p className="text-sm text-gray-500">
                    Vence {formatDate(pendiente.due_date)} ·{' '}
                    {pendiente.profiles?.nombre || pendiente.profiles?.email}
                  </p>
                  {pendiente.note && <p className="text-xs text-gray-400 mt-1">{pendiente.note}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrency(pendiente.amount)}
                  </p>
                  {pendiente.user_id === user.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(pendiente)}
                        aria-label="Editar"
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(pendiente)}
                        aria-label="Eliminar"
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredPendientes.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 mt-2">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(filteredPendientes.reduce((sum, pendiente) => sum + Number(pendiente.amount), 0))}
            </span>
          </div>
        )}
      </div>

      {showDatePicker && (
        <DatePicker value={dueDate} onChange={setDueDate} onClose={() => setShowDatePicker(false)} />
      )}

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar pendiente</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar "{pendingDelete.titulo}"? No se puede deshacer.
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
