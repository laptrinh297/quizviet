import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Top 10 by total sessions
  const top = await prisma.user.findMany({
    where: { isLocked: false },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      streak: { select: { currentStreak: true, longestStreak: true } },
      _count: {
        select: {
          studySessions: true,
          studySets: { where: { isDeleted: false } },
        },
      },
    },
    orderBy: { studySessions: { _count: 'desc' } },
    take: 10,
  })

  return NextResponse.json(top)
}
