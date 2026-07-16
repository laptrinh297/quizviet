import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [totalUsers, totalSets, todaySessions, newUsersThisWeek] = await Promise.all([
    prisma.user.count(),
    prisma.studySet.count({ where: { isDeleted: false } }),
    prisma.studySession.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
  ])

  return NextResponse.json({ totalUsers, totalSets, todaySessions, newUsersThisWeek })
}
