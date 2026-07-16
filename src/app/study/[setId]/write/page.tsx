'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toaster'
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useStudyDirection, getQA } from '@/hooks/use-study-direction'
import { DirectionPicker } from '@/components/study/direction-picker'

interface Term {
  id: string
  term: string
  definition: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function CharDiff({ input, expected }: { input: string; expected: string }) {
  const maxLen = Math.max(input.length, expected.length)
  const chars = []
  for (let i = 0; i < maxLen; i++) {
    const ch = expected[i] || ''
    const typed = input[i] || ''
    if (!ch) break
    if (!typed) {
      chars.push(<span key={i} className="underline decoration-red-400 text-red-400">{ch}</span>)
    } else if (typed.toLowerCase() === ch.toLowerCase()) {
      chars.push(<span key={i} className="text-green-600">{ch}</span>)
    } else {
      chars.push(<span key={i} className="text-red-500 line-through">{typed}</span>)
    }
  }
  return <span className="text-lg font-mono">{chars}</span>
}

export default function WritePage() {
  const params = useParams()
  const { showToast } = useToast()
  const setId = params.setId as string
  const { direction, setDirection } = useStudyDirection()

  const [terms, setTerms] = useState<Term[]>([])
  const [shuffled, setShuffled] = useState<Term[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })
  const [isDone, setIsDone] = useState(false)
  const [setTitle, setSetTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/sets/${setId}`)
      .then(r => r.json())
      .then(data => {
        const t: Term[] = data.terms
        setTerms(t)
        setSetTitle(data.title)
        setShuffled(shuffle(t))
      })
      .finally(() => setIsLoading(false))
  }, [setId])

  useEffect(() => {
    if (!feedback) inputRef.current?.focus()
  }, [feedback, currentIdx])

  const current = shuffled[currentIdx]
  const qa = current ? getQA(current, direction, currentIdx) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedback || !qa) return
    const isCorrect = answer.trim().toLowerCase() === qa.answer.trim().toLowerCase()
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setStats(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1),
    }))
  }

  const handleNext = () => {
    if (currentIdx < shuffled.length - 1) {
      setCurrentIdx(i => i + 1)
      setAnswer('')
      setFeedback(null)
    } else {
      setIsDone(true)
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId, mode: 'write', score: stats.correct, total: shuffled.length }),
      })
    }
  }

  const handleKnown = async () => {
    if (!current || !qa) return
    await fetch(`/api/sets/${setId}/known`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: current.id, known: true }),
    })
    showToast('Đã đánh dấu là biết', 'success')
    setAnswer(qa.answer)
    setFeedback('correct')
    setStats(s => ({ ...s, correct: s.correct + 1 }))
  }

  const restart = () => {
    setShuffled(shuffle(terms))
    setCurrentIdx(0)
    setAnswer('')
    setFeedback(null)
    setIsDone(false)
    setStats({ correct: 0, wrong: 0 })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isDone) {
    const pct = Math.round((stats.correct / shuffled.length) * 100)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoàn thành!</h2>
          <div className="text-5xl font-extrabold text-indigo-600 mb-4">{pct}%</div>
          <div className="flex justify-center gap-6 mb-6">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
              <p className="text-xs text-gray-500">Đúng</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.wrong}</p>
              <p className="text-xs text-gray-500">Sai</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={restart} size="lg" className="w-full">
              <RotateCcw size={16} />
              Làm lại
            </Button>
            <Link href={`/sets/${setId}`}>
              <Button variant="outline" size="lg" className="w-full">Về bộ từ vựng</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={`/sets/${setId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">{setTitle}</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600 font-medium">{stats.correct} đúng</span>
            <span className="text-red-500 font-medium">{stats.wrong} sai</span>
            <DirectionPicker direction={direction} onChange={d => { setDirection(d); setAnswer(''); setFeedback(null) }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Progress value={currentIdx} max={shuffled.length} className="mb-8" />
        <p className="text-xs text-center text-gray-400 mb-6">{currentIdx + 1}/{shuffled.length}</p>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{qa?.questionLabel}</p>
          <p className="text-xl font-semibold text-gray-900 text-center">{qa?.question}</p>
        </div>

        {/* Answer form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhập {qa?.answerLabel?.toLowerCase()} tương ứng
            </label>
            <input
              ref={inputRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Gõ câu trả lời..."
              disabled={!!feedback}
              className={`block w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none ${
                feedback === 'correct'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : feedback === 'wrong'
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
          </div>

          {feedback && (
            <div className={`rounded-xl p-4 ${feedback === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback === 'correct'
                  ? <CheckCircle size={18} className="text-green-600" />
                  : <XCircle size={18} className="text-red-600" />}
                <span className={`font-medium text-sm ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                  {feedback === 'correct' ? 'Chính xác!' : 'Chưa đúng'}
                </span>
              </div>
              {feedback === 'wrong' && qa && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Đáp án đúng:</p>
                  <CharDiff input={answer} expected={qa.answer} />
                  <p className="text-sm font-bold text-gray-800 mt-1">→ {qa.answer}</p>
                </div>
              )}
            </div>
          )}

          {!feedback ? (
            <Button type="submit" size="lg" className="w-full" disabled={!answer.trim()}>
              Kiểm tra
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} size="lg" className="w-full">
              {currentIdx < shuffled.length - 1 ? 'Tiếp theo' : 'Xem kết quả'}
              <ArrowRight size={16} />
            </Button>
          )}
        </form>

        {!feedback && (
          <button
            onClick={handleKnown}
            className="mt-4 w-full text-sm text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2 py-2"
          >
            <CheckCircle size={14} />
            Đã biết từ này
          </button>
        )}
      </div>
    </div>
  )
}
