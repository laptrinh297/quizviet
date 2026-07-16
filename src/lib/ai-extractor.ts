export type AIProvider = 'gemini' | 'deepseek'

export interface UserAIConfig {
  provider: AIProvider
  model: string
  apiKey: string
}

export interface VocabItem {
  vocabulary: string
  reading: string
  meaning: string
}

export const SUPPORTED_MODELS: Record<AIProvider, string[]> = {
  gemini:   ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
}

export function isValidConfig(provider: string, model: string): provider is AIProvider {
  return (
    (provider === 'gemini' || provider === 'deepseek') &&
    SUPPORTED_MODELS[provider as AIProvider].includes(model)
  )
}

// ─── URL fetching ────────────────────────────────────────────────────────────

const MAX_CHARS = 8_000

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style|noscript|nav|header|footer|aside|iframe)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|li|h[1-6]|tr|br|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export async function fetchUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VocabExtractor/1.0)' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Không thể tải URL: HTTP ${res.status}`)

  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('text/html') && !ct.includes('text/plain')) {
    throw new Error(`Định dạng không được hỗ trợ: ${ct}`)
  }

  const text = stripHtml(await res.text())
  if (text.length < 50) throw new Error('Nội dung trang quá ngắn hoặc yêu cầu đăng nhập')
  return text.slice(0, MAX_CHARS)
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(text: string): string {
  return `Bạn là trợ lý trích xuất từ vựng tiếng Nhật cho người học tiếng Nhật nói tiếng Việt.

Trích xuất từ vựng tiếng Nhật có giá trị từ đoạn văn bản dưới đây. Bao gồm danh từ, động từ, tính từ い/な, trạng từ hữu ích cho người học JLPT N5–N1. Bỏ qua các trợ từ cơ bản (は、が、を、に) và dấu câu.

Chỉ trả về một mảng JSON hợp lệ — không giải thích, không markdown, không code fence.

Định dạng: [{"vocabulary":"漢字/かな","reading":"ひらがな","meaning":"nghĩa tiếng Việt"},...]

Quy tắc:
- vocabulary: từ như trong văn bản (ưu tiên kanji)
- reading: cách đọc bằng hiragana/katakana
- meaning: nghĩa tiếng Việt ngắn gọn, có dấu (tối đa 6 từ)
- Không trùng lặp; giới hạn 40 từ hữu ích nhất

Văn bản:
${text}`
}

// ─── AI calls ────────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API lỗi ${res.status}: ${err.slice(0, 200)}`)
  }
  const data: any = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') throw new Error('Phản hồi Gemini không hợp lệ')
  return text
}

async function callDeepSeek(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API lỗi ${res.status}: ${err.slice(0, 200)}`)
  }
  const data: any = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new Error('Phản hồi DeepSeek không hợp lệ')
  return text
}

// ─── JSON parsing ─────────────────────────────────────────────────────────────

export function parseVocabJson(raw: string): VocabItem[] {
  const text = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim()
  const start = text.indexOf('[')
  const end   = text.lastIndexOf(']')
  if (start === -1 || end <= start) throw new Error('AI không trả về JSON array')

  let parsed: unknown
  try { parsed = JSON.parse(text.slice(start, end + 1)) }
  catch (e: any) { throw new Error(`Lỗi parse JSON: ${e.message}`) }

  if (!Array.isArray(parsed)) throw new Error('Kết quả không phải array')

  const items = (parsed as any[])
    .filter(i => i && typeof i.vocabulary === 'string' && typeof i.reading === 'string' && typeof i.meaning === 'string')
    .map(i => ({
      vocabulary: String(i.vocabulary).trim(),
      reading:    String(i.reading).trim(),
      meaning:    String(i.meaning).trim(),
    }))
    .filter(i => i.vocabulary && i.reading && i.meaning)

  if (items.length === 0) throw new Error('AI trả về 0 từ vựng hợp lệ')
  return items
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export async function extractVocabulary(
  config: UserAIConfig,
  input: { url?: string; text?: string },
): Promise<VocabItem[]> {
  let sourceText: string
  if (input.url) {
    sourceText = await fetchUrlContent(input.url)
  } else if (input.text?.trim()) {
    sourceText = input.text.trim().slice(0, MAX_CHARS)
  } else {
    throw new Error('Cần cung cấp url hoặc text')
  }

  const prompt = buildPrompt(sourceText)
  const raw = config.provider === 'gemini'
    ? await callGemini(config.apiKey, config.model, prompt)
    : await callDeepSeek(config.apiKey, config.model, prompt)

  return parseVocabJson(raw)
}
