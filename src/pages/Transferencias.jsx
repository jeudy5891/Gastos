import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { supabase } from '../lib/supabaseClient'

export default function Transferencias() {
  const { user } = useAuth()
  const { accounts: allAccounts, loading: loadingAccounts } = useAccounts()
  const accounts = allAccounts.filter((account) => account.type === 'debito')

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function resetForm() {
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setNote('')
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
    const { error: insertError } = await supabase.from('transfers').insert({
      user_id: user.id,
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: amountNumber,
      note: note.trim() || null,
    })
    setSaving(false)

    if (insertError) {
      setError('No se pudo guardar la transferencia')
      return
    }

    resetForm()
    setSuccess(true)
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
      <h1 className="text-lg font-semibold text-gray-800">Nueva transferencia</h1>

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
        {success && <p className="text-sm text-green-600">Transferencia registrada ✔</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar transferencia'}
        </button>
      </form>
    </div>
  )
}
