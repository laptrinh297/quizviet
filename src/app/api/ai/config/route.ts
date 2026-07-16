import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidConfig, SUPPORTED_MODELS } from '@/lib/ai-extractor'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let config
  try {
    config = await prisma.userAIConfig.findUnique({ where: { userId: session.user.id } })
  } catch (e) {
    console.error('[ai/config GET]', e)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!config) return NextResponse.json({ configured: false })

  const key = config.apiKey
  const masked = key.length > 8
    ? key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4)
    : '••••••••'

  return NextResponse.json({
    configured: true,
    provider: config.provider,
    model: config.model,
    apiKeyMasked: masked,
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, model, apiKey } = await req.json()

  if (!provider || !model) {
    return NextResponse.json({ error: 'provider và model là bắt buộc' }, { status: 400 })
  }
  if (!isValidConfig(provider, model)) {
    return NextResponse.json({ error: 'Model không hợp lệ', supported: SUPPORTED_MODELS }, { status: 400 })
  }

  const existing = await prisma.userAIConfig.findUnique({ where: { userId: session.user.id } })

  try {
    if (apiKey) {
      await prisma.userAIConfig.upsert({
        where:  { userId: session.user.id },
        create: { userId: session.user.id, provider, model, apiKey },
        update: { provider, model, apiKey },
      })
    } else if (existing) {
      await prisma.userAIConfig.update({
        where:  { userId: session.user.id },
        data:   { provider, model },
      })
    } else {
      return NextResponse.json({ error: 'API key là bắt buộc cho lần cấu hình đầu tiên' }, { status: 400 })
    }
  } catch (e) {
    console.error('[ai/config PUT]', e)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
