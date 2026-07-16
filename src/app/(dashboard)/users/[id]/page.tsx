'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, BookOpen, Trophy, ChevronLeft, Zap, BarChart2, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/toaster'
import { cn, setUrl } from '@/lib/utils'
import {
  type Period,
  PeriodTabs,
  DayView,
  WeekView,
  MonthView,
  YearView,
  MODE_LABEL,
} from '@/components/study/history-views'

interface UserProfile {
  user: {
    id: string
    name: string | null
    image: string | null
    createdAt: string
    streak: { currentStreak: number; longestStreak: number; lastStudiedAt: string | null } | null
    _count: { studySessions: number; studySets: number }
  }
  studySets: Array<{
    id: string
    title: string
    description: string | null
    updatedAt: string
    _count: { terms: number }
  }>
  modeBreakdown: Record<string, number>
}

const MODE_COLORS: Record<string, string> = {
  flashcards: 'bg-blue-400',
  learn: 'bg-indigo-500',
  write: 'bg-purple-500',
  test: 'bg-orange-400',
  match: 'bg-green-500',
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [period, setPeriod] = useState<Period>('week')
  const [historyData, setHistoryData] = useState<any>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  // Load profile once
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(d => { if (d) setProfile(d) })
      .finally(() => setIsLoading(false))
  }, [userId])

  // Load history whenever period changes
  const fetchHistory = useCallback((p: Period) => {
    setIsHistoryLoading(true)
    fetch(`/api/users/${userId}?period=${p}`)
      .then(r => r.json())
      .then(setHistoryData)
      .finally(() => setIsHistoryLoading(false))
  }, [userId])

  useEffect(() => {
    fetchHistory(period)
  }, [period, fetchHistory])

  const handleCopySet = async (setId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault()
    setCopyingId(setId)
    try {
      const res = await fetch(`/api/sets/${setId}/copy`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('Đã copy vào bộ từ của bạn!', 'success')
        router.push(setUrl(data.id, title))
      } else {
        showToast(data.error || 'Lỗi khi copy', 'error')
      }
    } finally {
      setCopyingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-500 text-lg mb-4">Không tìm thấy người dùng này</p>
        <Link href="/leaderboard"><Button variant="outline">Quay lại bảng xếp hạng</Button></Link>
      </div>
    )
  }

  const { user, studySets, modeBreakdown } = profile
  const totalModeSessions = Object.values(modeBreakdown).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Bảng xếp hạng
      </Link>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700 shrink-0 overflow-hidden">
              {user.image
                ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                : (user.name?.charAt(0) ?? '?').toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{user.name ?? 'Ẩn danh'}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={16} className="text-orange-500" />
                <span className="text-2xl font-extrabold text-gray-900">{user.streak?.currentStreak ?? 0}</span>
              </div>
              <p className="text-xs text-gray-500">Chuỗi hiện tại</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={16} className="text-yellow-500" />
                <span className="text-2xl font-extrabold text-gray-900">{user.streak?.longestStreak ?? 0}</span>
              </div>
              <p className="text-xs text-gray-500">Chuỗi dài nhất</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={16} className="text-indigo-500" />
                <span className="text-2xl font-extrabold text-gray-900">{user._count.studySessions}</span>
              </div>
              <p className="text-xs text-gray-500">Tổng phiên học</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── History section ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Lịch sử học tập</h2>
        </div>

        <PeriodTabs period={period} onChange={setPeriod} />

        <Card>
          <CardContent className="p-6">
            {isHistoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {period === 'day' && <DayView data={historyData} isOwner={false} />}
                {period === 'week' && <WeekView data={historyData} />}
                {period === 'month' && <MonthView data={historyData} />}
                {period === 'year' && <YearView data={historyData} />}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mode breakdown */}
      {totalModeSessions > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-900">Chế độ học yêu thích</h2>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {Object.entries(modeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([mode, count]) => (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{MODE_LABEL[mode] ?? mode}</span>
                    <span className="text-gray-500">{count} phiên</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full', MODE_COLORS[mode] ?? 'bg-gray-400')}
                      style={{ width: `${(count / totalModeSessions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Study sets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Học phần ({user._count.studySets})</h2>
        </div>
        {studySets.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-400 text-sm">
              Chưa có học phần nào
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {studySets.map(set => (
              <Link key={set.id} href={setUrl(set.id, set.title)}>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{set.title}</p>
                    {set.description && (
                      <p className="text-xs text-gray-400 truncate">{set.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{set._count.terms}</p>
                      <p className="text-xs text-gray-400">từ</p>
                    </div>
                    <button
                      onClick={e => handleCopySet(set.id, set.title, e)}
                      disabled={copyingId === set.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      title="Copy bộ từ này"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
