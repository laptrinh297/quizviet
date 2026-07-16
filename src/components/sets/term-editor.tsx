'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface TermPair {
  id: string
  term: string
  definition: string
}

interface TermEditorProps {
  terms: TermPair[]
  onChange: (terms: TermPair[]) => void
}

export function TermEditor({ terms, onChange }: TermEditorProps) {
  const addTerm = () => {
    onChange([
      ...terms,
      { id: Math.random().toString(36).slice(2), term: '', definition: '' },
    ])
  }

  const removeTerm = (id: string) => {
    if (terms.length <= 1) return
    onChange(terms.filter(t => t.id !== id))
  }

  const updateTerm = (id: string, field: 'term' | 'definition', value: string) => {
    onChange(terms.map(t => (t.id === id ? { ...t, [field]: value } : t)))
  }

  return (
    <div className="space-y-3">
      {terms.map((pair, index) => (
        <div
          key={pair.id}
          className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 group"
        >
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-gray-400 w-5 text-center">{index + 1}</span>
            <GripVertical size={16} className="text-gray-300 cursor-grab" />
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Thuật ngữ</label>
              <input
                value={pair.term}
                onChange={e => updateTerm(pair.id, 'term', e.target.value)}
                placeholder="Nhập thuật ngữ..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Định nghĩa</label>
              <input
                value={pair.definition}
                onChange={e => updateTerm(pair.id, 'definition', e.target.value)}
                placeholder="Nhập định nghĩa..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeTerm(pair.id)}
            disabled={terms.length <= 1}
            className="mt-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addTerm}
        className="w-full border-dashed"
      >
        <Plus size={16} />
        Thêm thuật ngữ
      </Button>
    </div>
  )
}
