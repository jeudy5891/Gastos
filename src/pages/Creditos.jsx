import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { useCreditPayments } from '../hooks/useCreditPayments'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatDate, todayISODate } from '../lib/format'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'
import { IconPencil, IconTrash } from '../components/icons'

export default function Creditos() {
  const { user } = useAuth()
  const { accounts, loading: loadingAccounts, refresh: refreshAccounts } = useAccounts()
  const { payments, loading: loadingPayments, refresh: refreshPayments } = useCreditPayments()
  const creditAccounts = accounts.filter((account) => account.type === 'credito')
  const debitAccounts = accounts.filter((account) => account.type === 'debito')

  const [editingId, setEditingId] = useState(null)
  const [accountId, setAccountId] = useState(null)
  const [debitAccountId, setDebitAccountId] = useState(null)
  const [paymentDate, setPaymentDate] = useState(todayISODate())
  const [amount, setAmount] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function resetForm() {
    setEditingId(null)
    setAccountId(null)
    setDebitAccountId(null)
    setPaymentDate(todayISODate())
    setAmount('')
  }

  function startEdit(payment) {
    setEditingId(payment.id)
    setAccountId(payment.account_id)
    setDebitAccountId(payment.debit_account_id)
    setPaymentDate(payment.payment_date)
    setAmount(String(payment.amount))
    setError('')
    setSuccess(false)
  }

  async function refreshAll() {
    await Promise.all([refreshAccounts(), refreshPayments()])
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const amountNumber = Number(amount)
    if (!accountId) {
      setError('Elegí la tarjeta a pagar')
      return
    }
    if (!debitAccountId) {
      setError('Elegí la cuenta a debitar')
      return
    }
    if (!paymentDate) {
      setError('Elegí la fecha de pago')
      return
    }
    if (!amountNumber || amountNumber <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    setSaving(true)
    const payload = {
      account_id: accountId,
      debit_account_id: debitAccountId,
      payment_date: paymentDate,
      amount: amountNumber,
    }

    const { error: saveError } = editingId
      ? await supabase.from('credit_payments').update(payload).eq('id', editingId)
      : await supabase.from('credit_payments').insert({ ...payload, user_id: user.id })
    setSaving(false)

    if (saveError) {
      setError('No se pudo guardar el pago')
      return
    }

    resetForm()
    setSuccess(true)
    refreshAll()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from('credit_payments').delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar el pago')
      return
    }

    setPendingDelete(null)
    refreshAll()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-800">Créditos</h1>

      {loadingAccounts && <p className="text-gray-500">Cargando…</p>}
      {!loadingAccounts && creditAccounts.length === 0 && (
        <p className="text-gray-500">No hay tarjetas de crédito registradas.</p>
      )}

      <ul className="space-y-2">
        {creditAccounts.map((account) => (
          <li key={account.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">{account.name}</p>
                <p className="text-sm text-gray-500">
                  {account.profiles?.nombre || account.profiles?.email}
                </p>
                <p className="text-xs text-gray-400">
                  Corte día {account.cutoff_day} · Pago día {account.payment_day}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Adeudado</p>
                <p className="font-semibold text-red-600 whitespace-nowrap">
                  {formatCurrency(account.debt)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {creditAccounts.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-gray-800">
            {editingId ? 'Editar pago' : 'Registrar pago'}
          </h2>

          {debitAccounts.length === 0 ? (
            <p className="text-gray-500">
              Necesitás una cuenta de débito para pagar la tarjeta. Agregá una en{' '}
              <Link to="/cuentas" className="text-blue-600 underline">
                Cuentas
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-sm text-gray-600">Tarjeta</span>
                <div className="grid grid-cols-2 gap-2">
                  {creditAccounts.map((account) => (
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
                <span className="text-sm text-gray-600">Cuenta a debitar</span>
                <div className="grid grid-cols-2 gap-2">
                  {debitAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setDebitAccountId(account.id)}
                      className={`rounded-lg py-3 px-2 font-medium border text-sm ${
                        String(debitAccountId) === String(account.id)
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
                <span className="text-sm text-gray-600">Fecha de pago</span>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-left bg-white capitalize"
                >
                  {formatDate(paymentDate)}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="payment-amount">
                  Monto pagado (₡)
                </label>
                <input
                  id="payment-amount"
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

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">Pago guardado ✔</p>}

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
                  {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar pago'}
                </button>
              </div>
            </form>
          )}

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-2">Pagos recientes</h2>
            {loadingPayments && <p className="text-gray-500">Cargando…</p>}
            {!loadingPayments && payments.length === 0 && (
              <p className="text-gray-500">Todavía no hay pagos registrados.</p>
            )}
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li key={payment.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{payment.accounts?.name}</p>
                      <p className="text-sm text-gray-500">
                        {payment.debit_account?.name
                          ? `Desde ${payment.debit_account.name}`
                          : 'Cuenta de origen no registrada'}
                        {' · '}
                        {payment.profiles?.nombre || payment.profiles?.email}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{formatDate(payment.payment_date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-semibold text-green-600 whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.user_id === user.id && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(payment)}
                            aria-label="Editar"
                            className="text-gray-400 hover:text-blue-600 p-1"
                          >
                            <IconPencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('')
                              setPendingDelete(payment)
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
          </div>
        </>
      )}

      {showDatePicker && (
        <DatePicker
          value={paymentDate}
          onChange={setPaymentDate}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar pago</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar este pago de {formatCurrency(pendingDelete.amount)}? No se puede deshacer.
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
