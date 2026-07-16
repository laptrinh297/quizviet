import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { setId, mode, score, total } = await req.json()

  if (!setId || !mode) {
    return NextResponse.json({ error: 'setId and mode required' }, { status: 400 })
  }

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      setId,
      mode,
      score: score ?? null,
      total: total ?? null,
    },
  })

  return NextResponse.json(studySession, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await prisma.studySession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { studySet: { select: { title: true } } },
  })

  return NextResponse.json(sessions)
}
