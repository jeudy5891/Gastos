import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useIncomeTypes() {
  const [incomeTypes, setIncomeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('income_types')
      .select('id, name, active')
      .eq('active', true)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setIncomeTypes(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { incomeTypes, loading, error, refresh }
}
