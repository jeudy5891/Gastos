import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('expense_categories')
      .select('id, name, active')
      .eq('active', true)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCategories(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { categories, loading, error, refresh }
}
