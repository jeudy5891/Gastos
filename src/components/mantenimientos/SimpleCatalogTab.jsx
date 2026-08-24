import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../Modal'
import { IconTrash } from '../icons'

export default function SimpleCatalogTab({ table, placeholder, emptyLabel }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from(table)
      .select('id, name')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Se vuelve a cargar si cambia la tabla que administra esta pestaña.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  async function handleAdd(event) {
    event.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')
    const { error: insertError } = await supabase.from(table).insert({ name: name.trim() })
    setSaving(false)

    if (insertError) {
      setError('No se pudo agregar (¿ya existe?)')
      return
    }

    setName('')
    load()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    const { error: deleteErr } = await supabase.from(table).delete().eq('id', pendingDelete.id)
    setDeleting(false)

    if (deleteErr) {
      setDeleteError('No se pudo eliminar: está en uso en algún registro.')
      return
    }

    setPendingDelete(null)
    load()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 text-white px-4 py-3 font-medium disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-gray-500">Cargando…</p>}
      {!loading && items.length === 0 && <p className="text-gray-500">{emptyLabel}</p>}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
          >
            <span className="text-gray-800">{item.name}</span>
            <button
              type="button"
              onClick={() => {
                setDeleteError('')
                setPendingDelete(item)
              }}
              aria-label={`Eliminar ${item.name}`}
              className="text-gray-400 hover:text-red-600 p-1"
            >
              <IconTrash className="w-5 h-5" />
            </button>
          </li>
        ))}
      </ul>

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <p className="font-semibold text-gray-800 mb-1">Eliminar</p>
          <p className="text-sm text-gray-600 mb-4">
            ¿Eliminar "{pendingDelete.name}"? Esta acción no se puede deshacer.
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
