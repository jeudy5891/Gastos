import { useState } from 'react'
import CategoriasTab from '../components/mantenimientos/CategoriasTab'
import PerfilTab from '../components/mantenimientos/PerfilTab'

const TABS = [
  { value: 'categorias', label: 'Tipos de gasto' },
  { value: 'perfil', label: 'Perfil' },
]

export default function Mantenimientos() {
  const [tab, setTab] = useState('categorias')

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-800">Mantenimientos</h1>

      <div className="grid grid-cols-2 gap-2">
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            className={`rounded-lg py-2 font-medium border text-sm ${
              tab === option.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === 'categorias' ? <CategoriasTab /> : <PerfilTab />}
    </div>
  )
}
