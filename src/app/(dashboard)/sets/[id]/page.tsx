'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toaster'
import {
  ArrowLeft, BookOpen, Brain, PenLine, BarChart3, Zap,
  Edit3, Trash2, Clock, ChevronDown, ChevronUp
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
  terms: Term[]
  user: { name: string | null; email: string }
}

export default function SetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [set, setSet] = useState<StudySet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAllTerms, setShowAllTerms] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const id = params.id as string

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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sets" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{set.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge>{set.terms.length} thuật ngữ</Badge>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {new Date(set.updatedAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sets/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit3 size={14} />
              Chỉnh sửa
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={14} />
            {isDeleting ? '...' : 'Xóa'}
          </Button>
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
