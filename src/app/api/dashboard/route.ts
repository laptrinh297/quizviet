import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

  // Get or create streak
  let streak = await prisma.streak.findUnique({ where: { userId } })

  if (!streak) {
    streak = await prisma.streak.create({ data: { userId } })
  }

  // Update streak logic
  if (streak.lastStudiedAt) {
    const lastDate = new Date(streak.lastStudiedAt)
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.floor((todayDay.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000))

    if (diffDays === 1) {
      // Yesterday - increment
      const newStreak = streak.currentStreak + 1
      streak = await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(streak.longestStreak, newStreak),
          lastStudiedAt: now,
        },
      })
    } else if (diffDays === 0) {
      // Today - no change
    } else {
      // More than 1 day - reset
      streak = await prisma.streak.update({
        where: { userId },
        data: { currentStreak: 1, lastStudiedAt: now },
      })
    }
  } else {
    // First time
    streak = await prisma.streak.update({
      where: { userId },
      data: { currentStreak: 1, lastStudiedAt: now },
    })
  }

  const [recentSets, totalSets, totalTerms, todaySessions] = await Promise.all([
    prisma.studySet.findMany({
      where: { userId, isDeleted: false },
      include: { _count: { select: { terms: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.studySet.count({ where: { userId, isDeleted: false } }),
    prisma.term.count({ where: { studySet: { userId, isDeleted: false } } }),
    prisma.studySession.count({
      where: { userId, createdAt: { gte: todayStart } },
    }),
  ])

  return NextResponse.json({
    streak: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudiedAt: streak.lastStudiedAt,
    },
    recentSets,
    totalSets,
    totalTerms,
    todaySessions,
  })
}
