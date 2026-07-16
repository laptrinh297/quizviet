'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Calendar, Flame, Trophy, User, Clock } from 'lucide-react'

const MODE_LABEL: Record<string, string> = {
  flashcard: 'Flashcard',
  quiz: 'Trắc nghiệm',
  typing: 'Gõ từ',
  matching: 'Nối từ',
  learn: 'Học',
}

interface SessionItem {
  id: string
  mode: string
  score: number | null
  total: number | null
  createdAt: string
  studySet: { id: string; title: string }
}

interface UserDetail {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  isLocked: boolean
  createdAt: string
  streak: { currentStreak: number; longestStreak: number; lastStudiedAt: string | null } | null
  _count: { studySets: number; studySessions: number; knownTerms: number }
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setSessions(data.sessions)
        }
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <p className="text-gray-500">Không tìm thấy người dùng.</p>
  }

  const statCards = [
    { label: 'Bộ từ vựng', value: user._count.studySets, icon: BookOpen, color: 'text-indigo-600' },
    { label: 'Phiên học', value: user._count.studySessions, icon: Clock, color: 'text-emerald-600' },
    { label: 'Từ đã thuộc', value: user._count.knownTerms, icon: Trophy, color: 'text-amber-600' },
    { label: 'Streak hiện tại', value: user.streak?.currentStreak ?? 0, icon: Flame, color: 'text-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={16} /> Danh sách người dùng
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
            {user.image
              ? <img src={user.image} alt="" className="w-full h-full object-cover" />
              : <span className="text-indigo-700 text-xl font-bold">{user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || '(chưa đặt tên)'}</h1>
              {user.role === 'admin'
                ? <Badge variant="default">Admin</Badge>
                : user.isLocked
                  ? <Badge variant="destructive">Bị khóa</Badge>
                  : <Badge variant="secondary">User</Badge>
              }
            </div>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              {user.streak?.lastStudiedAt && (
                <> · Học lần cuối: {new Date(user.streak.lastStudiedAt).toLocaleDateString('vi-VN')}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${color} bg-current/10 rounded-lg p-2`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Streak detail */}
      {user.streak && user.streak.longestStreak > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-6">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame size={20} />
              <span className="font-semibold">Streak dài nhất: {user.streak.longestStreak} ngày</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study history */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Lịch sử học ({sessions.length} phiên)</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có phiên học nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bộ từ</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chế độ</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-3 text-gray-900 max-w-xs truncate">
                        {s.studySet.title}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant="secondary">{MODE_LABEL[s.mode] ?? s.mode}</Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {s.score != null && s.total != null
                          ? <span className={s.score / s.total >= 0.8 ? 'text-emerald-600 font-medium' : ''}>
                              {s.score}/{s.total} ({Math.round(s.score / s.total * 100)}%)
                            </span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
