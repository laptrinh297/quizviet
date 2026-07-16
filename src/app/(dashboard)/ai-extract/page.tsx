'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'
import {
  Sparkles, Link2, FileText, Trash2, ChevronRight,
  BookOpen, AlertCircle, Loader2, Plus, Clock
} from 'lucide-react'
import { cn, setUrl } from '@/lib/utils'

type InputMode = 'url' | 'text'

interface VocabItem {
  id: string
  vocabulary: string
  reading: string
  meaning: string
  order: number
}

interface VocabSet {
  id: string
  title: string
  sourceType: string
  sourcePreview: string
  itemCount: number
  createdAt: string
  items?: VocabItem[]
}

export default function AIExtractPage() {
  const router = useRouter()
  const { showToast } = useToast()

  // Config state
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)

  // Input state
  const [mode, setMode]       = useState<InputMode>('url')
  const [urlInput, setUrlInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [titleInput, setTitleInput] = useState('')

  // Result state
  const [result, setResult]   = useState<VocabSet | null>(null)
  const [loading, setLoading] = useState(false)

  // History state
  const [history, setHistory]   = useState<VocabSet[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<VocabItem[]>([])
  const [loadingExpand, setLoadingExpand] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    checkConfig()
    loadHistory()
  }, [])

  async function checkConfig() {
    try {
      const res = await fetch('/api/ai/config')
      if (!res.ok) { setIsConfigured(false); return }
      const data = await res.json()
      setIsConfigured(!!data.configured)
    } catch {
      setIsConfigured(false)
    }
  }

  async function loadHistory() {
    const res = await fetch('/api/ai/vocab-sets')
    if (res.ok) setHistory(await res.json())
  }

  async function handleExtract() {
    const input = mode === 'url' ? urlInput.trim() : textInput.trim()
    if (!input) {
      showToast(mode === 'url' ? 'Vui lòng nhập URL' : 'Vui lòng nhập văn bản', 'error')
      return
    }
    if (mode === 'url') {
      try { new URL(input) }
      catch { showToast('URL không hợp lệ', 'error'); return }
    }
    if (mode === 'text' && input.length < 20) {
      showToast('Văn bản quá ngắn (tối thiểu 20 ký tự)', 'error'); return
    }

    setLoading(true)
    setResult(null)

    try {
      const body: Record<string, string> = {}
      if (mode === 'url')  body.url  = input
      if (mode === 'text') body.text = input
      if (titleInput.trim()) body.title = titleInput.trim()

      const res  = await fetch('/api/ai/extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        setResult(data)
        setTitleInput('')
        if (mode === 'url')  setUrlInput('')
        if (mode === 'text') setTextInput('')
        loadHistory()
        showToast(`Đã trích xuất ${data.itemCount} từ vựng!`, 'success')
      } else {
        showToast(data.error || 'Lỗi trích xuất', 'error')
      }
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setLoadingExpand(true)
    try {
      const res = await fetch(`/api/ai/vocab-sets/${id}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedItems(data.items ?? [])
      }
    } finally {
      setLoadingExpand(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa bộ từ vựng này?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/ai/vocab-sets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setHistory(h => h.filter(s => s.id !== id))
        if (expandedId === id) setExpandedId(null)
        if (result?.id === id) setResult(null)
        showToast('Đã xóa', 'success')
      }
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSaveAsSet(vocabSet: VocabSet) {
    // Need to load items if not already available
    let items = vocabSet.items
    if (!items) {
      const res = await fetch(`/api/ai/vocab-sets/${vocabSet.id}`)
      const data = await res.json()
      items = data.items ?? []
    }
    if (!items || items.length < 2) {
      showToast('Cần ít nhất 2 từ để tạo bộ thẻ', 'error'); return
    }

    setSavingId(vocabSet.id)
    try {
      const res = await fetch('/api/sets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title: vocabSet.title,
          description: `Trích xuất bằng AI từ ${vocabSet.sourceType === 'url' ? vocabSet.sourcePreview : 'văn bản'}`,
          terms: items.map((item, i) => ({
            term:       item.vocabulary,
            definition: `${item.reading} — ${item.meaning}`,
            order:      i,
          })),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Đã lưu thành bộ thẻ!', 'success')
        router.push(setUrl(data.id, vocabSet.title))
      } else {
        showToast(data.error || 'Lỗi tạo bộ thẻ', 'error')
      }
    } finally {
      setSavingId(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trích xuất Từ vựng AI</h1>
          <p className="text-sm text-gray-500">Dán URL bài đọc hoặc văn bản tiếng Nhật để AI tự động trích xuất từ vựng</p>
        </div>
      </div>

      {/* Config warning */}
      {isConfigured === false && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Chưa cấu hình API key</p>
            <p className="text-amber-700 mt-0.5">
              Vào{' '}
              <Link href="/ai-settings" className="underline font-medium">Cài đặt AI</Link>
              {' '}để thiết lập provider và API key trước khi sử dụng.
            </p>
          </div>
        </div>
      )}

      {/* Input card */}
      <Card>
        <CardContent className="p-5 space-y-4">

          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setMode('url')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                mode === 'url'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Link2 size={14} /> URL
            </button>
            <button
              onClick={() => setMode('text')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                mode === 'text'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <FileText size={14} /> Văn bản
            </button>
          </div>

          {/* URL input */}
          {mode === 'url' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                URL trang web tiếng Nhật
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && handleExtract()}
                placeholder="https://www3.nhk.or.jp/news/..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Hỗ trợ: NHK Web Easy, Wikipedia tiếng Nhật, blog, báo...
              </p>
            </div>
          )}

          {/* Text input */}
          {mode === 'text' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Dán văn bản tiếng Nhật
              </label>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="日本語のテキストをここに貼り付けてください..."
                rows={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {textInput.length} ký tự{textInput.length > 8000 && <span className="text-amber-500"> · Chỉ 8000 ký tự đầu được gửi</span>}
              </p>
            </div>
          )}

          {/* Optional title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Tên bộ từ vựng <span className="font-normal text-gray-400">(tùy chọn)</span>
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              placeholder="Để trống sẽ tự đặt tên theo nguồn..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <Button
            onClick={handleExtract}
            disabled={loading || isConfigured === false}
            className="w-full"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Đang trích xuất...</>
              : <><Sparkles size={15} /> Trích xuất Từ vựng</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{result.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {result.itemCount} từ vựng được trích xuất
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSaveAsSet(result)}
                disabled={savingId === result.id}
                className="shrink-0"
              >
                {savingId === result.id
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Plus size={13} />
                }
                Lưu thành bộ thẻ
              </Button>
            </div>
            <VocabTable items={result.items ?? []} />
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Clock size={14} />
            Bộ từ vựng đã trích xuất ({history.length})
          </div>

          {history.map(set => (
            <Card key={set.id} className={cn(expandedId === set.id && 'border-indigo-200')}>
              <CardContent className="p-0">
                {/* Set header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    {set.sourceType === 'url'
                      ? <Link2 size={14} className="text-purple-500" />
                      : <FileText size={14} className="text-purple-500" />}
                  </div>

                  <button
                    onClick={() => handleExpand(set.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{set.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {set.itemCount} từ · {new Date(set.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveAsSet(set)}
                      disabled={savingId === set.id}
                      className="text-xs h-7 px-2.5"
                    >
                      {savingId === set.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <><BookOpen size={11} /> Tạo bộ thẻ</>
                      }
                    </Button>
                    <button
                      onClick={() => handleDelete(set.id)}
                      disabled={deletingId === set.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      {deletingId === set.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                    <button
                      onClick={() => handleExpand(set.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronRight size={14} className={cn('transition-transform', expandedId === set.id && 'rotate-90')} />
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {expandedId === set.id && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {loadingExpand
                      ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-indigo-500" /></div>
                      : <VocabTable items={expandedItems} compact />
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty history */}
      {history.length === 0 && !loading && (
        <div className="text-center py-10 text-gray-400">
          <Sparkles size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có bộ từ vựng nào. Dán URL hoặc văn bản để bắt đầu!</p>
        </div>
      )}
    </div>
  )
}

// ── Vocab table component ────────────────────────────────────────────────────

function VocabTable({ items, compact = false }: { items: VocabItem[]; compact?: boolean }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 py-2">Không có từ vựng</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-6">#</th>
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Từ vựng</th>
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cách đọc</th>
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nghĩa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className={cn('px-2 text-gray-300 tabular-nums', compact ? 'py-1.5' : 'py-2.5')}>
                {i + 1}
              </td>
              <td className={cn('px-2 font-medium text-gray-900', compact ? 'py-1.5 text-base' : 'py-2.5 text-lg')}>
                {item.vocabulary}
              </td>
              <td className={cn('px-2 text-indigo-600', compact ? 'py-1.5' : 'py-2.5')}>
                {item.reading}
              </td>
              <td className={cn('px-2 text-gray-500', compact ? 'py-1.5' : 'py-2.5')}>
                {item.meaning}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
