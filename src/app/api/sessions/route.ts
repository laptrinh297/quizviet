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

  // Update streak
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const streak = await prisma.streak.findUnique({ where: { userId: session.user.id } })
  if (!streak) {
    await prisma.streak.create({
      data: { userId: session.user.id, currentStreak: 1, longestStreak: 1, lastStudiedAt: now },
    })
  } else {
    const last = streak.lastStudiedAt ? new Date(streak.lastStudiedAt) : null
    if (last) last.setHours(0, 0, 0, 0)

    let newCurrent = streak.currentStreak
    if (!last || last < yesterdayStart) {
      newCurrent = 1 // streak broken
    } else if (last.getTime() === yesterdayStart.getTime()) {
      newCurrent = streak.currentStreak + 1 // continue
    }
    // last === today → no change

    await prisma.streak.update({
      where: { userId: session.user.id },
      data: {
        currentStreak: newCurrent,
        longestStreak: Math.max(streak.longestStreak, newCurrent),
        lastStudiedAt: now,
      },
    })
  }

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
