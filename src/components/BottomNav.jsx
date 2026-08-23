import { NavLink } from 'react-router-dom'
import { IconWallet, IconArrowDown, IconReceipt, IconCreditCard, IconPlus } from './icons'

const linkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`

export default function BottomNav({ onAdd }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center h-16">
        <NavLink to="/cuentas" className={linkClass}>
          <IconWallet className="w-6 h-6" />
          Cuentas
        </NavLink>
        <NavLink to="/ingresos" className={linkClass}>
          <IconArrowDown className="w-6 h-6" />
          Ingresos
        </NavLink>
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Agregar"
            className="w-14 h-14 -mt-6 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
          >
            <IconPlus className="w-7 h-7" />
          </button>
        </div>
        <NavLink to="/gastos" className={linkClass}>
          <IconReceipt className="w-6 h-6" />
          Gastos
        </NavLink>
        <NavLink to="/creditos" className={linkClass}>
          <IconCreditCard className="w-6 h-6" />
          Créditos
        </NavLink>
      </div>
    </nav>
  )
}
