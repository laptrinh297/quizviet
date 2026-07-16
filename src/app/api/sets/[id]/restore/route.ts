import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const set = await prisma.studySet.findUnique({ where: { id } })

  if (!set) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
  if (set.userId !== session.user.id && (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  await prisma.studySet.update({ where: { id }, data: { isDeleted: false } })
  return NextResponse.json({ success: true })
}
