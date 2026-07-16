import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.CLOUDINARY_URL) {
    return NextResponse.json({ error: 'Cloudinary chưa được cấu hình' }, { status: 500 })
  }
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Không có file' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Chỉ chấp nhận JPG, PNG, WEBP, GIF' }, { status: 400 })
  }

  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Ảnh tối đa 2MB' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'quizviet/avatars',
          public_id: `${session.user!.id}-${Date.now()}`,
          overwrite: true,
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error || !result) reject(error)
          else resolve(result as { secure_url: string })
        }
      )
      stream.end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (e) {
    console.error('[upload/avatar]', e)
    return NextResponse.json({ error: 'Lỗi upload ảnh' }, { status: 500 })
  }
}
