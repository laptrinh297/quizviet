import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { studySets: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(folders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Tên thư mục là bắt buộc' }, { status: 400 })
  }

  const folder = await prisma.folder.create({
    data: { name: name.trim(), userId: session.user.id },
    include: { _count: { select: { studySets: true } } },
  })

  return NextResponse.json(folder, { status: 201 })
}
