import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? ''

  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    // Production / Staging — PostgreSQL
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg')
    const pool = new Pool({ connectionString: url })
    return new PrismaClient({ adapter: new PrismaPg(pool) } as any)
  }

  // Development — SQLite
  const libsqlUrl = url.startsWith('file:')
    ? url
    : `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require('@prisma/adapter-libsql')
  return new PrismaClient({ adapter: new PrismaLibSql({ url: libsqlUrl }) } as any)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
