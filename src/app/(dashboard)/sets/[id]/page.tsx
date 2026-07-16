'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toaster'
import { setUrl } from '@/lib/utils'
import {
  ArrowLeft, BookOpen, Brain, PenLine, BarChart3, Zap,
  Edit3, Trash2, Clock, ChevronDown, ChevronUp, Globe, Lock, Copy, Share2
} from 'lucide-react'

interface Term {
  id: string
  term: string
  definition: string
  order: number
}

interface StudySet {
  id: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
  isPublic: boolean
  userId: string
  terms: Term[]
  user: { name: string | null; email: string }
}

export default function SetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [set, setSet] = useState<StudySet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAllTerms, setShowAllTerms] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingPublic, setIsTogglingPublic] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const handleShare = () => {
    const url = `${window.location.origin}${set ? setUrl(id, set.title) : `/sets/${id}`}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Đã copy link chia sẻ!', 'success'))
    } else {
      showToast(url, 'success')
    }
  }

  const id = (params.id as string).split('-')[0]

  useEffect(() => {
    fetch(`/api/sets/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(setSet)
      .catch(() => router.push('/sets'))
      .finally(() => setIsLoading(false))
  }, [id, router])

  const handleTogglePublic = async () => {
    if (!set) return
    setIsTogglingPublic(true)
    try {
      const res = await fetch(`/api/sets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: set.title,
          description: set.description,
          folderId: null,
          terms: set.terms.map((t, i) => ({ term: t.term, definition: t.definition, order: i })),
          isPublic: !set.isPublic,
        }),
      })
      if (res.ok) {
        setSet(s => s ? { ...s, isPublic: !s.isPublic } : s)
        showToast(!set.isPublic ? 'Đã đặt công khai' : 'Đã đặt riêng tư', 'success')
      }
    } finally {
      setIsTogglingPublic(false)
    }
  }

  const handleCopy = async () => {
    setIsCopying(true)
    try {
      const res = await fetch(`/api/sets/${id}/copy`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('Đã copy vào bộ từ của bạn!', 'success')
        router.push(setUrl(data.id, set?.title ?? ''))
      } else {
        showToast(data.error || 'Lỗi khi copy', 'error')
      }
    } finally {
      setIsCopying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bộ từ vựng này không?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/sets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Đã xóa bộ từ vựng', 'success')
        router.push('/sets')
      } else {
        showToast('Lỗi khi xóa', 'error')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!set) return null

  const displayTerms = showAllTerms ? set.terms : set.terms.slice(0, 10)

  const studyModes = [
    { icon: BookOpen, label: 'Thẻ ghi nhớ', href: `/study/${id}/flashcards`, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200' },
    { icon: Brain, label: 'Học', href: `/study/${id}/learn`, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200' },
    { icon: PenLine, label: 'Tự luận', href: `/study/${id}/write`, color: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200' },
    { icon: BarChart3, label: 'Kiểm tra', href: `/study/${id}/test`, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200' },
    { icon: Zap, label: 'Ghép thẻ', href: `/study/${id}/match`, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-200' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Row 1: back + title + actions */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/sets" className="text-gray-400 hover:text-gray-600 shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1 min-w-0 truncate">{set.title}</h1>
          <div className="flex items-center gap-1.5 shrink-0">
            {set.userId === session?.user?.id ? (
              <>
                <button
                  onClick={handleShare}
                  title="Chia sẻ link"
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={handleTogglePublic}
                  disabled={isTogglingPublic}
                  title={set.isPublic ? 'Đang công khai — nhấn để đặt riêng tư' : 'Đang riêng tư — nhấn để công khai'}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    set.isPublic
                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {set.isPublic ? <Globe size={16} /> : <Lock size={16} />}
                </button>
                <Link href={`${setUrl(id, set.title)}/edit`}>
                  <button className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <Edit3 size={16} />
                  </button>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={handleCopy}
                disabled={isCopying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                <Copy size={14} />
                {isCopying ? 'Đang copy...' : 'Copy bộ từ'}
              </button>
            )}
          </div>
        </div>
        {/* Row 2: meta */}
        <div className="flex items-center gap-3 pl-9 flex-wrap">
          <Badge>{set.terms.length} thuật ngữ</Badge>
          {set.isPublic && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <Globe size={11} /> Công khai
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            {new Date(set.updatedAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>

      {set.description && (
        <p className="text-gray-600 mb-6">{set.description}</p>
      )}

      {/* Study Modes */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Chế độ học</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {studyModes.map(({ icon: Icon, label, href, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${color}`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium text-center">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms List */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Danh sách thuật ngữ</h2>
          <div className="space-y-2">
            {displayTerms.map((term, index) => (
              <div
                key={term.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-xs font-medium text-gray-400 mt-0.5 w-5 text-center shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{term.term}</p>
                  </div>
                  <div className="border-l-0 sm:border-l border-gray-200 sm:pl-4">
                    <p className="text-gray-600">{term.definition}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {set.terms.length > 10 && (
            <button
              onClick={() => setShowAllTerms(!showAllTerms)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2"
            >
              {showAllTerms ? (
                <>Ẩn bớt <ChevronUp size={16} /></>
              ) : (
                <>Xem tất cả {set.terms.length} thuật ngữ <ChevronDown size={16} /></>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
