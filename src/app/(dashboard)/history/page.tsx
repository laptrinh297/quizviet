'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'
import {
  type Period,
  PeriodTabs,
  DayView,
  WeekView,
  MonthView,
  YearView,
} from '@/components/study/history-views'

export default function HistoryPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback((p: Period) => {
    setIsLoading(true)
    fetch(`/api/history?period=${p}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BarChart2 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử học tập</h1>
          <p className="text-sm text-gray-500">Theo dõi tiến độ của bạn theo thời gian</p>
        </div>
      </div>

      <PeriodTabs period={period} onChange={setPeriod} />

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {period === 'day' && <DayView data={data} isOwner />}
              {period === 'week' && <WeekView data={data} />}
              {period === 'month' && <MonthView data={data} />}
              {period === 'year' && <YearView data={data} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
