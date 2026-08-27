import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from './BottomNav'
import AddMenu from './AddMenu'
import MoreMenu from './MoreMenu'
import { IconLogout, IconWrench } from './icons'

export default function AppShell() {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const { signOut } = useAuth()

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-20">
        <Link to="/" aria-label="Ir al dashboard" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="w-9 h-9 rounded-lg" />
          <span className="font-semibold text-gray-800">Gastos Familiares</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/mantenimientos" aria-label="Mantenimientos" className="text-gray-500 p-2">
            <IconWrench className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            aria-label="Cerrar sesión"
            className="text-gray-500 p-2"
          >
            <IconLogout className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <BottomNav onAdd={() => setShowAddMenu(true)} onMore={() => setShowMoreMenu(true)} />
      {showAddMenu && <AddMenu onClose={() => setShowAddMenu(false)} />}
      {showMoreMenu && <MoreMenu onClose={() => setShowMoreMenu(false)} />}
    </div>
  )
}
