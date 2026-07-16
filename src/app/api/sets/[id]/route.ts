import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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
    const { title, description, folderId, terms, isPublic } = await req.json()

    // Smart upsert: preserve existing terms (keeps SRData/KnownTerm intact)
    if (Array.isArray(terms)) {
      const existingTerms = await prisma.term.findMany({ where: { setId: id }, select: { id: true } })
      const existingIds = new Set(existingTerms.map((t: { id: string }) => t.id))

      const incomingIds = new Set(
        (terms as any[]).filter(t => existingIds.has(t.id)).map((t: any) => t.id)
      )

      // Delete removed terms
      const toDelete = existingTerms.filter((t: { id: string }) => !incomingIds.has(t.id)).map((t: { id: string }) => t.id)
      if (toDelete.length > 0) await prisma.term.deleteMany({ where: { id: { in: toDelete } } })

      // Upsert each term
      for (const t of terms as any[]) {
        if (existingIds.has(t.id)) {
          await prisma.term.update({
            where: { id: t.id },
            data: { term: t.term.trim(), definition: t.definition.trim(), order: t.order ?? 0 },
          })
        } else {
          await prisma.term.create({
            data: { term: t.term.trim(), definition: t.definition.trim(), order: t.order ?? 0, setId: id },
          })
        }
      }
    }

    const updated = await prisma.studySet.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(folderId !== undefined ? { folderId: folderId || null } : {}),
        ...(typeof isPublic === 'boolean' ? { isPublic } : {}),
      },
      include: { terms: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    logger.error('PUT /api/sets/[id] failed', { error: String(error), id })
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
