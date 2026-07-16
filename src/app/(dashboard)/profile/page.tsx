'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toaster'
import { User, Lock, Camera, Save, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { showToast } = useToast()

  const [profile, setProfile] = useState({ name: '', image: '' })
  const [password, setPassword] = useState({ old: '', new: '', confirm: '' })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        image: session.user.image || '',
      })
    }
  }, [session])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        setProfile(p => ({ ...p, image: data.url }))
        // Tự động lưu URL vào DB ngay sau khi upload
        const saveRes = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: profile.name, image: data.url }),
        })
        if (saveRes.ok) {
          await update({ image: data.url })
          showToast('Đã cập nhật ảnh đại diện', 'success')
        } else {
          showToast('Upload thành công nhưng không thể lưu, hãy bấm Lưu thông tin', 'error')
        }
      } else {
        showToast(data.error || 'Lỗi tải ảnh', 'error')
      }
    } catch {
      showToast('Đã có lỗi xảy ra', 'error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, image: profile.image }),
      })
      if (res.ok) {
        await update({ name: profile.name, image: profile.image })
        showToast('Đã cập nhật hồ sơ', 'success')
      } else {
        const err = await res.json()
        showToast(err.error || 'Lỗi khi cập nhật', 'error')
      }
    } catch {
      showToast('Đã có lỗi xảy ra', 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      showToast('Mật khẩu mới không khớp', 'error')
      return
    }
    if (password.new.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error')
      return
    }

    setIsSavingPassword(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: password.old, newPassword: password.new }),
      })
      if (res.ok) {
        showToast('Đã đổi mật khẩu thành công', 'success')
        setPassword({ old: '', new: '', confirm: '' })
      } else {
        const err = await res.json()
        showToast(err.error || 'Lỗi khi đổi mật khẩu', 'error')
      }
    } catch {
      showToast('Đã có lỗi xảy ra', 'error')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>

      {/* Avatar Preview */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            {profile.image ? (
              <img src={profile.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-700 text-2xl font-bold">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isUploading
              ? <Loader2 size={20} className="text-white animate-spin" />
              : <Camera size={20} className="text-white" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{profile.name || 'Chưa đặt tên'}</p>
          <p className="text-gray-500 text-sm">{session?.user?.email}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{(session?.user as any)?.role || 'user'}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Camera size={12} />
            {isUploading ? 'Đang tải...' : 'Đổi ảnh đại diện'}
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Họ và tên"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            placeholder="Nhập họ và tên"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={session?.user?.email || ''}
              disabled
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              <Save size={14} />
              {isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Đổi mật khẩu</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={password.old}
            onChange={e => setPassword(p => ({ ...p, old: e.target.value }))}
            placeholder="••••••••"
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            value={password.new}
            onChange={e => setPassword(p => ({ ...p, new: e.target.value }))}
            placeholder="Ít nhất 6 ký tự"
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={password.confirm}
            onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
            placeholder="Nhập lại mật khẩu mới"
          />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isSavingPassword}>
              <Lock size={14} />
              {isSavingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
