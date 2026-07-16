import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120 // seconds
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractVocabulary, type AIProvider } from '@/lib/ai-extractor'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const config = await prisma.userAIConfig.findUnique({ where: { userId: session.user.id } })
  if (!config) {
    return NextResponse.json(
      { error: 'Chưa cấu hình API. Vào Cài đặt AI để thiết lập provider và API key.' },
      { status: 400 },
    )
  }

  const { url, text, title } = await req.json()
  if (!url && !text) {
    return NextResponse.json({ error: 'Cần cung cấp url hoặc text' }, { status: 400 })
  }

  const sourceType    = url ? 'url' : 'text'
  const sourcePreview = url
    ? String(url).slice(0, 300)
    : String(text ?? '').slice(0, 200).replace(/\s+/g, ' ')

  const autoTitle = title?.trim() || (
    url
      ? (() => { try { return new URL(url).hostname } catch { return String(url).slice(0, 60) } })()
      : sourcePreview.slice(0, 60)
  )

  let items: { vocabulary: string; reading: string; meaning: string }[]
  try {
    items = await extractVocabulary(
      { provider: config.provider as AIProvider, model: config.model, apiKey: config.apiKey },
      { url, text },
    )
  } catch (err: any) {
    const msg: string = err.message ?? 'Unknown error'
    logger.error('AI extract failed', { userId: session.user.id, error: msg })
    const status = msg.includes('API lỗi') || msg.includes('tải URL') ? 502 : 400
    return NextResponse.json({ error: msg }, { status })
  }

  const vocabSet = await prisma.aIVocabSet.create({
    data: {
      userId:        session.user.id,
      title:         autoTitle,
      sourceType,
      sourcePreview,
      itemCount:     items.length,
      items: {
        create: items.map((item, i) => ({
          vocabulary: item.vocabulary,
          reading:    item.reading,
          meaning:    item.meaning,
          order:      i,
        })),
      },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(vocabSet, { status: 201 })
}
