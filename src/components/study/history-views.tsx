'use client'

import { BookOpen, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Period = 'day' | 'week' | 'month' | 'year'

export const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm này' },
]

export const MODE_LABEL: Record<string, string> = {
  flashcards: 'Thẻ ghi nhớ',
  learn: 'Học',
  write: 'Tự luận',
  test: 'Kiểm tra',
  match: 'Ghép thẻ',
}

const HEAT_COLORS = [
  'bg-gray-100',
  'bg-indigo-100',
  'bg-indigo-300',
  'bg-indigo-500',
  'bg-indigo-700',
]

function getHeatLevel(count: number, max: number): number {
  if (count === 0 || max === 0) return 0
  const ratio = count / max
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}

// ──────────────────────────────────────────────
// Period Tabs
// ──────────────────────────────────────────────
export function PeriodTabs({
  period,
  onChange,
}: {
  period: Period
  onChange: (p: Period) => void
}) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {PERIOD_LABELS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            period === value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Day View
// ──────────────────────────────────────────────
export function DayView({ data, isOwner = true }: { data: any; isOwner?: boolean }) {
  const sessions = data?.sessions ?? []

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CalendarDays size={48} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">
          {isOwner ? 'Hôm nay chưa có phiên học nào' : 'Hôm nay người dùng này chưa học'}
        </p>
        {isOwner && <p className="text-sm mt-1">Hãy bắt đầu học ngay!</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{sessions.length} phiên học hôm nay</p>
      {sessions.map((s: any) => (
        <div key={s.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{s.studySet?.title ?? '—'}</p>
            <p className="text-xs text-gray-500">{MODE_LABEL[s.mode] ?? s.mode}</p>
          </div>
          {s.score != null && s.total != null && (
            <div className="text-right shrink-0">
              <p className="font-bold text-indigo-600">{Math.round((s.score / s.total) * 100)}%</p>
              <p className="text-xs text-gray-400">{s.score}/{s.total}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 shrink-0">
            {new Date(s.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Week View
// ──────────────────────────────────────────────
export function WeekView({ data }: { data: any }) {
  const days: any[] = data?.days ?? []
  const max = Math.max(...days.map((d: any) => d.count), 1)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Tổng: <strong className="text-gray-900">{data?.total ?? 0}</strong> phiên trong tuần
      </p>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-40">
        {days.map((day: any) => {
          const heightPct = max > 0 ? (day.count / max) * 100 : 0
          const isToday = day.date === today
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-600">{day.count > 0 ? day.count : ''}</span>
              <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all',
                    isToday ? 'bg-indigo-600' : 'bg-indigo-300',
                    day.count === 0 && 'bg-gray-100'
                  )}
                  style={{ height: day.count === 0 ? '4px' : `${Math.max(heightPct, 8)}%` }}
                />
              </div>
              <span className={cn('text-xs', isToday ? 'font-bold text-indigo-700' : 'text-gray-500')}>
                {day.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Day detail list */}
      <div className="space-y-2">
        {days.filter((d: any) => d.count > 0).map((day: any) => (
          <div key={day.date} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={cn('w-2 h-2 rounded-full', day.date === today ? 'bg-indigo-600' : 'bg-indigo-300')} />
              <span className="text-sm font-medium text-gray-900">{day.label}</span>
              <span className="text-xs text-gray-400">{new Date(day.date).toLocaleDateString('vi-VN')}</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600">{day.count} phiên</span>
          </div>
        ))}
        {days.every((d: any) => d.count === 0) && (
          <p className="text-center text-gray-400 text-sm py-6">Tuần này chưa có phiên học nào</p>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Month View
// ──────────────────────────────────────────────
export function MonthView({ data }: { data: any }) {
  const days: any[] = data?.days ?? []
  const firstDayOffset: number = data?.firstDayOffset ?? 0
  const max = Math.max(...days.map((d: any) => d.count), 1)
  const today = new Date().toISOString().slice(0, 10)
  const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  const cells: (null | { day: number; date: string; count: number })[] = [
    ...Array(firstDayOffset).fill(null),
    ...days,
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">{data?.monthLabel}</p>
        <p className="text-sm text-gray-500">
          Tổng: <strong className="text-gray-900">{data?.total ?? 0}</strong> phiên
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayHeaders.map(h => (
          <div key={h} className="text-xs font-medium text-gray-400 py-1">{h}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />
          const level = getHeatLevel(cell.count, max)
          const isToday = cell.date === today
          return (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} phiên`}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors',
                HEAT_COLORS[level],
                level === 0 ? 'text-gray-400' : level >= 3 ? 'text-white' : 'text-indigo-800',
                isToday && 'ring-2 ring-indigo-500 ring-offset-1'
              )}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 justify-end">
        <span>Ít</span>
        {HEAT_COLORS.map((c, i) => (
          <div key={i} className={cn('w-4 h-4 rounded', c, i === 0 && 'border border-gray-200')} />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Year View
// ──────────────────────────────────────────────
export function YearView({ data }: { data: any }) {
  const countByDate: Record<string, number> = data?.countByDate ?? {}
  const months: { label: string; count: number }[] = data?.months ?? []
  const year: number = data?.year ?? new Date().getFullYear()
  const max = Math.max(...Object.values(countByDate), 1)
  const monthMax = Math.max(...months.map(m => m.count), 1)
  const today = new Date().toISOString().slice(0, 10)
  const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

  // Build 52-week heatmap
  const jan1 = new Date(year, 0, 1)
  const jan1Offset = jan1.getDay() === 0 ? 6 : jan1.getDay() - 1
  const totalDays = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365
  const weeks: (string | null)[][] = []
  let week: (string | null)[] = Array(jan1Offset).fill(null)

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(year, 0, i + 1)
    const dateStr = d.toISOString().slice(0, 10)
    week.push(dateStr)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">Năm {year}</p>
        <p className="text-sm text-gray-500">
          Tổng: <strong className="text-gray-900">{data?.total ?? 0}</strong> phiên
        </p>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {weeks.map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {wk.map((dateStr, di) => {
                if (!dateStr) return <div key={di} className="w-3 h-3" />
                const count = countByDate[dateStr] ?? 0
                const level = getHeatLevel(count, max)
                const isToday = dateStr === today
                return (
                  <div
                    key={dateStr}
                    title={`${dateStr}: ${count} phiên`}
                    className={cn(
                      'w-3 h-3 rounded-sm',
                      HEAT_COLORS[level],
                      level === 0 && 'border border-gray-200',
                      isToday && 'ring-1 ring-indigo-500'
                    )}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 justify-end mt-2">
          <span>Ít</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-sm', c, i === 0 && 'border border-gray-200')} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Phiên học theo tháng</p>
        <div className="flex items-end gap-2 h-32">
          {months.map((m, i) => {
            const heightPct = monthMax > 0 ? (m.count / monthMax) * 100 : 0
            const isCurrentMonth = i === new Date().getMonth() && year === new Date().getFullYear()
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{m.count > 0 ? m.count : ''}</span>
                <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      isCurrentMonth ? 'bg-indigo-600' : 'bg-indigo-300',
                      m.count === 0 && 'bg-gray-100'
                    )}
                    style={{ height: m.count === 0 ? '4px' : `${Math.max(heightPct, 8)}%` }}
                  />
                </div>
                <span className={cn('text-xs', isCurrentMonth ? 'font-bold text-indigo-700' : 'text-gray-400')}>
                  {monthLabels[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
