'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { type TermPair } from '@/components/sets/term-editor'

type ColRole = 'term' | 'definition' | 'skip'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (terms: TermPair[]) => void
}

function parseLine(line: string, sep: string): string[] {
  if (sep === '\t') return line.split('\t').map(s => s.trim())
  // Handle quoted CSV for comma separator
  const result: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === sep && !inQuote) { result.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  result.push(cur.trim())
  return result
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<'input' | 'configure'>('input')
  const [csvText, setCsvText] = useState('')
  const [sep, setSep] = useState(',')
  const [customSep, setCustomSep] = useState('')
  const [hasHeader, setHasHeader] = useState(false)
  const [roles, setRoles] = useState<ColRole[]>([])
  const [joinSep, setJoinSep] = useState(' - ')

  const effectiveSep = sep === 'custom' ? (customSep || ',') : sep

  // Parse all rows
  const rows = useMemo(() => {
    return csvText.trim().split('\n').map(l => parseLine(l, effectiveSep))
  }, [csvText, effectiveSep])

  const headerRow = hasHeader ? rows[0] : null
  const dataRows = hasHeader ? rows.slice(1) : rows
  const colCount = rows[0]?.length ?? 0

  const colNames = Array.from({ length: colCount }, (_, i) =>
    hasHeader && headerRow ? (headerRow[i] || `Cột ${i + 1}`) : `Cột ${i + 1}`
  )

  const handleAnalyze = () => {
    if (!csvText.trim()) return
    // Default: col 0 = term, rest = definition
    setRoles(Array.from({ length: colCount }, (_, i) => i === 0 ? 'term' : 'definition'))
    setStep('configure')
  }

  // Preview: first 3 data rows merged per roles
  const preview = useMemo(() => {
    return dataRows.slice(0, 3).map(cols => {
      const termParts = roles.map((r, i) => r === 'term' ? cols[i] : null).filter(Boolean)
      const defParts = roles.map((r, i) => r === 'definition' ? cols[i] : null).filter(Boolean)
      return {
        term: termParts.join(joinSep),
        definition: defParts.join(joinSep),
      }
    }).filter(p => p.term && p.definition)
  }, [dataRows, roles, joinSep])

  const handleImport = () => {
    const parsed: TermPair[] = []
    for (const cols of dataRows) {
      const termParts = roles.map((r, i) => r === 'term' ? (cols[i] || '') : null).filter(s => s !== null && s !== '')
      const defParts = roles.map((r, i) => r === 'definition' ? (cols[i] || '') : null).filter(s => s !== null && s !== '')
      const term = (termParts as string[]).join(joinSep).trim()
      const definition = (defParts as string[]).join(joinSep).trim()
      if (term && definition) {
        parsed.push({ id: Math.random().toString(36).slice(2), term, definition })
      }
    }
    if (parsed.length > 0) {
      onImport(parsed)
      handleClose()
    }
  }

  const handleClose = () => {
    setStep('input')
    setCsvText('')
    setSep(',')
    setCustomSep('')
    setHasHeader(false)
    setRoles([])
    onClose()
  }

  const termCols = roles.filter(r => r === 'term').length
  const defCols = roles.filter(r => r === 'definition').length

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import từ CSV / bảng dữ liệu">
      {step === 'input' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Dán dữ liệu từ Excel, Google Sheets, hoặc file CSV. Mỗi dòng là một từ.
          </p>

          {/* Separator */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Dấu phân cách cột</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: ',', label: 'Dấu phẩy (,)' },
                { value: '\t', label: 'Tab' },
                { value: ';', label: 'Chấm phẩy (;)' },
                { value: 'custom', label: 'Tùy chỉnh' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSep(opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    sep === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {sep === 'custom' && (
                <input
                  value={customSep}
                  onChange={e => setCustomSep(e.target.value)}
                  placeholder="Nhập ký tự..."
                  className="w-28 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
                />
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={'食べる,たべる,to eat\n飲む,のむ,to drink\n見る,みる,to see'}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 font-mono placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            rows={8}
            autoFocus
          />

          {csvText.trim() && (
            <p className="text-xs text-gray-400">
              Phát hiện {rows.length} dòng, {colCount} cột
            </p>
          )}

          {/* Header row checkbox */}
          {colCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={e => setHasHeader(e.target.checked)}
                className="rounded"
              />
              Dòng đầu tiên là tiêu đề cột
            </label>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>Hủy</Button>
            <Button onClick={handleAnalyze} disabled={!csvText.trim() || colCount < 2}>
              Tiếp theo →
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Cấu hình vai trò từng cột</p>
              <button onClick={() => setStep('input')} className="text-xs text-gray-400 hover:text-gray-600">
                ← Quay lại
              </button>
            </div>

            {/* Column mapping */}
            <div className="space-y-2">
              {colNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-32 shrink-0 truncate" title={name}>
                    {name}
                  </span>
                  <span className="text-gray-300 text-xs">→</span>
                  <div className="flex gap-2">
                    {(['term', 'definition', 'skip'] as ColRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => setRoles(r => { const n = [...r]; n[i] = role; return n })}
                        className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                          roles[i] === role
                            ? role === 'term'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                              : role === 'definition'
                              ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                              : 'border-gray-400 bg-gray-100 text-gray-600 font-medium'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {role === 'term' ? 'Thuật ngữ' : role === 'definition' ? 'Định nghĩa' : 'Bỏ qua'}
                      </button>
                    ))}
                  </div>
                  {/* Sample value */}
                  <span className="text-xs text-gray-400 truncate max-w-[100px]" title={dataRows[0]?.[i]}>
                    {dataRows[0]?.[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Join separator (only show if multiple cols in same role) */}
          {(termCols > 1 || defCols > 1) && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 shrink-0">Nối nhiều cột bằng:</span>
              <input
                value={joinSep}
                onChange={e => setJoinSep(e.target.value)}
                className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
              />
              <span className="text-xs text-gray-400">(ví dụ: " - ", " | ", " ")</span>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Xem trước</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                  <span className="text-xs font-medium text-indigo-600">Thuật ngữ</span>
                  <span className="text-xs font-medium text-green-600">Định nghĩa</span>
                </div>
                {preview.map((p, i) => (
                  <div key={i} className={`grid grid-cols-2 px-3 py-2 text-sm ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className="text-gray-900 pr-2 truncate">{p.term}</span>
                    <span className="text-gray-600 truncate">{p.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation messages */}
          {termCols === 0 && (
            <p className="text-xs text-red-500">Cần chọn ít nhất 1 cột làm Thuật ngữ</p>
          )}
          {defCols === 0 && (
            <p className="text-xs text-red-500">Cần chọn ít nhất 1 cột làm Định nghĩa</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{dataRows.length} dòng dữ liệu</span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>Hủy</Button>
              <Button onClick={handleImport} disabled={termCols === 0 || defCols === 0}>
                Import {dataRows.length} thuật ngữ
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
