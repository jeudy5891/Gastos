import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccounts } from '../hooks/useAccounts'
import { useQuincenaSummary } from '../hooks/useQuincenaSummary'
import { usePendientes } from '../hooks/usePendientes'
import { useProfile } from '../hooks/useProfile'
import { formatCurrency, formatDate, todayISODate, addDaysISO } from '../lib/format'
import Modal from '../components/Modal'

export default function Dashboard() {
  const { accounts, loading: loadingAccounts } = useAccounts()
  const { current, previous, loading: loadingSummary } = useQuincenaSummary()
  const { pendientes, loading: loadingPendientes } = usePendientes()
  const { profile } = useProfile()

  const walmart = accounts.find((account) => account.name.trim().toLowerCase() === 'walmart')
  const credix = accounts.find((account) => account.name.trim().toLowerCase() === 'credix')

  const saldoActual = accounts
    .filter((account) => account.type === 'debito')
    .reduce((sum, account) => sum + Number(account.balance), 0)

  const cutoff = addDaysISO(todayISODate(), 7)
  const pendientesProximos = pendientes.filter((pendiente) => pendiente.due_date <= cutoff)

  const [showAlert, setShowAlert] = useState(false)
  useEffect(() => {
    if (loadingPendientes || pendientesProximos.length === 0) return undefined

    const timer = setTimeout(() => setShowAlert(true), 3000)
    return () => clearTimeout(timer)
    // Solo se dispara cuando termina de cargar, no en cada cambio de la lista filtrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPendientes])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        )}
        <p className="text-gray-600">Bienvenido(a) {profile?.nombre || profile?.email}</p>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
        <p className="text-xs text-gray-400">Quincena actual: {current.label}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Ingresos de esta quincena</p>
          <p className="text-xl font-semibold text-green-600">
            {loadingSummary ? '…' : formatCurrency(current.incomes)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Gastos de esta quincena</p>
          <p className="text-xl font-semibold text-red-600">
            {loadingSummary ? '…' : formatCurrency(current.expenses)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Saldo actual</p>
          <p className="text-lg font-semibold text-blue-600">
            {loadingAccounts ? '…' : formatCurrency(saldoActual)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Gastos quincena anterior</p>
          <p className="text-lg font-semibold text-red-500">
            {loadingSummary ? '…' : formatCurrency(previous.expenses)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total adeudado Walmart</p>
          <p className="text-lg font-semibold text-red-500">
            {loadingAccounts ? '…' : walmart ? formatCurrency(walmart.debt) : 'No registrada'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total adeudado Credix</p>
          <p className="text-lg font-semibold text-red-500">
            {loadingAccounts ? '…' : credix ? formatCurrency(credix.debt) : 'No registrada'}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Cuentas</h2>
        {loadingAccounts && <p className="text-gray-500">Cargando…</p>}
        {!loadingAccounts && accounts.length === 0 && (
          <p className="text-gray-500">
            Todavía no hay cuentas.{' '}
            <Link to="/cuentas" className="text-blue-600 underline">
              Agregar una
            </Link>
            .
          </p>
        )}
        <ul className="space-y-2">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">{account.name}</p>
                <p className="text-xs text-gray-400">
                  {account.type === 'credito' ? 'Crédito' : 'Débito'}
                </p>
              </div>
              <p className={`font-semibold ${account.type === 'credito' ? 'text-red-600' : 'text-gray-800'}`}>
                {formatCurrency(account.type === 'credito' ? account.debt : account.balance)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {showAlert && (
        <Modal onClose={() => setShowAlert(false)} panelStyle={{ backgroundColor: '#fcd5ce' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-gray-800 text-xl">Pendientes</span>
            <button
              type="button"
              onClick={() => setShowAlert(false)}
              aria-label="Cerrar"
              className="text-3xl leading-none px-2 text-gray-600"
            >
              ×
            </button>
          </div>
          <ul className="space-y-3">
            {pendientesProximos.map((pendiente) => (
              <li key={pendiente.id} className="flex items-center justify-between gap-3 text-base">
                <span className="text-gray-800 font-medium">{pendiente.titulo}</span>
                <span className="text-gray-700 whitespace-nowrap font-medium">
                  {formatCurrency(pendiente.amount)} · {formatDate(pendiente.due_date)}
                </span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  )
}
