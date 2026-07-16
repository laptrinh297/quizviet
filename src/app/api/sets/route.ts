import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folder')

  const where: any = {
    userId: session.user.id,
    isDeleted: false,
  }

  if (folderId) where.folderId = folderId

  const sets = await prisma.studySet.findMany({
    where,
    include: { _count: { select: { terms: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(sets)
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
    console.error(error)
    return NextResponse.json({ error: 'Lỗi khi tạo bộ từ vựng' }, { status: 500 })
  }
}
