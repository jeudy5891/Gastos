export default function Modal({ onClose, children, panelStyle }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-4 shadow-xl"
        style={panelStyle}
      >
        {children}
      </div>
    </div>
  )
}
