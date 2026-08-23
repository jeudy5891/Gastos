import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function monthRangeISO(offset) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function sumBetween(table, start, end) {
  const { data, error } = await supabase
    .from(table)
    .select('amount')
    .gte('created_at', start)
    .lt('created_at', end)

  if (error) throw error
  return data.reduce((sum, row) => sum + Number(row.amount), 0)
}

export function useMonthSummary() {
  const [current, setCurrent] = useState({ incomes: 0, expenses: 0 })
  const [previous, setPrevious] = useState({ incomes: 0, expenses: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const thisMonth = monthRangeISO(0)
      const lastMonth = monthRangeISO(-1)

      const [curIncomes, curExpenses, prevIncomes, prevExpenses] = await Promise.all([
        sumBetween('incomes', thisMonth.start, thisMonth.end),
        sumBetween('expenses', thisMonth.start, thisMonth.end),
        sumBetween('incomes', lastMonth.start, lastMonth.end),
        sumBetween('expenses', lastMonth.start, lastMonth.end),
      ])

      setCurrent({ incomes: curIncomes, expenses: curExpenses })
      setPrevious({ incomes: prevIncomes, expenses: prevExpenses })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { current, previous, loading, error, refresh }
}
