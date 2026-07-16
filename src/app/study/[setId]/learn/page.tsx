'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toaster'
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronLeft, Brain } from 'lucide-react'
import Link from 'next/link'
import { calculateSR } from '@/lib/sr-algorithm'
import { useStudyDirection, getQA, type Direction } from '@/hooks/use-study-direction'
import { LearnSettings } from '@/components/study/learn-settings'

interface Term { id: string; term: string; definition: string }
interface SRData { termId: string; interval: number; repetitions: number; easeFactor: number; nextReview: string }
type QuestionType = 'mcq' | 'written'
interface Question {
  term: Term
  type: QuestionType
  choices?: string[]
  qa: { question: string; answer: string; questionLabel: string; answerLabel: string }
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function LearnPage() {
  const params = useParams()
  const { showToast } = useToast()
  const setId = params.setId as string
  const { direction, setDirection } = useStudyDirection()
  const directionRef = useRef<Direction>(direction)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { directionRef.current = direction }, [direction])

  const [terms, setTerms] = useState<Term[]>([])
  const [srMap, setSrMap] = useState<Map<string, SRData>>(new Map())
  const [setTitle, setSetTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isDone, setIsDone] = useState(false)
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })
  const [questionMode, setQuestionMode] = useState<'random' | 'mcq' | 'written'>('random')
  const questionModeRef = useRef<'random' | 'mcq' | 'written'>('random')

  useEffect(() => { questionModeRef.current = questionMode }, [questionMode])

  useEffect(() => {
    if (!feedback) inputRef.current?.focus()
  }, [currentIdx, feedback])

  const buildQuestions = useCallback((allTerms: Term[], map: Map<string, SRData>, dir?: Direction, mode?: 'random' | 'mcq' | 'written') => {
    const d = dir ?? directionRef.current
    const m = mode ?? questionModeRef.current
    const due = allTerms.filter(t => {
      const sr = map.get(t.id)
      return !sr || new Date(sr.nextReview) <= new Date()
    })
    const pool = due.length >= 4 ? due : allTerms
    const selected = shuffle(pool).slice(0, Math.min(20, pool.length))

    const qs: Question[] = selected.map((term, idx) => {
      const qa = getQA(term, d, idx)
      const type: QuestionType = m === 'random' ? (Math.random() > 0.5 ? 'mcq' : 'written') : m
      let choices: string[] | undefined

      if (type === 'mcq') {
        const wrong = shuffle(allTerms.filter(t => t.id !== term.id))
          .slice(0, 3)
          .map(t => getQA(t, d, idx).answer)
        choices = shuffle([qa.answer, ...wrong])
      }

      return { term, type, choices, qa }
    })

    setQuestions(qs)
    setCurrentIdx(0)
    setAnswer('')
    setSelectedChoice(null)
    setFeedback(null)
    setIsDone(false)
    setStats({ correct: 0, wrong: 0 })
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`/api/sets/${setId}`).then(r => r.json()),
      fetch(`/api/sr/${setId}`).then(r => r.json()),
    ]).then(([setData, srData]) => {
      setTerms(setData.terms)
      setSetTitle(setData.title)
      const map = new Map<string, SRData>()
      for (const s of srData) map.set(s.termId, s)
      setSrMap(map)
      buildQuestions(setData.terms, map, direction)
    }).finally(() => setIsLoading(false))
  }, [setId])

  const handleAnswer = async (userAnswer: string) => {
    const q = questions[currentIdx]
    const isCorrect = userAnswer.trim().toLowerCase() === q.qa.answer.trim().toLowerCase()

    setFeedback(isCorrect ? 'correct' : 'wrong')
    setStats(s => ({ correct: s.correct + (isCorrect ? 1 : 0), wrong: s.wrong + (isCorrect ? 0 : 1) }))

    const quality = isCorrect ? 5 : 1
    const existing = srMap.get(q.term.id)
    calculateSR(quality, existing?.repetitions ?? 0, existing?.easeFactor ?? 2.5, existing?.interval ?? 1)

    await fetch(`/api/sr/${setId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: q.term.id, quality }),
    })

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1); setAnswer(''); setSelectedChoice(null); setFeedback(null)
      } else {
        setIsDone(true)
        fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId, mode: 'learn', score: stats.correct + (isCorrect ? 1 : 0), total: questions.length }) })
      }
    }, 1500)
  }

  const handleKnown = async () => {
    const q = questions[currentIdx]
    await fetch(`/api/sets/${setId}/known`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: q.term.id, known: true }) })
    showToast('Đã đánh dấu là biết', 'success')
    handleAnswer(q.qa.answer)
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (isDone) {
    const total = questions.length
    const pct = Math.round((stats.correct / total) * 100)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Xong rồi!</h2>
          <div className="text-5xl font-extrabold text-indigo-600 mb-4">{pct}%</div>
          <div className="flex justify-center gap-6 mb-6">
            <div><p className="text-2xl font-bold text-green-600">{stats.correct}</p><p className="text-xs text-gray-500">Đúng</p></div>
            <div><p className="text-2xl font-bold text-red-600">{stats.wrong}</p><p className="text-xs text-gray-500">Sai</p></div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => buildQuestions(terms, srMap)} size="lg" className="w-full"><RotateCcw size={16} />Học tiếp</Button>
            <Link href={`/sets/${setId}`}><Button variant="outline" size="lg" className="w-full">Về bộ từ vựng</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[currentIdx]
  if (!q) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={`/sets/${setId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={18} /><span className="text-sm font-medium">{setTitle}</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600 font-medium">{stats.correct} đúng</span>
            <span className="text-red-500 font-medium">{stats.wrong} sai</span>
            <LearnSettings
              direction={direction}
              questionMode={questionMode}
              onDirectionChange={d => { setDirection(d); buildQuestions(terms, srMap, d) }}
              onModeChange={m => { setQuestionMode(m); questionModeRef.current = m; buildQuestions(terms, srMap, undefined, m) }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Progress value={currentIdx} max={questions.length} className="mb-6" />
        <p className="text-xs text-center text-gray-400 mb-6">{currentIdx + 1}/{questions.length}</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-purple-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {q.type === 'mcq' ? `Chọn ${q.qa.answerLabel} đúng` : `Nhập ${q.qa.answerLabel}`}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-1">{q.qa.questionLabel}</p>
          <p className="text-2xl font-bold text-gray-900 text-center py-4">{q.qa.question}</p>
        </div>

        {q.type === 'mcq' ? (
          <div className="grid grid-cols-1 gap-3">
            {q.choices?.map(choice => {
              let btnClass = 'w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-colors '
              if (feedback) {
                if (choice === q.qa.answer) btnClass += 'border-green-500 bg-green-50 text-green-800'
                else if (choice === selectedChoice && feedback === 'wrong') btnClass += 'border-red-500 bg-red-50 text-red-800'
                else btnClass += 'border-gray-200 bg-gray-50 text-gray-400'
              } else {
                btnClass += 'border-gray-200 bg-white text-gray-900 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
              }
              return (
                <button key={choice} className={btnClass} onClick={() => { if (!feedback) { setSelectedChoice(choice); handleAnswer(choice) } }} disabled={!!feedback}>
                  {choice}
                </button>
              )
            })}
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); if (!feedback && answer.trim()) handleAnswer(answer) }} className="space-y-4">
            <input value={answer} onChange={e => setAnswer(e.target.value)}
              ref={inputRef} placeholder={`Nhập ${q.qa.answerLabel}...`} disabled={!!feedback}
              className={`block w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none ${
                feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-800'
                : feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-800'
                : 'border-gray-200 focus:border-indigo-500'}`}
            />
            {feedback === 'wrong' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-xs text-green-600 font-medium mb-1">Đáp án đúng:</p>
                <p className="text-sm font-semibold text-green-800">{q.qa.answer}</p>
              </div>
            )}
            {!feedback && <Button type="submit" size="lg" className="w-full" disabled={!answer.trim()}>Kiểm tra</Button>}
          </form>
        )}

        {feedback && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl ${feedback === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {feedback === 'correct' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span className="font-medium">{feedback === 'correct' ? 'Chính xác!' : 'Chưa đúng'}</span>
          </div>
        )}
        {!feedback && (
          <button onClick={handleKnown} className="mt-4 w-full text-sm text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2 py-2">
            <CheckCircle size={14} />Đã biết từ này, bỏ qua
          </button>
        )}
      </div>
    </div>
  )
}
