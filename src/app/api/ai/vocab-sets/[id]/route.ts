import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const set = await prisma.aIVocabSet.findUnique({
    where:   { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  if (!set || set.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
  }

  return NextResponse.json(set)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const set = await prisma.aIVocabSet.findUnique({ where: { id }, select: { userId: true } })

  if (!set || set.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
  }

  await prisma.aIVocabSet.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
