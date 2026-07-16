import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const period = req.nextUrl.searchParams.get('period') ?? 'all'

  let startDate: Date | undefined
  if (period === 'week') {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)
  }

  let top
  if (startDate) {
    // Group sessions by userId within the period
    const grouped = await prisma.studySession.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const userIds = grouped.map(g => g.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isLocked: false },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        streak: { select: { currentStreak: true, longestStreak: true } },
        _count: { select: { studySets: { where: { isDeleted: false } } } },
      },
    })

    const userMap = new Map(users.map(u => [u.id, u]))
    top = grouped
      .filter(g => userMap.has(g.userId))
      .map(g => {
        const u = userMap.get(g.userId)!
        return { ...u, _count: { ...u._count, studySessions: g._count.id } }
      })
  } else {
    const users = await prisma.user.findMany({
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
    top = users
  }

  return NextResponse.json(top)
}
