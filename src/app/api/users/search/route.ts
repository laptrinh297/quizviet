import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json([])

  const users = await prisma.user.findMany({
    where: {
      isLocked: false,
      name: { contains: q },
    },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      streak: { select: { currentStreak: true } },
      _count: {
        select: {
          studySessions: true,
          studySets: { where: { isDeleted: false } },
        },
      },
    },
    take: 20,
  })

  return NextResponse.json(users)
}
