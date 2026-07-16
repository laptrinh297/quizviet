'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SetCard } from '@/components/sets/set-card'
import { Plus, BookOpen, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface StudySet {
  id: string
  title: string
  description: string | null
  updatedAt: string
  _count: { terms: number }
}

export default function SetsPage() {
  const [sets, setSets] = useState<StudySet[]>([])
  const [filtered, setFiltered] = useState<StudySet[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sets')
      .then(r => r.json())
      .then(data => {
        setSets(data)
        setFiltered(data)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!search) {
      setFiltered(sets)
    } else {
      setFiltered(sets.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }, [search, sets])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bộ từ vựng của tôi</h1>
          <p className="text-gray-500 mt-1">{sets.length} bộ từ vựng</p>
        </div>
        <Link href="/sets/new">
          <Button size="lg">
            <Plus size={18} />
            Tạo mới
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm bộ từ vựng..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(set => (
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
        <div className="text-center py-20">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search ? 'Không tìm thấy bộ từ vựng' : 'Chưa có bộ từ vựng nào'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy tạo bộ từ vựng đầu tiên của bạn'}
          </p>
          {!search && (
            <Link href="/sets/new">
              <Button>
                <Plus size={16} />
                Tạo bộ từ vựng
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
