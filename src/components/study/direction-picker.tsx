'use client'

import { type Direction } from '@/hooks/use-study-direction'
import { cn } from '@/lib/utils'
import { Settings2 } from 'lucide-react'
import { useState } from 'react'

const OPTIONS: { value: Direction; label: string; desc: string }[] = [
  { value: 'definition', label: 'Thuật ngữ → Định nghĩa', desc: 'Xem thuật ngữ, trả lời định nghĩa' },
  { value: 'term',       label: 'Định nghĩa → Thuật ngữ', desc: 'Xem định nghĩa, trả lời thuật ngữ' },
  { value: 'both',       label: 'Cả hai',                  desc: 'Xen kẽ cả hai chiều' },
]

interface DirectionPickerProps {
  direction: Direction
  onChange: (d: Direction) => void
}

export function DirectionPicker({ direction, onChange }: DirectionPickerProps) {
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find(o => o.value === direction)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50"
      >
        <Settings2 size={14} />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 w-64 overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 pt-3 pb-1">
              Trả lời bằng
            </p>
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2.5 transition-colors',
                  direction === opt.value
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
