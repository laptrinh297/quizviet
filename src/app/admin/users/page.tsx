'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toaster'
import Link from 'next/link'
import { Users, Lock, Unlock, Shield, User, ChevronRight } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  role: string
  isLocked: boolean
  createdAt: string
  _count: { studySets: number; studySessions: number }
}

export default function AdminUsersPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(setUsers)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const handleToggleLock = async (user: UserData) => {
    const action = user.isLocked ? 'mở khóa' : 'khóa'
    if (!confirm(`Bạn có muốn ${action} tài khoản "${user.email}"?`)) return

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, isLocked: !user.isLocked }),
    })

    if (res.ok) {
      showToast(`Đã ${action} tài khoản`, 'success')
      loadUsers()
    } else {
      showToast('Lỗi khi cập nhật', 'error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-500 mt-1">{users.length} tài khoản</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Bộ từ</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Phiên học</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tham gia</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-indigo-700 text-sm font-semibold">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name || '(chưa đặt tên)'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors ml-1" />
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'admin' ? (
                          <Badge variant="default"><Shield size={10} className="mr-1" /> Admin</Badge>
                        ) : (
                          <Badge variant="secondary"><User size={10} className="mr-1" /> User</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user._count.studySets}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user._count.studySessions}</td>
                      <td className="px-6 py-4">
                        {user.isLocked ? (
                          <Badge variant="destructive">Bị khóa</Badge>
                        ) : (
                          <Badge variant="success">Hoạt động</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant={user.isLocked ? 'outline' : 'destructive'}
                            onClick={() => handleToggleLock(user)}
                          >
                            {user.isLocked ? (
                              <><Unlock size={12} /> Mở khóa</>
                            ) : (
                              <><Lock size={12} /> Khóa</>
                            )}
                          </Button>
                        )}
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
