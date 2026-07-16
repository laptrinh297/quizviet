import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin(session: any) {
  return session?.user?.id && (session.user as any).role === 'admin'
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!await checkAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isLocked: true,
      createdAt: true,
      streak: { select: { currentStreak: true, longestStreak: true, lastStudiedAt: true } },
      _count: { select: { studySets: true, studySessions: true, knownTerms: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  const sessions = await prisma.studySession.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      mode: true,
      score: true,
      total: true,
      createdAt: true,
      studySet: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json({ user, sessions })
}
