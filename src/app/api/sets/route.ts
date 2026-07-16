import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folder')
  const trashed = searchParams.get('trashed') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 18
  const skip = (page - 1) * limit

  const search = searchParams.get('q')?.trim()

  const where: any = {
    userId: session.user.id,
    isDeleted: trashed,
  }

  if (folderId) where.folderId = folderId
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const [sets, total] = await Promise.all([
    prisma.studySet.findMany({
      where,
      select: {
        id: true, title: true, description: true,
        updatedAt: true, isPublic: true, isDeleted: true,
        _count: { select: { terms: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.studySet.count({ where }),
  ])

  return NextResponse.json({ sets, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, description, folderId, terms } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 })
    }

    if (!terms || terms.length < 2) {
      return NextResponse.json({ error: 'Cần ít nhất 2 thuật ngữ' }, { status: 400 })
    }

    const set = await prisma.studySet.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
        folderId: folderId || null,
        terms: {
          create: terms.map((t: any, i: number) => ({
            term: t.term.trim(),
            definition: t.definition.trim(),
            order: t.order ?? i,
          })),
        },
      },
      include: { terms: true, _count: { select: { terms: true } } },
    })

    return NextResponse.json(set, { status: 201 })
  } catch (error) {
    logger.error('POST /api/sets failed', { error: String(error) })
    return NextResponse.json({ error: 'Lỗi khi tạo bộ từ vựng' }, { status: 500 })
  }
}
