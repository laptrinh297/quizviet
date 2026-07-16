'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toaster'
import { BookOpen, Trash2, Search } from 'lucide-react'

interface SetData {
  id: string
  title: string
  description: string | null
  isDeleted: boolean
  createdAt: string
  user: { name: string | null; email: string }
  _count: { terms: number }
}

export default function AdminContentPage() {
  const { showToast } = useToast()
  const [sets, setSets] = useState<SetData[]>([])
  const [filtered, setFiltered] = useState<SetData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadSets = () => {
    fetch('/api/admin/sets')
      .then(r => r.json())
      .then(data => {
        setSets(data)
        setFiltered(data)
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { loadSets() }, [])

  useEffect(() => {
    if (!search) {
      setFiltered(sets)
    } else {
      setFiltered(sets.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.user.email.toLowerCase().includes(search.toLowerCase()) ||
        s.user.name?.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }, [search, sets])

  const handleDelete = async (set: SetData) => {
    if (!confirm(`Xóa vĩnh viễn bộ từ vựng "${set.title}"? Hành động này không thể hoàn tác.`)) return

    const res = await fetch('/api/admin/sets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId: set.id }),
    })

    if (res.ok) {
      showToast('Đã xóa bộ từ vựng', 'success')
      loadSets()
    } else {
      showToast('Lỗi khi xóa', 'error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung</h1>
        <p className="text-gray-500 mt-1">{sets.length} bộ từ vựng</p>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề hoặc tác giả..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không tìm thấy bộ từ vựng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Số từ</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(set => (
                    <tr key={set.id} className={`hover:bg-gray-50 transition-colors ${set.isDeleted ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{set.title}</p>
                        {set.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{set.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{set.user.name || '—'}</p>
                          <p className="text-xs text-gray-500">{set.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{set._count.terms}</td>
                      <td className="px-6 py-4">
                        {set.isDeleted ? (
                          <Badge variant="destructive">Đã xóa</Badge>
                        ) : (
                          <Badge variant="success">Hoạt động</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(set.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(set)}
                        >
                          <Trash2 size={12} />
                          Xóa
                        </Button>
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
