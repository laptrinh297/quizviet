'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SetCard } from '@/components/sets/set-card'
import { Flame, BookOpen, Plus, TrendingUp, Clock, Trophy } from 'lucide-react'

interface DashboardData {
  streak: {
    currentStreak: number
    longestStreak: number
    lastStudiedAt: string | null
  }
  recentSets: Array<{
    id: string
    title: string
    description: string | null
    updatedAt: string
    _count: { terms: number }
  }>
  totalSets: number
  totalTerms: number
  todaySessions: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {session?.user?.name || 'bạn'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Tiếp tục hành trình học tập của bạn</p>
        </div>
        <Link href="/sets/new">
          <Button size="lg">
            <Plus size={18} />
            Tạo bộ từ vựng mới
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.streak.currentStreak ?? 0}</p>
                <p className="text-xs text-gray-500">Chuỗi ngày</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.streak.longestStreak ?? 0}</p>
                <p className="text-xs text-gray-500">Chuỗi dài nhất</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.totalSets ?? 0}</p>
                <p className="text-xs text-gray-500">Bộ từ vựng</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.totalTerms ?? 0}</p>
                <p className="text-xs text-gray-500">Tổng từ vựng</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Info */}
      {data && (
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={24} className="text-white" />
                  <span className="text-2xl font-bold">{data.streak.currentStreak} ngày liên tiếp</span>
                </div>
                <p className="text-orange-100">
                  {data.streak.lastStudiedAt
                    ? `Học lần cuối: ${new Date(data.streak.lastStudiedAt).toLocaleDateString('vi-VN')}`
                    : 'Chưa học ngày nào. Hãy bắt đầu hôm nay!'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-orange-200 text-sm">Kỷ lục</p>
                <p className="text-3xl font-bold">{data.streak.longestStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bộ từ vựng gần đây</h2>
          <Link href="/sets" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Xem tất cả
          </Link>
        </div>

        {data?.recentSets && data.recentSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentSets.map(set => (
              <SetCard
                key={set.id}
                id={set.id}
                title={set.title}
                description={set.description}
                termCount={set._count.terms}
                updatedAt={set.updatedAt}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Bạn chưa có bộ từ vựng nào</p>
              <Link href="/sets/new">
                <Button>
                  <Plus size={16} />
                  Tạo bộ từ vựng đầu tiên
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Today sessions */}
      {data && data.todaySessions > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-700">
              Hôm nay bạn đã học <strong>{data.todaySessions}</strong> phiên. Tiếp tục cố gắng!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
