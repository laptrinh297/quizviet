'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toaster'
import { Folder, Plus, BookOpen, Trash2, Edit3, ArrowRight } from 'lucide-react'

interface FolderItem {
  id: string
  name: string
  createdAt: string
  _count: { studySets: number }
}

export default function FoldersPage() {
  const { showToast } = useToast()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editFolder, setEditFolder] = useState<FolderItem | null>(null)
  const [folderName, setFolderName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadFolders = () => {
    fetch('/api/folders')
      .then(r => r.json())
      .then(setFolders)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { loadFolders() }, [])

  const handleCreate = async () => {
    if (!folderName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName.trim() }),
      })
      if (res.ok) {
        showToast('Đã tạo thư mục', 'success')
        setShowCreate(false)
        setFolderName('')
        loadFolders()
      } else {
        showToast('Lỗi khi tạo thư mục', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!folderName.trim() || !editFolder) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/folders/${editFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName.trim() }),
      })
      if (res.ok) {
        showToast('Đã cập nhật thư mục', 'success')
        setShowEdit(false)
        setEditFolder(null)
        setFolderName('')
        loadFolders()
      } else {
        showToast('Lỗi khi cập nhật', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (folder: FolderItem) => {
    if (!confirm(`Xóa thư mục "${folder.name}"? Các bộ từ vựng sẽ không bị xóa.`)) return
    const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Đã xóa thư mục', 'success')
      loadFolders()
    } else {
      showToast('Lỗi khi xóa', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư mục</h1>
          <p className="text-gray-500 mt-1">Tổ chức bộ từ vựng theo chủ đề</p>
        </div>
        <Button onClick={() => { setFolderName(''); setShowCreate(true) }}>
          <Plus size={16} />
          Tạo thư mục
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : folders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map(folder => (
            <Card key={folder.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Folder size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditFolder(folder); setFolderName(folder.name); setShowEdit(true) }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(folder)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{folder.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <BookOpen size={12} />
                    {folder._count.studySets} bộ từ vựng
                  </span>
                  <Link
                    href={`/sets?folder=${folder.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
                  >
                    Xem <ArrowRight size={12} />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Folder size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có thư mục nào</h3>
          <p className="text-gray-500 mb-6">Tạo thư mục để sắp xếp bộ từ vựng của bạn</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Tạo thư mục đầu tiên
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tạo thư mục mới">
        <div className="space-y-4">
          <Input
            label="Tên thư mục"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            placeholder="VD: Tiếng Anh, Tiếng Nhật..."
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={isSaving || !folderName.trim()}>
              {isSaving ? 'Đang tạo...' : 'Tạo thư mục'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Đổi tên thư mục">
        <div className="space-y-4">
          <Input
            label="Tên mới"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEdit()}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Hủy</Button>
            <Button onClick={handleEdit} disabled={isSaving || !folderName.trim()}>
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
