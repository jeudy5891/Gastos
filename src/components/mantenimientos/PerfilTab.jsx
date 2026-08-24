import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

const ROLES = [
  { value: 'esposo', label: 'Esposo' },
  { value: 'esposa', label: 'Esposa' },
  { value: 'hijo', label: 'Hijo' },
  { value: 'hija', label: 'Hija' },
]

export default function PerfilTab() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('nombre, rol, avatar_url')
        .eq('id', user.id)
        .single()

      if (!fetchError && data) {
        setNombre(data.nombre || '')
        setRol(data.rol || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoading(false)
    }

    loadProfile()
  }, [user.id])

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setUploadingPhoto(true)

    const extension = file.name.split('.').pop()
    const path = `${user.id}/avatar.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('No se pudo subir la foto')
      setUploadingPhoto(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
    setUploadingPhoto(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nombre: nombre.trim() || null, rol: rol || null, avatar_url: avatarUrl || null })
      .eq('id', user.id)
    setSaving(false)

    if (updateError) {
      setError('No se pudo guardar el perfil')
      return
    }

    setSuccess(true)
  }

  if (loading) {
    return <p className="text-gray-500">Cargando…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center text-gray-400 text-sm"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            'Sin foto'
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="text-sm text-blue-600 font-medium disabled:opacity-50"
        >
          {uploadingPhoto ? 'Subiendo…' : 'Cambiar foto'}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-600" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
      </div>

      <div className="space-y-1">
        <span className="text-sm text-gray-600">Parentesco</span>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRol(option.value)}
              className={`rounded-lg py-3 font-medium border text-sm ${
                rol === option.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Perfil actualizado ✔</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  )
}
