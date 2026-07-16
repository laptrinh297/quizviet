/**
 * Đặt role=admin cho một email cụ thể.
 * Chạy local:      npm run db:set-admin
 * Chạy trên prod:  DATABASE_URL=<prod_url> npx tsx scripts/set-admin.ts
 */
import { prisma } from '../src/lib/prisma'

const ADMIN_EMAIL = 'huandt92@gmail.com'

async function main() {
  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!user) {
    console.error(`❌ Không tìm thấy user với email: ${ADMIN_EMAIL}`)
    process.exit(1)
  }

  if (user.role === 'admin') {
    console.log(`✅ ${ADMIN_EMAIL} đã là admin rồi.`)
    return
  }

  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { role: 'admin' },
  })

  console.log(`✅ Đã set role=admin cho ${ADMIN_EMAIL}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => (prisma as any).$disconnect?.())
