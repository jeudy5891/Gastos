import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { useTransfers } from '../hooks/useTransfers'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, isWithinDateRange } from '../lib/format'
import Modal from '../components/Modal'
import DateRangeFilterButton from '../components/DateRangeFilterButton'
import { IconPencil, IconTrash } from '../components/icons'

export default function Transferencias() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { accounts: allAccounts, loading: loadingAccounts } = useAccounts()
  const accounts = allAccounts.filter((account) => account.type === 'debito')
  const { transfers, loading: loadingTransfers, refresh } = useTransfers()
  const [dateFilter, setDateFilter] = useState(null)
  const filteredTransfers = transfers.filter((transfer) => isWithinDateRange(transfer.created_at, dateFilter))

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (location.state?.openForm) {
      setShowForm(true)
      // Limpiar el state para que no se reabra al volver con el botón atrás
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  function resetForm() {
    setEditingId(null)
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setNote('')
  }

  function startEdit(transfer) {
    setEditingId(transfer.id)
    setFromAccountId(String(transfer.from_account_id))
    setToAccountId(String(transfer.to_account_id))
    setAmount(String(transfer.amount))
    setNote(transfer.note || '')
    setError('')
    setSuccess(false)
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const amountNumber = Number(amount)
    if (!fromAccountId || !toAccountId) {
      setError('Elegí las dos cuentas')
      return
    }
    if (fromAccountId === toAccountId) {
      setError('La cuenta de origen y destino deben ser distintas')
      return
    }
    if (!amountNumber || amountNumber <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    setSaving(true)
    const payload = {
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: amountNumber,
      note: note.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('transfers').update(payload).eq('id', editingId)
      : await supabase.from('transfers').insert({ ...payload, user_id: user.id })
    setSaving(false)

    if (saveError) {
      setError('No se pudo guardar la transferencia')
      return
    }

    resetForm()
    setSuccess(true)
    refresh()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('transfers').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar la transferencia')
      return
    }

    setPendingDelete(null)
    refresh()
  }

  if (loadingAccounts) {
    return <p className="text-gray-500">Cargando…</p>
  }

  if (accounts.length < 2) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Transferencias</h1>
        <p className="text-gray-500">
          Necesitás al menos dos cuentas registradas en{' '}
          <Link to="/cuentas" className="text-blue-600 underline">
            Cuentas
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Transferencias</h1>
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
          {showForm ? 'Cancelar' : '+ Transferencia'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="from-account">
              Cuenta a debitar
            </label>
            <select
              id="from-account"
              value={fromAccountId}
              onChange={(event) => setFromAccountId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-white"
            >
              <option value="">Seleccioná una cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="to-account">
              Cuenta a acreditar
            </label>
            <select
              id="to-account"
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-white"
            >
              <option value="">Seleccioná una cuenta</option>
              {accounts
                .filter((account) => String(account.id) !== String(fromAccountId))
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
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
          {success && <p className="text-sm text-green-600">Transferencia guardada ✔</p>}

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
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar transferencia'}
            </button>
          </div>
        </form>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800">Transferencias recientes</h2>
          <DateRangeFilterButton value={dateFilter} onChange={setDateFilter} />
        </div>
        {loadingTransfers && <p className="text-gray-500">Cargando…</p>}
        {!loadingTransfers && filteredTransfers.length === 0 && (
          <p className="text-gray-500">
            {dateFilter ? 'No hay transferencias en ese rango de fechas.' : 'Todavía no hay transferencias registradas.'}
          </p>
        )}
        <ul className="space-y-2">
          {filteredTransfers.map((transfer) => (
            <li key={transfer.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">
                    {transfer.from_account?.name} → {transfer.to_account?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transfer.profiles?.nombre || transfer.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(transfer.created_at).toLocaleString('es-CR')}
                  </p>
                  {transfer.note && <p className="text-xs text-gray-400 mt-1">{transfer.note}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrency(transfer.amount)}
                  </p>
                  {transfer.user_id === user.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(transfer)}
                        aria-label="Editar"
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(transfer)}
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

        {filteredTransfers.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 mt-2">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(filteredTransfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0))}
            </span>
          </div>
        )}
      </div>

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar transferencia</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar esta transferencia de {formatCurrency(pendingDelete.amount)}? No se puede deshacer.
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
