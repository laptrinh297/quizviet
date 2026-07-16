import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const original = await prisma.studySet.findUnique({
    where: { id },
    include: { terms: { orderBy: { order: 'asc' } } },
  })

  if (!original || original.isDeleted) {
    return NextResponse.json({ error: 'Không tìm thấy bộ từ vựng' }, { status: 404 })
  }

  if (!original.isPublic && original.userId !== session.user.id) {
    return NextResponse.json({ error: 'Bộ từ vựng này không công khai' }, { status: 403 })
  }

  const copied = await prisma.studySet.create({
    data: {
      title: `${original.title} (Copy)`,
      description: original.description,
      userId: session.user.id,
      isPublic: false,
      terms: {
        create: original.terms.map(t => ({
          term: t.term,
          definition: t.definition,
          order: t.order,
        })),
      },
    },
  })

  return NextResponse.json({ id: copied.id }, { status: 201 })
}
