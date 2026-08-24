import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { todayISODate } from '../lib/format'

function localMidnightISO(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString()
}

async function sumBetween(table, startISO, endISO) {
  let query = supabase.from(table).select('amount').gte('created_at', startISO)
  if (endISO) query = query.lt('created_at', endISO)
  const { data, error } = await query
  if (error) throw error
  return data.reduce((sum, row) => sum + Number(row.amount), 0)
}

const EMPTY = { incomes: 0, expenses: 0, label: 'Sin definir' }

export function useQuincenaSummary() {
  const [current, setCurrent] = useState(EMPTY)
  const [previous, setPrevious] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data: periods, error: periodsError } = await supabase
        .from('pay_periods')
        .select('mes, quincena, pay_date')
        .order('pay_date', { ascending: true })
      if (periodsError) throw periodsError

      const today = todayISODate()
      let currentIndex = -1
      periods.forEach((period, index) => {
        if (period.pay_date <= today) currentIndex = index
      })

      if (currentIndex === -1) {
        setCurrent(EMPTY)
        setPrevious(EMPTY)
        return
      }

      const currentPeriod = periods[currentIndex]
      const nextPeriod = periods[currentIndex + 1]
      const previousPeriod = periods[currentIndex - 1]

      const currentStart = localMidnightISO(currentPeriod.pay_date)
      const currentEnd = nextPeriod ? localMidnightISO(nextPeriod.pay_date) : null

      const [curIncomes, curExpenses] = await Promise.all([
        sumBetween('incomes', currentStart, currentEnd),
        sumBetween('expenses', currentStart, currentEnd),
      ])
      setCurrent({
        incomes: curIncomes,
        expenses: curExpenses,
        label: `${currentPeriod.mes} · Quincena ${currentPeriod.quincena}`,
      })

      if (previousPeriod) {
        const previousStart = localMidnightISO(previousPeriod.pay_date)
        const [prevIncomes, prevExpenses] = await Promise.all([
          sumBetween('incomes', previousStart, currentStart),
          sumBetween('expenses', previousStart, currentStart),
        ])
        setPrevious({
          incomes: prevIncomes,
          expenses: prevExpenses,
          label: `${previousPeriod.mes} · Quincena ${previousPeriod.quincena}`,
        })
      } else {
        setPrevious(EMPTY)
      }
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
