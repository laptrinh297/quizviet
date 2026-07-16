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

  const sets = await prisma.studySet.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { terms: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(sets)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!await checkAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { setId } = await req.json()
  if (!setId) return NextResponse.json({ error: 'setId required' }, { status: 400 })

  await prisma.studySet.delete({ where: { id: setId } })

  return NextResponse.json({ success: true })
}
