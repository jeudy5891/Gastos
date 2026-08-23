import { Link } from 'react-router-dom'
import { useAccounts } from '../hooks/useAccounts'
import { useMonthSummary } from '../hooks/useMonthSummary'
import { useProfile } from '../hooks/useProfile'
import { formatCurrency } from '../lib/format'

export default function Dashboard() {
  const { accounts, loading: loadingAccounts } = useAccounts()
  const { current, previous, loading: loadingSummary } = useMonthSummary()
  const { profile } = useProfile()

  const walmart = accounts.find((account) => account.name.trim().toLowerCase() === 'walmart')
  const credix = accounts.find((account) => account.name.trim().toLowerCase() === 'credix')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Bienvenido(a) {profile?.nombre || profile?.email}
        </p>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        )}
      </div>

      <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Ingresos del mes</p>
          <p className="text-xl font-semibold text-green-600">
            {loadingSummary ? '…' : formatCurrency(current.incomes)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Gastos del mes</p>
          <p className="text-xl font-semibold text-red-600">
            {loadingSummary ? '…' : formatCurrency(current.expenses)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Ingresos del mes anterior</p>
          <p className="text-lg font-semibold text-green-500">
            {loadingSummary ? '…' : formatCurrency(previous.incomes)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Gastos del mes anterior</p>
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
    </div>
  )
}
