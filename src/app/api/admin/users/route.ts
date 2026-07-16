import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin(session: any) {
  return session?.user?.id && (session.user as any).role === 'admin'
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!await checkAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isLocked: true,
      createdAt: true,
      _count: { select: { studySets: true, studySessions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!await checkAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, isLocked } = await req.json()

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Không thể khóa admin' }, { status: 403 })

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isLocked },
    select: { id: true, email: true, isLocked: true },
  })

  return NextResponse.json(user)
}
