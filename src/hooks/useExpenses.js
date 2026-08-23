import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('expenses')
      .select(
        'id, amount, note, created_at, user_id, account_id, category_id, accounts(name), expense_categories(name), profiles(nombre, email)',
      )
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setExpenses(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { expenses, loading, error, refresh }
}
