import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 18
  const skip = (page - 1) * limit

  const where: any = {
    isPublic: true,
    isDeleted: false,
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ]
  }

  const [sets, total] = await Promise.all([
    prisma.studySet.findMany({
      where,
      include: {
        _count: { select: { terms: true } },
        user: { select: { name: true, image: true, id: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.studySet.count({ where }),
  ])

  return NextResponse.json({ sets, total, page, pages: Math.ceil(total / limit) })
}
