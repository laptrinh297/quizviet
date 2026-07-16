'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Globe, BookOpen, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/toaster'
import { cn, setUrl } from '@/lib/utils'

interface PublicSet {
  id: string
  title: string
  description: string | null
  updatedAt: string
  _count: { terms: number }
  user: { id: string; name: string | null; image: string | null }
}

interface PaginatedResponse {
  sets: PublicSet[]
  total: number
  page: number
  pages: number
}

export default function ExplorePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [data, setData] = useState<PaginatedResponse>({ sets: [], total: 0, page: 1, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSets = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (q) params.set('q', q)
    const res = await fetch(`/api/explore?${params}`)
    const json = await res.json()
    setData(json)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchSets(page, search)
  }, [page, search, fetchSets])

  const handleSearchInput = (val: string) => {
    setInputValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
    }, 400)
  }

  const handleCopy = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    setCopyingId(id)
    const res = await fetch(`/api/sets/${id}/copy`, { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      showToast('Đã copy vào bộ từ của bạn!', 'success')
      router.push(setUrl(json.id, title))
    } else {
      showToast(json.error || 'Lỗi khi copy', 'error')
    }
    setCopyingId(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Globe size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khám phá</h1>
          <p className="text-sm text-gray-500">Tìm kiếm bộ từ vựng công khai từ cộng đồng</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={inputValue}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="Tìm kiếm bộ từ vựng công khai..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.sets.length === 0 ? (
        <div className="text-center py-20">
          <Globe size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search ? 'Không tìm thấy kết quả' : 'Chưa có bộ từ vựng công khai nào'}
          </h3>
          <p className="text-gray-500">
            {search ? 'Thử tìm với từ khóa khác' : 'Hãy là người đầu tiên chia sẻ bộ từ của bạn!'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.total} bộ từ vựng</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sets.map(set => (
              <div
                key={set.id}
                onClick={() => router.push(setUrl(set.id, set.title))}
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{set.title}</h3>
                  <button
                    onClick={e => handleCopy(e, set.id, set.title)}
                    disabled={copyingId === set.id}
                    title="Copy bộ từ này"
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {set.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{set.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} /> {set._count.terms} thuật ngữ
                  </span>
                  <Link
                    href={`/users/${set.user.id}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] overflow-hidden shrink-0">
                      {set.user.image
                        ? <img src={set.user.image} alt="" className="w-full h-full object-cover" />
                        : (set.user.name?.charAt(0) ?? '?').toUpperCase()}
                    </div>
                    {set.user.name ?? 'Ẩn danh'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    p === page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
