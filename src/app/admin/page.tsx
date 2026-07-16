'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Users, BookOpen, Activity, TrendingUp } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalSets: number
  todaySessions: number
  newUsersThisWeek: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setIsLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'bg-blue-100 text-blue-600', pct: 100 },
    { label: 'Tổng bộ từ vựng', value: stats.totalSets, icon: BookOpen, color: 'bg-indigo-100 text-indigo-600', pct: 100 },
    { label: 'Phiên học hôm nay', value: stats.todaySessions, icon: Activity, color: 'bg-green-100 text-green-600', pct: 100 },
    { label: 'Người mới tuần này', value: stats.newUsersThisWeek, icon: TrendingUp, color: 'bg-orange-100 text-orange-600', pct: Math.min(100, (stats.newUsersThisWeek / Math.max(1, stats.totalUsers)) * 100 * 10) },
  ] : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
        <p className="text-gray-500 mt-1">Thống kê và hoạt động của QuizViet</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, pct }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-3xl font-extrabold text-gray-900">{value}</span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-3">{label}</p>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Quản lý nhanh</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a href="/admin/users" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quản lý người dùng</p>
                    <p className="text-xs text-gray-500">Xem, khóa/mở tài khoản</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </a>
              <a href="/admin/content" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BookOpen size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quản lý nội dung</p>
                    <p className="text-xs text-gray-500">Xem và xóa bộ từ vựng</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Thông tin hệ thống</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {stats && [
                { label: 'Tổng người dùng', value: stats.totalUsers },
                { label: 'Bộ từ vựng đang hoạt động', value: stats.totalSets },
                { label: 'Phiên học hôm nay', value: stats.todaySessions },
                { label: 'Người dùng mới tuần này', value: stats.newUsersThisWeek },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
