'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Search, Trash2, ChevronLeft, ChevronRight, RotateCcw, Globe, Lock, Share2, Clock, ArrowRight } from 'lucide-react'
import { cn, setUrl } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'

interface StudySet {
  id: string
  title: string
  description: string | null
  updatedAt: string
  isPublic: boolean
  _count: { terms: number }
}

interface PaginatedResponse {
  sets: StudySet[]
  total: number
  page: number
  pages: number
}

type Tab = 'mine' | 'trash'

export default function SetsPage() {
  const [tab, setTab] = useState<Tab>('mine')
  const [data, setData] = useState<PaginatedResponse>({ sets: [], total: 0, page: 1, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const { showToast } = useToast()

  const fetchSets = useCallback(async (p: number, q: string, t: Tab) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (t === 'trash') params.set('trashed', 'true')
    if (q) params.set('q', q)
    const res = await fetch(`/api/sets?${params}`)
    const json = await res.json()
    setData(json)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchSets(page, search, tab)
  }, [page, search, tab, fetchSets])

  const handleSearchInput = (val: string) => {
    setInputValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
    }, 400)
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setPage(1)
    setSearch('')
    setInputValue('')
  }

  const handleRestore = async (id: string) => {
    setRestoringId(id)
    const res = await fetch(`/api/sets/${id}/restore`, { method: 'POST' })
    if (res.ok) {
      showToast('Đã khôi phục bộ từ vựng', 'success')
      fetchSets(page, search, tab)
    } else {
      showToast('Không thể khôi phục', 'error')
    }
    setRestoringId(null)
  }

  const handleTogglePublic = async (set: StudySet) => {
    setTogglingId(set.id)
    const res = await fetch(`/api/sets/${set.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: set.title,
        description: set.description,
        isPublic: !set.isPublic,
      }),
    })
    if (res.ok) {
      showToast(set.isPublic ? 'Đã chuyển sang riêng tư' : 'Đã công khai bộ từ', 'success')
      setData(prev => ({
        ...prev,
        sets: prev.sets.map(s => s.id === set.id ? { ...s, isPublic: !s.isPublic } : s),
      }))
    } else {
      showToast('Không thể thay đổi', 'error')
    }
    setTogglingId(null)
  }

  const handleShare = (set: StudySet) => {
    const url = `${window.location.origin}${setUrl(set.id, set.title)}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Đã copy link chia sẻ!', 'success'))
    } else {
      showToast(url, 'success')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bộ từ vựng của tôi</h1>
          <p className="text-gray-500 mt-1">{data.total} bộ từ vựng</p>
        </div>
        <Link href="/sets/new">
          <Button size="lg">
            <Plus size={18} />
            Tạo mới
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        <button
          onClick={() => switchTab('mine')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
            tab === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <BookOpen size={14} /> Của tôi
        </button>
        <button
          onClick={() => switchTab('trash')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
            tab === 'trash' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Trash2 size={14} /> Thùng rác
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={inputValue}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="Tìm kiếm bộ từ vựng..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.sets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sets.map(set =>
              tab === 'trash' ? (
                <div key={set.id} className="relative group">
                  <div className="opacity-70 pointer-events-none">
                    <SetCardStatic set={set} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(set.id)}
                      disabled={restoringId === set.id}
                      className="bg-white"
                    >
                      <RotateCcw size={14} />
                      {restoringId === set.id ? 'Đang khôi phục...' : 'Khôi phục'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={set.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow group flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={setUrl(set.id, set.title)} className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                          {set.title}
                        </h3>
                      </Link>
                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleShare(set)}
                          title="Copy link chia sẻ"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          onClick={() => handleTogglePublic(set)}
                          disabled={togglingId === set.id}
                          title={set.isPublic ? 'Chuyển riêng tư' : 'Công khai'}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors disabled:opacity-50',
                            set.isPublic
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          {set.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                        </button>
                      </div>
                    </div>

                    {set.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{set.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                      <div className="flex items-center gap-1">
                        <BookOpen size={12} />
                        <span>{set._count.terms} thuật ngữ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(set.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>
                      {set.isPublic && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Globe size={11} /> Công khai
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <Link
                      href={setUrl(set.id, set.title)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Học ngay
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            )}
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
      ) : (
        <div className="text-center py-20">
          {tab === 'trash' ? (
            <>
              <Trash2 size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Thùng rác trống</h3>
              <p className="text-gray-500">Các bộ từ đã xóa sẽ xuất hiện ở đây</p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SetCardStatic({ set }: { set: StudySet }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 truncate mb-1">{set.title}</h3>
      {set.description && <p className="text-sm text-gray-500 line-clamp-2">{set.description}</p>}
      <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
        <BookOpen size={12} />
        <span>{set._count.terms} thuật ngữ</span>
      </div>
    </div>
  )
}
