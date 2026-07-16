/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path'
import { defineConfig } from 'prisma/config'

function getDbUrl(): string {
  return process.env.DATABASE_URL ?? `file:${path.resolve('prisma', 'dev.db')}`
}

function isPostgres(): boolean {
  const url = getDbUrl()
  return url.startsWith('postgresql://') || url.startsWith('postgres://')
}

export default defineConfig({
  ...(({ earlyAccess: true }) as any),
  get schema() {
    return isPostgres()
      ? path.join('prisma', 'schema.prod.prisma')
      : path.join('prisma', 'schema.prisma')
  },
  get datasource() {
    return { url: getDbUrl() }
  },
  migrations: {
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  migrate: {
    async adapter() {
      const url = getDbUrl()
      if (isPostgres()) {
        const { Pool } = await import('pg')
        const { PrismaPg } = await import('@prisma/adapter-pg')
        const pool = new Pool({ connectionString: url })
        return new PrismaPg(pool)
      } else {
        const { PrismaLibSql } = await import('@prisma/adapter-libsql')
        return new PrismaLibSql({ url })
      }
    },
  },
} as any)
