import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function usePendientes() {
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('pendientes')
      .select('id, titulo, amount, due_date, note, created_at, user_id, profiles(nombre, email)')
      .order('due_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPendientes(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { pendientes, loading, error, refresh }
}
