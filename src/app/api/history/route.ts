import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week'
  const userId = session.user.id

  const now = new Date()

  if (period === 'day') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    const sessions = await prisma.studySession.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      include: { studySet: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ period: 'day', sessions })
  }

  if (period === 'week') {
    // Current week Mon–Sun
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Mon=0
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const sessions = await prisma.studySession.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      include: { studySet: { select: { title: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day of week (0=Mon ... 6=Sun)
    const days: { label: string; date: string; count: number; sessions: typeof sessions }[] = []
    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const daySessions = sessions.filter(s => s.createdAt.toISOString().slice(0, 10) === dateStr)
      days.push({ label: dayLabels[i], date: dateStr, count: daySessions.length, sessions: daySessions })
    }

    return NextResponse.json({ period: 'week', days, total: sessions.length })
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const sessions = await prisma.studySession.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day of month
    const daysInMonth = end.getDate()
    const days: { day: number; date: string; count: number }[] = []
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = sessions.filter(s => s.createdAt.toISOString().slice(0, 10) === dateStr).length
      days.push({ day: i, date: dateStr, count })
    }

    // First day of month weekday offset (0=Mon)
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
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date string
    const countByDate: Record<string, number> = {}
    for (const s of sessions) {
      const d = s.createdAt.toISOString().slice(0, 10)
      countByDate[d] = (countByDate[d] || 0) + 1
    }

    // Group by month for bar chart
    const months: { label: string; count: number }[] = []
    const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
    for (let m = 0; m < 12; m++) {
      const count = sessions.filter(s => s.createdAt.getMonth() === m).length
      months.push({ label: monthLabels[m], count })
    }

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
