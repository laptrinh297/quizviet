import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period')

  const user = await prisma.user.findUnique({
    where: { id, isLocked: false },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      streak: { select: { currentStreak: true, longestStreak: true, lastStudiedAt: true } },
      _count: {
        select: {
          studySessions: true,
          studySets: { where: { isDeleted: false } },
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ── If period is requested, return history data ──
  if (period) {
    const now = new Date()

    if (period === 'day') {
      const start = new Date(now); start.setHours(0, 0, 0, 0)
      const end = new Date(now); end.setHours(23, 59, 59, 999)
      const sessions = await prisma.studySession.findMany({
        where: { userId: id, createdAt: { gte: start, lte: end } },
        include: { studySet: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ period: 'day', sessions })
    }

    if (period === 'week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
      const start = new Date(now)
      start.setDate(now.getDate() - dayOfWeek)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)

      const sessions = await prisma.studySession.findMany({
        where: { userId: id, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'asc' },
      })

      const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
      const days = dayLabels.map((label, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i)
        const dateStr = d.toISOString().slice(0, 10)
        const count = sessions.filter(s => s.createdAt.toISOString().slice(0, 10) === dateStr).length
        return { label, date: dateStr, count }
      })

      return NextResponse.json({ period: 'week', days, total: sessions.length })
    }

    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const sessions = await prisma.studySession.findMany({
        where: { userId: id, createdAt: { gte: start, lte: end } },
      })

      const daysInMonth = end.getDate()
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
        const dateStr = d.toISOString().slice(0, 10)
        const count = sessions.filter(s => s.createdAt.toISOString().slice(0, 10) === dateStr).length
        return { day: i + 1, date: dateStr, count }
      })

      const firstDayOffset = start.getDay() === 0 ? 6 : start.getDay() - 1

      return NextResponse.json({
        period: 'month',
        days,
        firstDayOffset,
        total: sessions.length,
        monthLabel: start.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      })
    }

    if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      const sessions = await prisma.studySession.findMany({
        where: { userId: id, createdAt: { gte: start, lte: end } },
      })

      const countByDate: Record<string, number> = {}
      for (const s of sessions) {
        const d = s.createdAt.toISOString().slice(0, 10)
        countByDate[d] = (countByDate[d] || 0) + 1
      }

      const months = Array.from({ length: 12 }, (_, m) => ({
        label: `T${m + 1}`,
        count: sessions.filter(s => s.createdAt.getMonth() === m).length,
      }))

      return NextResponse.json({
        period: 'year',
        countByDate,
        months,
        total: sessions.length,
        year: now.getFullYear(),
      })
    }

    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  // ── Default: return full profile ──
  const studySets = await prisma.studySet.findMany({
    where: { userId: id, isDeleted: false },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { terms: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const allSessions = await prisma.studySession.findMany({
    where: { userId: id },
    select: { mode: true },
  })

  const modeBreakdown: Record<string, number> = {}
  for (const s of allSessions) {
    modeBreakdown[s.mode] = (modeBreakdown[s.mode] || 0) + 1
  }

  return NextResponse.json({ user, studySets, modeBreakdown })
}
