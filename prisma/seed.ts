import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve(__dirname, 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@quizviet.com' },
    update: {},
    create: {
      email: 'admin@quizviet.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
      streak: { create: {} },
    },
  })

  const userPassword = await bcrypt.hash('User123!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@quizviet.com' },
    update: {},
    create: {
      email: 'user@quizviet.com',
      name: 'Người dùng mẫu',
      password: userPassword,
      role: 'user',
      streak: { create: { currentStreak: 5, longestStreak: 10 } },
    },
  })

  const set1 = await prisma.studySet.create({
    data: {
      title: 'Từ vựng Tiếng Anh cơ bản',
      description: 'Bộ từ vựng cho người mới bắt đầu',
      userId: user.id,
      terms: {
        create: [
          { term: 'Hello', definition: 'Xin chào', order: 0 },
          { term: 'Goodbye', definition: 'Tạm biệt', order: 1 },
          { term: 'Thank you', definition: 'Cảm ơn', order: 2 },
          { term: 'Please', definition: 'Làm ơn', order: 3 },
          { term: 'Sorry', definition: 'Xin lỗi', order: 4 },
          { term: 'Yes', definition: 'Có / Vâng', order: 5 },
          { term: 'No', definition: 'Không', order: 6 },
          { term: 'Water', definition: 'Nước', order: 7 },
          { term: 'Food', definition: 'Thức ăn', order: 8 },
          { term: 'House', definition: 'Nhà', order: 9 },
        ],
      },
    },
  })

  const set2 = await prisma.studySet.create({
    data: {
      title: 'Động vật bằng tiếng Anh',
      description: 'Học tên các loài động vật',
      userId: user.id,
      terms: {
        create: [
          { term: 'Dog', definition: 'Con chó', order: 0 },
          { term: 'Cat', definition: 'Con mèo', order: 1 },
          { term: 'Bird', definition: 'Con chim', order: 2 },
          { term: 'Fish', definition: 'Con cá', order: 3 },
          { term: 'Horse', definition: 'Con ngựa', order: 4 },
          { term: 'Elephant', definition: 'Con voi', order: 5 },
          { term: 'Tiger', definition: 'Con hổ', order: 6 },
          { term: 'Lion', definition: 'Sư tử', order: 7 },
        ],
      },
    },
  })

  console.log('Seed completed:', { admin: admin.email, user: user.email, sets: [set1.title, set2.title] })
}

main().catch(console.error).finally(() => prisma.$disconnect())
