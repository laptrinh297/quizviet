'use client'

import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Direction } from '@/hooks/use-study-direction'

export type QuestionMode = 'random' | 'mcq' | 'written'

interface LearnSettingsProps {
  direction: Direction
  questionMode: QuestionMode
  onDirectionChange: (d: Direction) => void
  onModeChange: (m: QuestionMode) => void
}

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'definition', label: 'Thuật ngữ → Định nghĩa' },
  { value: 'term',       label: 'Định nghĩa → Thuật ngữ' },
  { value: 'both',       label: 'Cả hai chiều' },
]

const MODES: { value: QuestionMode; label: string }[] = [
  { value: 'random',  label: 'Ngẫu nhiên' },
  { value: 'mcq',     label: 'Trắc nghiệm' },
  { value: 'written', label: 'Tự luận' },
]

export function LearnSettings({ direction, questionMode, onDirectionChange, onModeChange }: LearnSettingsProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50"
      >
        <Settings2 size={15} />
        <span className="hidden sm:inline">Cài đặt</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 w-64 overflow-hidden">

            {/* Question mode */}
            <div className="px-3 pt-3 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Loại câu hỏi</p>
              <div className="flex gap-1.5">
                {MODES.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onModeChange(opt.value); setOpen(false) }}
                    className={cn(
                      'flex-1 py-1.5 text-xs rounded-lg border transition-colors font-medium',
                      questionMode === opt.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Direction */}
            <div className="px-3 pt-2 pb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Chiều trả lời</p>
              <div className="space-y-1">
                {DIRECTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onDirectionChange(opt.value); setOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                      direction === opt.value
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
