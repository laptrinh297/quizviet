import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateSR } from '@/lib/sr-algorithm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ setId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { setId } = await params

  const srData = await prisma.sRData.findMany({
    where: {
      userId: session.user.id,
      term: { setId },
    },
    select: {
      termId: true,
      interval: true,
      repetitions: true,
      easeFactor: true,
      nextReview: true,
    },
  })

  return NextResponse.json(srData)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ setId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { termId, quality } = await req.json()

  if (!termId || quality === undefined) {
    return NextResponse.json({ error: 'termId and quality required' }, { status: 400 })
  }

  const existing = await prisma.sRData.findUnique({
    where: { termId_userId: { termId, userId: session.user.id } },
  })

  const result = calculateSR(
    quality,
    existing?.repetitions ?? 0,
    existing?.easeFactor ?? 2.5,
    existing?.interval ?? 1,
  )

  const srData = await prisma.sRData.upsert({
    where: { termId_userId: { termId, userId: session.user.id } },
    create: {
      termId,
      userId: session.user.id,
      interval: result.interval,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      nextReview: result.nextReview,
    },
    update: {
      interval: result.interval,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      nextReview: result.nextReview,
    },
  })

  return NextResponse.json(srData)
}
