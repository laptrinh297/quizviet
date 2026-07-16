'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'
import { Settings2, Info, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Provider = 'gemini' | 'deepseek'
type GuideTab = 'gemini' | 'deepseek' | 'compare'

interface Config {
  configured: boolean
  provider?: Provider
  model?: string
  apiKeyMasked?: string
}

const MODELS: Record<Provider, { value: string; label: string; hint: string; rec?: boolean }[]> = {
  gemini: [
    { value: 'gemini-2.0-flash',  label: 'gemini-2.0-flash',  hint: 'Nhanh · Chính xác cao · Khuyến nghị', rec: true },
    { value: 'gemini-1.5-flash',  label: 'gemini-1.5-flash',  hint: 'Nhanh · Free tier 1M token/ngày' },
    { value: 'gemini-1.5-pro',    label: 'gemini-1.5-pro',    hint: 'Chính xác cao nhất · Phù hợp N1-N2 phức tạp' },
  ],
  deepseek: [
    { value: 'deepseek-chat',     label: 'deepseek-chat',     hint: 'Nhanh · Chi phí cực thấp · Khuyến nghị', rec: true },
    { value: 'deepseek-reasoner', label: 'deepseek-reasoner', hint: 'Suy luận sâu · Văn bản chuyên ngành' },
  ],
}

export default function AISettingsPage() {
  const { showToast } = useToast()

  const [config, setConfig]       = useState<Config | null>(null)
  const [provider, setProvider]   = useState<Provider>('gemini')
  const [model, setModel]         = useState(MODELS.gemini[0].value)
  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [guideTab, setGuideTab]   = useState<GuideTab>('gemini')

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    const res = await fetch('/api/ai/config')
    if (!res.ok) {
      const text = await res.text()
      console.error('[loadConfig]', res.status, text)
      setConfig({ configured: false })
      return
    }
    const data: Config = await res.json()
    setConfig(data)
    if (data.configured && data.provider && data.model) {
      setProvider(data.provider)
      setModel(data.model)
    }
  }

  function handleProviderChange(p: Provider) {
    setProvider(p)
    setModel(MODELS[p][0].value)   // reset to recommended model
    setGuideTab(p)                  // sync guide tab
  }

  const modelHint = MODELS[provider].find(m => m.value === model)?.hint ?? ''

  async function handleSave() {
    if (!apiKey && !config?.configured) {
      showToast('API key là bắt buộc cho lần đầu cấu hình', 'error'); return
    }
    if (apiKey && apiKey.trim().length < 10) {
      showToast('API key quá ngắn', 'error'); return
    }

    setSaving(true)
    try {
      const body: Record<string, string> = { provider, model }
      if (apiKey) body.apiKey = apiKey

      const res  = await fetch('/api/ai/config', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Đã lưu cấu hình!', 'success')
        setApiKey('')
        loadConfig()
      } else {
        showToast(data.error || 'Lỗi lưu cấu hình', 'error')
      }
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Settings2 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt AI</h1>
          <p className="text-sm text-gray-500">Cấu hình API key để dùng tính năng trích xuất từ vựng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5 items-start">

        {/* ── LEFT: Config form ── */}
        <Card>
          <CardContent className="p-5 space-y-5">

            {/* Status */}
            {config && (
              <div className={cn(
                'flex items-start gap-2.5 p-3 rounded-lg text-sm',
                config.configured
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200 text-gray-500'
              )}>
                {config.configured
                  ? <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                  : <Circle size={16} className="text-gray-400 mt-0.5 shrink-0" />}
                <div>
                  {config.configured ? (
                    <>
                      <p className="font-semibold text-green-700">Đã cấu hình</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{config.provider}</span>
                        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{config.model}</span>
                      </div>
                    </>
                  ) : (
                    <p>Chưa cấu hình — nhập API key để bắt đầu</p>
                  )}
                </div>
              </div>
            )}

            {/* Provider picker */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['gemini', 'deepseek'] as Provider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all',
                      provider === p
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0',
                      p === 'gemini'   ? 'bg-blue-100 text-blue-700'  : 'bg-teal-100 text-teal-700'
                    )}>
                      {p === 'gemini' ? 'G' : 'D'}
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', provider === p ? 'text-indigo-700' : 'text-gray-800')}>
                        {p === 'gemini' ? 'Google Gemini' : 'DeepSeek'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p === 'gemini' ? 'Có free tier' : 'Chi phí rất thấp'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model select */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Model <span className="text-red-500">*</span>
              </label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {MODELS[provider].map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}{m.rec ? ' (khuyến nghị)' : ''}
                  </option>
                ))}
              </select>
              {modelHint && <p className="text-xs text-gray-400 mt-1.5">{modelHint}</p>}
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                API Key{!config?.configured && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={
                    config?.configured
                      ? `Key hiện tại: ${config.apiKeyMasked} — để trống nếu không đổi`
                      : 'Dán API key của bạn vào đây...'
                  }
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </CardContent>
        </Card>

        {/* ── RIGHT: Guide ── */}
        <Card>
          {/* Guide tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-xl overflow-x-auto">
            {([
              { id: 'gemini',  label: 'Google Gemini' },
              { id: 'deepseek', label: 'DeepSeek' },
              { id: 'compare',  label: 'So sánh Model' },
            ] as { id: GuideTab; label: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setGuideTab(tab.id)}
                className={cn(
                  'flex-1 min-w-max px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap',
                  guideTab === tab.id
                    ? 'text-indigo-600 border-indigo-600 bg-white'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <CardContent className="p-5">
            {/* Gemini guide */}
            {guideTab === 'gemini' && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-semibold text-blue-700">
                  <div className="w-5 h-5 bg-blue-600 text-white rounded text-xs font-bold flex items-center justify-center">G</div>
                  Google Gemini
                </div>
                <div className="space-y-0">
                  {[
                    { n: 1, title: 'Truy cập Google AI Studio', body: <>Mở <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="text-indigo-600 font-medium hover:underline">aistudio.google.com</a> và đăng nhập bằng tài khoản Google.</> },
                    { n: 2, title: 'Nhấn "Get API key"', body: <>Trong sidebar trái, nhấn <strong>Get API key</strong> → <strong>Create API key</strong>.</> },
                    { n: 3, title: 'Chọn Project', body: <>Chọn Google Cloud project hiện có hoặc nhấn <strong>Create API key in new project</strong>.</> },
                    { n: 4, title: 'Sao chép key', body: <>Key có dạng <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">AIzaSy...</code> — sao chép và dán vào ô API Key bên trái.</> },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{step.title}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-gray-600">
                  <strong className="text-gray-800">💡 Miễn phí:</strong> Gemini Flash có free tier <strong>15 RPM · 1 triệu token/ngày</strong> — không cần thẻ tín dụng.
                </div>
              </div>
            )}

            {/* DeepSeek guide */}
            {guideTab === 'deepseek' && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                  <div className="w-5 h-5 bg-teal-600 text-white rounded text-xs font-bold flex items-center justify-center">D</div>
                  DeepSeek
                </div>
                <div className="space-y-0">
                  {[
                    { n: 1, title: 'Đăng ký tài khoản', body: <>Truy cập <a href="https://platform.deepseek.com" target="_blank" rel="noopener" className="text-indigo-600 font-medium hover:underline">platform.deepseek.com</a> → nhấn <strong>Sign Up</strong>, đăng ký bằng email.</> },
                    { n: 2, title: 'Vào mục API Keys', body: <>Nhấn avatar góc trên phải → <strong>API Keys</strong>, hoặc tìm trong sidebar.</> },
                    { n: 3, title: 'Tạo Secret Key', body: <>Nhấn <strong>Create new secret key</strong>, đặt tên. Sao chép key dạng <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">sk-...</code> — <em>chỉ hiển thị một lần.</em></> },
                    { n: 4, title: 'Nạp credit tối thiểu', body: <>Vào <strong>Billing → Top up</strong>. Nạp $2–5 dùng được hàng tháng. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">deepseek-chat</code> chỉ ~$0.07/triệu token.</> },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{step.title}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-gray-600">
                  <strong className="text-gray-800">⚠️ Lưu ý:</strong> API có thể không khả dụng ở một số khu vực. Nếu gặp lỗi kết nối hãy thử dùng VPN hoặc chuyển sang Gemini.
                </div>
              </div>
            )}

            {/* Comparison */}
            {guideTab === 'compare' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">So sánh các model cho tác vụ <strong className="text-gray-700">trích xuất từ vựng tiếng Nhật</strong>:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        {['Model', 'Tốc độ', 'Chi phí', 'Chính xác', 'Free', 'Phù hợp'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { model: 'gemini-2.0-flash', sub: 'Google Gemini', speed: '⚡⚡⚡', cost: '💰', acc: '★★★★½', free: true,  note: 'Mặc định tốt nhất', rec: true },
                        { model: 'gemini-1.5-flash', sub: 'Google Gemini', speed: '⚡⚡⚡', cost: '💰', acc: '★★★★',  free: true,  note: 'Free tier cao' },
                        { model: 'gemini-1.5-pro',   sub: 'Google Gemini', speed: '⚡⚡',   cost: '💰💰',acc: '★★★★★', free: true,  note: 'N1-N2 phức tạp' },
                        { model: 'deepseek-chat',    sub: 'DeepSeek V3',   speed: '⚡⚡⚡', cost: '💰', acc: '★★★★',  free: false, note: 'Rẻ nhất', rec: true },
                        { model: 'deepseek-reasoner',sub: 'DeepSeek R1',   speed: '⚡',     cost: '💰💰',acc: '★★★★★', free: false, note: 'Văn bản chuyên ngành' },
                      ].map(row => (
                        <tr key={row.model} className="hover:bg-gray-50">
                          <td className="py-2.5 px-2">
                            <span className="font-medium text-gray-900 block">
                              {row.model}
                              {row.rec && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full align-middle">★</span>}
                            </span>
                            <span className="text-xs text-gray-400">{row.sub}</span>
                          </td>
                          <td className="py-2.5 px-2 text-xs">{row.speed}</td>
                          <td className="py-2.5 px-2 text-xs">{row.cost}</td>
                          <td className="py-2.5 px-2 text-xs">{row.acc}</td>
                          <td className="py-2.5 px-2 text-xs font-semibold">
                            <span className={row.free ? 'text-green-600' : 'text-gray-400'}>{row.free ? '✓' : '✗'}</span>
                          </td>
                          <td className="py-2.5 px-2 text-xs text-gray-500">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-gray-600">
                  <strong className="text-gray-800">Khuyến nghị:</strong> Bắt đầu với <strong>gemini-2.0-flash</strong> (miễn phí, nhanh). Nếu cần xử lý nhiều và giảm chi phí, chuyển sang <strong>deepseek-chat</strong>.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
