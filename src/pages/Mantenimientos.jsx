import { useState } from 'react'
import SimpleCatalogTab from '../components/mantenimientos/SimpleCatalogTab'
import FechasPagoTab from '../components/mantenimientos/FechasPagoTab'
import PerfilTab from '../components/mantenimientos/PerfilTab'

const TABS = [
  { value: 'gastos', label: 'Tipos de gasto' },
  { value: 'ingresos', label: 'Tipos de ingreso' },
  { value: 'quincenas', label: 'Fechas de pago' },
  { value: 'perfil', label: 'Perfil' },
]

export default function Mantenimientos() {
  const [tab, setTab] = useState('gastos')

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

      {tab === 'gastos' && (
        <SimpleCatalogTab
          table="expense_categories"
          placeholder="Nueva categoría"
          emptyLabel="Todavía no hay categorías."
        />
      )}
      {tab === 'ingresos' && (
        <SimpleCatalogTab
          table="income_types"
          placeholder="Nuevo tipo de ingreso"
          emptyLabel="Todavía no hay tipos de ingreso."
        />
      )}
      {tab === 'quincenas' && <FechasPagoTab />}
      {tab === 'perfil' && <PerfilTab />}
    </div>
  )
}
