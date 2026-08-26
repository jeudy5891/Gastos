import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useExpenses } from '../hooks/useExpenses'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, isWithinDateRange } from '../lib/format'
import Modal from '../components/Modal'
import DateRangeFilterButton from '../components/DateRangeFilterButton'
import { IconPencil, IconTrash } from '../components/icons'

export default function Gastos() {
  const { user } = useAuth()
  const { accounts, loading: loadingAccounts } = useAccounts()
  const { categories, loading: loadingCategories } = useCategories()
  const { expenses, loading: loadingExpenses, refresh } = useExpenses()
  const [dateFilter, setDateFilter] = useState(null)
  const filteredExpenses = expenses.filter((expense) => isWithinDateRange(expense.created_at, dateFilter))

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [accountId, setAccountId] = useState(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function resetForm() {
    setEditingId(null)
    setAccountId(null)
    setCategoryId('')
    setAmount('')
    setNote('')
  }

  function startEdit(expense) {
    setEditingId(expense.id)
    setAccountId(expense.account_id)
    setCategoryId(String(expense.category_id))
    setAmount(String(expense.amount))
    setNote(expense.note || '')
    setError('')
    setSuccess(false)
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const amountNumber = Number(amount)
    if (!accountId) {
      setError('Elegí la cuenta a debitar')
      return
    }
    if (!categoryId) {
      setError('Elegí el tipo de gasto')
      return
    }
    if (!amountNumber || amountNumber <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    setSaving(true)
    const payload = {
      account_id: accountId,
      category_id: categoryId,
      amount: amountNumber,
      note: note.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('expenses').update(payload).eq('id', editingId)
      : await supabase.from('expenses').insert({ ...payload, user_id: user.id })
    setSaving(false)

    if (saveError) {
      setError('No se pudo guardar el gasto')
      return
    }

    resetForm()
    setSuccess(true)
    refresh()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('expenses').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar el gasto')
      return
    }

    setPendingDelete(null)
    refresh()
  }

  if (loadingAccounts || loadingCategories) {
    return <p className="text-gray-500">Cargando…</p>
  }

  if (accounts.length === 0) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Gastos</h1>
        <p className="text-gray-500">
          Primero agregá una cuenta en{' '}
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
        <h1 className="text-lg font-semibold text-gray-800">Gastos</h1>
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
          {showForm ? 'Cancelar' : '+ Gasto'}
        </button>
      </div>

      {showForm && (
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="space-y-1">
          <span className="text-sm text-gray-600">Cuenta a debitar</span>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setAccountId(account.id)}
                className={`rounded-lg py-3 px-2 font-medium border text-sm ${
                  String(accountId) === String(account.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {account.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600" htmlFor="category">
            Tipo de gasto
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-white"
          >
            <option value="">Seleccioná una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
        {success && <p className="text-sm text-green-600">Gasto guardado ✔</p>}

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
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar gasto'}
          </button>
        </div>
      </form>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800">Gastos recientes</h2>
          <DateRangeFilterButton value={dateFilter} onChange={setDateFilter} />
        </div>
        {loadingExpenses && <p className="text-gray-500">Cargando…</p>}
        {!loadingExpenses && filteredExpenses.length === 0 && (
          <p className="text-gray-500">
            {dateFilter ? 'No hay gastos en ese rango de fechas.' : 'Todavía no hay gastos registrados.'}
          </p>
        )}
        <ul className="space-y-2">
          {filteredExpenses.map((expense) => (
            <li key={expense.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">{expense.expense_categories?.name}</p>
                  <p className="text-sm text-gray-500">
                    {expense.accounts?.name} · {expense.profiles?.nombre || expense.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(expense.created_at).toLocaleString('es-CR')}
                  </p>
                  {expense.note && <p className="text-xs text-gray-400 mt-1">{expense.note}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrency(expense.amount)}
                  </p>
                  {expense.user_id === user.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(expense)}
                        aria-label="Editar"
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(expense)}
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

        {filteredExpenses.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 mt-2">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0))}
            </span>
          </div>
        )}
      </div>

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar gasto</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar este gasto de {formatCurrency(pendingDelete.amount)}? No se puede deshacer.
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
