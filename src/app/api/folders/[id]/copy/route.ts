import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const original = await prisma.folder.findUnique({
    where: { id },
    include: {
      studySets: {
        where: { isDeleted: false, isPublic: true },
        include: { terms: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!original) {
    return NextResponse.json({ error: 'Không tìm thấy thư mục' }, { status: 404 })
  }

  if (!original.isPublic && original.userId !== session.user.id) {
    return NextResponse.json({ error: 'Thư mục này không công khai' }, { status: 403 })
  }

  // Create new folder + copy all public sets inside
  const newFolder = await prisma.folder.create({
    data: {
      name: `${original.name} (Copy)`,
      userId: session.user.id,
      isPublic: false,
      studySets: {
        create: original.studySets.map(set => ({
          title: set.title,
          description: set.description,
          user: { connect: { id: session.user.id } },
          isPublic: false,
          terms: {
            create: set.terms.map(t => ({
              term: t.term,
              definition: t.definition,
              order: t.order,
            })),
          },
        })),
      },
    },
  })

  return NextResponse.json({ id: newFolder.id }, { status: 201 })
}
