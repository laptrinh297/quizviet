import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const set = await prisma.studySet.findUnique({
    where: { id },
    include: {
      terms: { orderBy: { order: 'asc' } },
      user: { select: { name: true, email: true } },
    },
  })

  if (!set || set.isDeleted) {
    return NextResponse.json({ error: 'Không tìm thấy bộ từ vựng' }, { status: 404 })
  }

  if (set.userId !== session.user.id && !set.isPublic && (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
  }

  return NextResponse.json(set)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const set = await prisma.studySet.findUnique({ where: { id } })
  if (!set || set.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  try {
    const { title, description, folderId, terms } = await req.json()

    // Delete existing terms and recreate
    await prisma.term.deleteMany({ where: { setId: id } })

    const updated = await prisma.studySet.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        folderId: folderId || null,
        terms: {
          create: terms.map((t: any, i: number) => ({
            term: t.term.trim(),
            definition: t.definition.trim(),
            order: t.order ?? i,
          })),
        },
      },
      include: { terms: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const set = await prisma.studySet.findUnique({ where: { id } })
  if (!set) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  if (set.userId !== session.user.id && (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  await prisma.studySet.update({ where: { id }, data: { isDeleted: true } })

  return NextResponse.json({ success: true })
}
