'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TermEditor, TermPair } from '@/components/sets/term-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toaster'
import { ImportModal } from '@/components/sets/import-modal'
import { Save, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Folder {
  id: string
  name: string
}

export default function NewSetPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<Folder[]>([])
  const [terms, setTerms] = useState<TermPair[]>([
    { id: '1', term: '', definition: '' },
    { id: '2', term: '', definition: '' },
    { id: '3', term: '', definition: '' },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    fetch('/api/folders').then(r => r.json()).then(setFolders)
  }, [])

  const handleImport = (parsed: TermPair[]) => {
    setTerms(prev => {
      const existing = prev.filter(t => t.term || t.definition)
      return [...existing, ...parsed]
    })
    showToast(`Đã nhập ${parsed.length} thuật ngữ`, 'success')
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bộ từ vựng', 'error')
      return
    }

    const validTerms = terms.filter(t => t.term.trim() && t.definition.trim())
    if (validTerms.length < 2) {
      showToast('Cần ít nhất 2 thuật ngữ hợp lệ', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          folderId: folderId || null,
          terms: validTerms.map((t, i) => ({ term: t.term.trim(), definition: t.definition.trim(), order: i })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        showToast('Tạo bộ từ vựng thành công!', 'success')
        router.push(`/sets/${data.id}`)
      } else {
        const err = await res.json()
        showToast(err.error || 'Lỗi khi tạo bộ từ vựng', 'error')
      }
    } catch {
      showToast('Đã có lỗi xảy ra', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sets" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tạo bộ từ vựng mới</h1>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Tiêu đề *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Từ vựng Tiếng Anh cơ bản"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về bộ từ vựng này..."
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
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

        {/* Terms */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Thuật ngữ ({terms.filter(t => t.term && t.definition).length} hợp lệ)</h2>
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/sets">
            <Button variant="outline">Hủy</Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save size={16} />
            {isSaving ? 'Đang lưu...' : 'Lưu bộ từ vựng'}
          </Button>
        </div>
      </div>

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
    </div>
  )
}
