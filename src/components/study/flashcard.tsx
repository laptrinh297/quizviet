'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'

interface FlashcardProps {
  term: string
  definition: string
  isKnown?: boolean
}

export function Flashcard({ term, definition, isKnown }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => setIsFlipped(prev => !prev)

  return (
    <div
      className="flip-card w-full cursor-pointer select-none"
      style={{ height: '320px' }}
      onClick={handleFlip}
    >
      <div className={cn('flip-card-inner', isFlipped && 'flipped')}>
        {/* Front */}
        <div className="flip-card-front flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
          {isKnown && (
            <span className="absolute top-4 right-4 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Đã biết
            </span>
          )}
          <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wide">Thuật ngữ</p>
          <p className="text-3xl font-bold text-gray-900 text-center leading-tight">{term}</p>
          <p className="mt-8 text-xs text-gray-400 flex items-center gap-1">
            <RotateCcw size={12} />
            Nhấp để lật thẻ
          </p>
        </div>

        {/* Back */}
        <div className="flip-card-back flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-2xl shadow-lg">
          <p className="text-xs font-medium text-indigo-200 mb-4 uppercase tracking-wide">Định nghĩa</p>
          <p className="text-2xl font-bold text-white text-center leading-tight">{definition}</p>
          <p className="mt-8 text-xs text-indigo-300 flex items-center gap-1">
            <RotateCcw size={12} />
            Nhấp để xem thuật ngữ
          </p>
        </div>
      </div>
    </div>
  )
}
