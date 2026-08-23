import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useCreditPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('credit_payments')
      .select('id, payment_date, amount, user_id, account_id, accounts(name), profiles(nombre, email)')
      .order('payment_date', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPayments(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { payments, loading, error, refresh }
}
