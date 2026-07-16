'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Flame, BookOpen, Search, Medal, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserSummary {
  id: string
  name: string | null
  image: string | null
  createdAt: string
  streak: { currentStreak: number; longestStreak?: number } | null
  _count: { studySessions: number; studySets: number }
}

const RANK_STYLES = [
  { bg: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-400 text-white', icon: '🥇' },
  { bg: 'bg-gray-50 border-gray-300', badge: 'bg-gray-400 text-white', icon: '🥈' },
  { bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-400 text-white', icon: '🥉' },
]

function Avatar({ user, size = 'md' }: { user: UserSummary; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
  return (
    <div className={cn('rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 shrink-0 overflow-hidden', sz)}>
      {user.image
        ? <img src={user.image} alt="" className="w-full h-full object-cover" />
        : (user.name?.charAt(0) ?? '?').toUpperCase()}
    </div>
  )
}

function UserCard({ user, rank }: { user: UserSummary; rank: number }) {
  const style = rank <= 3 ? RANK_STYLES[rank - 1] : null
  return (
    <Link href={`/users/${user.id}`}>
      <div className={cn(
        'flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        style ? style.bg : 'bg-white border-gray-200 hover:border-indigo-200'
      )}>
        {/* Rank badge */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
          style ? style.badge : 'bg-gray-100 text-gray-500'
        )}>
          {rank <= 3 ? style!.icon : rank}
        </div>

        <Avatar user={user} size={rank <= 3 ? 'lg' : 'md'} />

        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-gray-900 truncate', rank <= 3 && 'text-base')}>{user.name ?? 'Ẩn danh'}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <BookOpen size={11} /> {user._count.studySets} bộ từ
            </span>
            <span className="flex items-center gap-1">
              <Flame size={11} className="text-orange-400" /> {user.streak?.currentStreak ?? 0} ngày
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl font-extrabold text-indigo-600">{user._count.studySessions}</p>
          <p className="text-xs text-gray-400">phiên học</p>
        </div>
      </div>
    </Link>
  )
}

type Period = 'week' | 'month' | 'all'
const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Tất cả' },
]

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all')
  const [top10, setTop10] = useState<UserSummary[]>([])
  const [searchResults, setSearchResults] = useState<UserSummary[] | null>(null)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(setTop10)
      .finally(() => setIsLoading(false))
  }, [period])

  const handleSearch = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!q.trim() || q.trim().length < 2) {
      setSearchResults(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      setIsSearching(true)
      fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`)
        .then(r => r.json())
        .then(setSearchResults)
        .finally(() => setIsSearching(false))
    }, 400)
  }

  const displayList = searchResults !== null ? searchResults : top10
  const isSearchMode = searchResults !== null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Trophy size={20} className="text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng xếp hạng</h1>
          <p className="text-sm text-gray-500">Top người học chăm chỉ nhất</p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => { setPeriod(p.value); setSearchResults(null); setQuery('') }}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              period === p.value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên người dùng..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2">
        {isSearchMode
          ? <><Users size={16} className="text-gray-400" /><span className="text-sm text-gray-500">Kết quả tìm kiếm</span></>
          : <><Medal size={16} className="text-yellow-500" /><span className="text-sm font-medium text-gray-700">Top 10 người học nhiều nhất {period === 'week' ? '(tuần này)' : period === 'month' ? '(tháng này)' : ''}</span></>
        }
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p>{isSearchMode ? 'Không tìm thấy người dùng nào' : 'Chưa có dữ liệu'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayList.map((user, i) => (
            <UserCard key={user.id} user={user} rank={isSearchMode ? i + 1 : i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
