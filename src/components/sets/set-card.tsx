import Link from 'next/link'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { setUrl } from '@/lib/utils'

interface SetCardProps {
  id: string
  title: string
  description?: string | null
  termCount: number
  updatedAt?: Date | string
  authorName?: string
}

export function SetCard({ id, title, description, termCount, updatedAt, authorName }: SetCardProps) {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <Link href={setUrl(id, title)}>
              <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                {title}
              </h3>
            </Link>
            {description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen size={12} />
            <span>{termCount} thuật ngữ</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formattedDate}</span>
            </div>
          )}
          {authorName && <Badge variant="secondary">{authorName}</Badge>}
        </div>

        <Link
          href={setUrl(id, title)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Học ngay
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  )
}
