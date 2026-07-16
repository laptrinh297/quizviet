import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  color?: string
}

export function Progress({ className, value, max = 100, showLabel, color = 'bg-indigo-600', ...props }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('relative', className)} {...props}>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-6 text-xs text-gray-500">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
