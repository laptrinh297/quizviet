'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TermEditor, TermPair } from '@/components/sets/term-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toaster'
import { Save, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Folder {
  id: string
  name: string
}

export default function EditSetPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<Folder[]>([])
  const [terms, setTerms] = useState<TermPair[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [csvText, setCsvText] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/sets/${id}`).then(r => r.json()),
      fetch('/api/folders').then(r => r.json()),
    ]).then(([setData, foldersData]) => {
      setTitle(setData.title)
      setDescription(setData.description || '')
      setFolderId(setData.folderId || '')
      setTerms(setData.terms.map((t: any) => ({
        id: t.id,
        term: t.term,
        definition: t.definition,
      })))
      setFolders(foldersData)
    }).finally(() => setIsLoading(false))
  }, [id])

  const handleImport = () => {
    const lines = csvText.trim().split('\n')
    const parsed: TermPair[] = []
    for (const line of lines) {
      const parts = line.split(',')
      if (parts.length >= 2) {
        const term = parts[0].trim()
        const definition = parts.slice(1).join(',').trim()
        if (term && definition) {
          parsed.push({ id: Math.random().toString(36).slice(2), term, definition })
        }
      }
    }
    if (parsed.length > 0) {
      setTerms(prev => [...prev, ...parsed])
      setShowImport(false)
      setCsvText('')
      showToast(`Đã nhập ${parsed.length} thuật ngữ`, 'success')
    } else {
      showToast('Không tìm thấy dữ liệu hợp lệ', 'error')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề', 'error')
      return
    }
    const validTerms = terms.filter(t => t.term.trim() && t.definition.trim())
    if (validTerms.length < 2) {
      showToast('Cần ít nhất 2 thuật ngữ hợp lệ', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/sets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          folderId: folderId || null,
          terms: validTerms.map((t, i) => ({
            term: t.term.trim(),
            definition: t.definition.trim(),
            order: i,
          })),
        }),
      })
      if (res.ok) {
        showToast('Đã lưu thay đổi', 'success')
        router.push(`/sets/${id}`)
      } else {
        const err = await res.json()
        showToast(err.error || 'Lỗi khi lưu', 'error')
      }
    } catch {
      showToast('Đã có lỗi xảy ra', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/sets/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bộ từ vựng</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Tiêu đề *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Tiêu đề bộ từ vựng"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả ngắn..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                rows={3}
              />
            </div>
            {folders.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thư mục</label>
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Không có thư mục</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Thuật ngữ ({terms.filter(t => t.term && t.definition).length})</h2>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                <Upload size={14} />
                Import CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TermEditor terms={terms} onChange={setTerms} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/sets/${id}`}>
            <Button variant="outline">Hủy</Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save size={16} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import từ CSV">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mỗi dòng: <code className="bg-gray-100 px-1 rounded">thuật ngữ,định nghĩa</code>
          </p>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={'Hello,Xin chào\nGoodbye,Tạm biệt'}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 font-mono placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            rows={8}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowImport(false)}>Hủy</Button>
            <Button onClick={handleImport}>Import</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
