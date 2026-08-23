import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    const [
      { data: accountsData, error: accountsError },
      { data: balances, error: balancesError },
      { data: debts, error: debtsError },
    ] = await Promise.all([
      supabase
        .from('accounts')
        .select(
          'id, name, type, cutoff_day, payment_day, initial_debt, note, active, created_at, user_id, profiles(nombre, email)',
        )
        .eq('active', true)
        .order('created_at', { ascending: true }),
      supabase.from('account_balances').select('account_id, balance'),
      supabase.from('credit_account_debt').select('account_id, debt'),
    ])

    if (accountsError || balancesError || debtsError) {
      setError((accountsError ?? balancesError ?? debtsError).message)
      setLoading(false)
      return
    }

    const balanceByAccount = new Map(balances.map((b) => [b.account_id, b.balance]))
    const debtByAccount = new Map(debts.map((d) => [d.account_id, d.debt]))
    setAccounts(
      accountsData.map((account) => ({
        ...account,
        balance: balanceByAccount.get(account.id) ?? 0,
        debt: debtByAccount.get(account.id) ?? account.initial_debt,
      })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { accounts, loading, error, refresh }
}
