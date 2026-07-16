import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { termId, known } = await req.json()

  if (!termId) return NextResponse.json({ error: 'termId required' }, { status: 400 })

  if (known) {
    await prisma.knownTerm.upsert({
      where: { termId_userId: { termId, userId: session.user.id } },
      create: { termId, userId: session.user.id },
      update: {},
    })
  } else {
    await prisma.knownTerm.deleteMany({
      where: { termId, userId: session.user.id },
    })
  }

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: setId } = await params

  const known = await prisma.knownTerm.findMany({
    where: {
      userId: session.user.id,
      term: { setId },
    },
    select: { termId: true },
  })

  return NextResponse.json(known.map((k: { termId: string }) => k.termId))
}
