import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, isPublic } = await req.json()

  const folder = await prisma.folder.findUnique({ where: { id } })
  if (!folder || folder.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy thư mục' }, { status: 404 })
  }

  const updated = await prisma.folder.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(typeof isPublic === 'boolean' ? { isPublic } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const folder = await prisma.folder.findUnique({ where: { id } })
  if (!folder || folder.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy thư mục' }, { status: 404 })
  }

  // Unlink sets from folder before deleting
  await prisma.studySet.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  })

  await prisma.folder.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
