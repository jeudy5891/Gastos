import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/format'
import Modal from '../components/Modal'
import { IconPencil, IconTrash } from '../components/icons'

const TIPOS = [
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
]

export default function Cuentas() {
  const { user } = useAuth()
  const { accounts, loading, error, refresh } = useAccounts()
  const location = useLocation()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('debito')
  const [cutoffDay, setCutoffDay] = useState('')
  const [paymentDay, setPaymentDay] = useState('')
  const [initialDebt, setInitialDebt] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (location.state?.openForm) {
      setShowForm(true)
      setType(location.state.presetType || 'debito')
      // Limpiar el state para que no se reabra al volver con el botón atrás
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  function resetForm() {
    setEditingId(null)
    setName('')
    setType('debito')
    setCutoffDay('')
    setPaymentDay('')
    setInitialDebt('')
    setNote('')
    setFormError('')
  }

  function startEdit(account) {
    setEditingId(account.id)
    setName(account.name)
    setType(account.type)
    setCutoffDay(account.cutoff_day ? String(account.cutoff_day) : '')
    setPaymentDay(account.payment_day ? String(account.payment_day) : '')
    setInitialDebt(account.initial_debt ? String(account.initial_debt) : '')
    setNote(account.note || '')
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Ingresá un nombre para la cuenta')
      return
    }
    if (type === 'credito' && (!cutoffDay || !paymentDay)) {
      setFormError('Ingresá el día de corte y el día de pago')
      return
    }

    setSaving(true)
    const payload = {
      name: name.trim(),
      type,
      cutoff_day: type === 'credito' ? Number(cutoffDay) : null,
      payment_day: type === 'credito' ? Number(paymentDay) : null,
      initial_debt: type === 'credito' ? Number(initialDebt || 0) : 0,
      note: note.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('accounts').update(payload).eq('id', editingId)
      : await supabase.from('accounts').insert({ ...payload, user_id: user.id })
    setSaving(false)

    if (saveError) {
      setFormError('No se pudo guardar la cuenta')
      return
    }

    resetForm()
    setShowForm(false)
    refresh()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('accounts').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se puede eliminar: hay movimientos registrados en esta cuenta.')
      return
    }

    setPendingDelete(null)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Cuentas</h1>
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
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="account-name">
              Nombre de la cuenta
            </label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: BAC, Walmart, Efectivo"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm text-gray-600">Tipo</span>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => setType(tipo.value)}
                  className={`rounded-lg py-3 font-medium border ${
                    type === tipo.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {type === 'credito' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="cutoff-day">
                  Día de corte
                </label>
                <input
                  id="cutoff-day"
                  type="number"
                  min="1"
                  max="31"
                  value={cutoffDay}
                  onChange={(event) => setCutoffDay(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="payment-day">
                  Día de pago
                </label>
                <input
                  id="payment-day"
                  type="number"
                  min="1"
                  max="31"
                  value={paymentDay}
                  onChange={(event) => setPaymentDay(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-sm text-gray-600" htmlFor="initial-debt">
                  Total adeudado
                </label>
                <input
                  id="initial-debt"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={initialDebt}
                  onChange={(event) => setInitialDebt(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-gray-600" htmlFor="account-note">
              Nota (opcional)
            </label>
            <input
              id="account-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium disabled:opacity-50"
          >
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar cuenta'}
          </button>
        </form>
      )}

      {loading && <p className="text-gray-500">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && accounts.length === 0 && (
        <p className="text-gray-500">Todavía no hay cuentas registradas.</p>
      )}

      <ul className="space-y-2">
        {accounts.map((account) => (
          <li key={account.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">{account.name}</p>
                <p className="text-sm text-gray-500">
                  {account.type === 'credito' ? 'Crédito' : 'Débito'} ·{' '}
                  {account.profiles?.nombre || account.profiles?.email}
                </p>
                {account.type === 'credito' && (
                  <p className="text-xs text-gray-400">
                    Corte día {account.cutoff_day} · Pago día {account.payment_day}
                  </p>
                )}
                {account.note && <p className="text-xs text-gray-400 mt-1">{account.note}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                {account.type === 'credito' ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Adeudado</p>
                    <p className="font-semibold text-red-600 whitespace-nowrap">
                      {formatCurrency(account.debt)}
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrency(account.balance)}
                  </p>
                )}
                {account.user_id === user.id && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(account)}
                      aria-label="Editar"
                      className="text-gray-400 hover:text-blue-600 p-1"
                    >
                      <IconPencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('')
                        setPendingDelete(account)
                      }}
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

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar cuenta</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar "{pendingDelete.name}"? Esta acción no se puede deshacer.
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
