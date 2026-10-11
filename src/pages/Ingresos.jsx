import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { useIncomeTypes } from '../hooks/useIncomeTypes'
import { useIncomes } from '../hooks/useIncomes'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/format'
import Modal from '../components/Modal'
import DateRangeFilterButton from '../components/DateRangeFilterButton'
import { matchesFilter } from '../lib/filters'
import { IconPencil, IconTrash } from '../components/icons'

export default function Ingresos() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { accounts: allAccounts, loading: loadingAccounts } = useAccounts()
  const accounts = allAccounts.filter((account) => account.type === 'debito')
  const { incomeTypes, loading: loadingTypes } = useIncomeTypes()
  const { incomes, loading: loadingIncomes, refresh } = useIncomes()
  const [filter, setFilter] = useState(null)
  // Orden de los filtros en cascada: fecha → cuenta → tipo
  const filterConfig = {
    getDate: (income) => income.created_at,
    fields: [
      {
        key: 'cuenta',
        label: 'Cuenta',
        options: accounts.map((account) => ({ value: String(account.id), label: account.name })),
        getValue: (income) => income.account_id,
      },
      {
        key: 'tipo',
        label: 'Tipo',
        options: incomeTypes.map((tipo) => ({ value: String(tipo.id), label: tipo.name })),
        getValue: (income) => income.income_type_id,
      },
    ],
  }
  const filteredIncomes = incomes.filter((income) => matchesFilter(income, filter, filterConfig))

  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (location.state?.openForm) {
      setShowForm(true)
      // Limpiar el state para que no se reabra al volver con el botón atrás
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])
  const [editingId, setEditingId] = useState(null)
  const [incomeTypeId, setIncomeTypeId] = useState('')
  const [accountId, setAccountId] = useState(null)
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
    setIncomeTypeId('')
    setAccountId(null)
    setAmount('')
    setNote('')
  }

  function startEdit(income) {
    setEditingId(income.id)
    setIncomeTypeId(income.income_type_id ? String(income.income_type_id) : '')
    setAccountId(income.account_id)
    setAmount(String(income.amount))
    setNote(income.note || '')
    setError('')
    setSuccess(false)
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const amountNumber = Number(amount)
    if (!incomeTypeId) {
      setError('Elegí el tipo de ingreso')
      return
    }
    if (!accountId) {
      setError('Elegí la cuenta a acreditar')
      return
    }
    if (!amountNumber || amountNumber <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    setSaving(true)
    const payload = {
      account_id: accountId,
      income_type_id: incomeTypeId,
      amount: amountNumber,
      note: note.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('incomes').update(payload).eq('id', editingId)
      : await supabase.from('incomes').insert({ ...payload, user_id: user.id })
    setSaving(false)

    if (saveError) {
      setError('No se pudo guardar el ingreso')
      return
    }

    resetForm()
    setSuccess(true)
    refresh()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('incomes').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar el ingreso')
      return
    }

    setPendingDelete(null)
    refresh()
  }

  if (loadingAccounts || loadingTypes) {
    return <p className="text-gray-500">Cargando…</p>
  }

  if (accounts.length === 0) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Ingresos</h1>
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
        <h1 className="text-lg font-semibold text-gray-800">Ingresos</h1>
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
          {showForm ? 'Cancelar' : '+ Ingreso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="income-type">
              Tipo de ingreso
            </label>
            <select
              id="income-type"
              value={incomeTypeId}
              onChange={(event) => setIncomeTypeId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-white"
            >
              <option value="">Seleccioná un tipo</option>
              {incomeTypes.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-gray-600">Cuenta a acreditar</span>
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
          {success && <p className="text-sm text-green-600">Ingreso guardado ✔</p>}

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
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar ingreso'}
            </button>
          </div>
        </form>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800">Ingresos recientes</h2>
          <DateRangeFilterButton
            label="Filtrar"
            value={filter}
            onChange={setFilter}
            items={incomes}
            {...filterConfig}
          />
        </div>
        {loadingIncomes && <p className="text-gray-500">Cargando…</p>}
        {!loadingIncomes && filteredIncomes.length === 0 && (
          <p className="text-gray-500">
            {filter ? 'No hay ingresos con esos filtros.' : 'Todavía no hay ingresos registrados.'}
          </p>
        )}
        <ul className="space-y-2">
          {filteredIncomes.map((income) => (
            <li key={income.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">{income.income_types?.name}</p>
                  <p className="text-sm text-gray-500">
                    {income.accounts?.name} · {income.profiles?.nombre || income.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(income.created_at).toLocaleString('es-CR')}
                  </p>
                  {income.note && <p className="text-xs text-gray-400 mt-1">{income.note}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrency(income.amount)}
                  </p>
                  {income.user_id === user.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(income)}
                        aria-label="Editar"
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(income)}
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

        {filteredIncomes.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 mt-2">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(filteredIncomes.reduce((sum, income) => sum + Number(income.amount), 0))}
            </span>
          </div>
        )}
      </div>

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar ingreso</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar este ingreso de {formatCurrency(pendingDelete.amount)}? No se puede deshacer.
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
