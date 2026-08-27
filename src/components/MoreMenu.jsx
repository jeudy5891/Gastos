import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { IconWallet, IconCreditCard, IconArrowsLeftRight, IconCalendar, IconChecklist } from './icons'

const OPTIONS = [
  { label: 'Cuentas', to: '/cuentas', Icon: IconWallet },
  { label: 'Créditos', to: '/creditos', Icon: IconCreditCard },
  { label: 'Transferencias', to: '/transferencias', Icon: IconArrowsLeftRight },
  { label: 'Calendario', to: '/calendario', Icon: IconCalendar },
  { label: 'Pendientes', to: '/pendientes', Icon: IconChecklist },
]

export default function MoreMenu({ onClose }) {
  const navigate = useNavigate()

  function handleSelect(option) {
    onClose()
    navigate(option.to)
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-gray-800">Más</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-2xl leading-none px-2 text-gray-500"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleSelect(option)}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-base text-gray-700 hover:bg-gray-50 text-left"
          >
            <option.Icon className="w-5 h-5 text-blue-600 shrink-0" />
            {option.label}
          </button>
        ))}
      </div>
    </Modal>
  )
}
