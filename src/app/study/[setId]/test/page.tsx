'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronLeft, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useStudyDirection, getQA, type Direction } from '@/hooks/use-study-direction'
import { DirectionPicker } from '@/components/study/direction-picker'

interface Term {
  id: string
  term: string
  definition: string
}

type QuestionType = 'mcq' | 'fill' | 'truefalse' | 'matching'

interface Question {
  id: string
  type: QuestionType
  question: string
  questionLabel: string
  correctAnswer: string
  choices?: string[]
  matchPairs?: Array<{ left: string; right: string; termId: string }>
}

interface UserAnswer {
  [questionId: string]: string | { [key: string]: string }
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildTest(terms: Term[], direction: Direction): Question[] {
  const qs: Question[] = []
  const shuffled = shuffle(terms)

  shuffled.forEach((term, idx) => {
    const total = shuffled.length
    const pct = idx / total
    const qa = getQA(term, direction, idx)

    if (pct < 0.4) {
      // MCQ: show question, pick correct answer
      const wrong = shuffle(shuffled.filter(t => t.id !== term.id))
        .slice(0, 3)
        .map(t => getQA(t, direction, idx).answer)
      qs.push({
        id: `mcq-${term.id}`,
        type: 'mcq',
        question: `${qa.questionLabel}: "${qa.question}"`,
        questionLabel: qa.questionLabel,
        correctAnswer: qa.answer,
        choices: shuffle([qa.answer, ...wrong]),
      })
    } else if (pct < 0.7) {
      // Fill in
      qs.push({
        id: `fill-${term.id}`,
        type: 'fill',
        question: `${qa.questionLabel}: "${qa.question}". ${qa.answerLabel} là gì?`,
        questionLabel: qa.questionLabel,
        correctAnswer: qa.answer,
      })
    } else if (pct < 0.9) {
      // True/False
      const isTrue = Math.random() > 0.5
      const wrongAnswer = shuffle(shuffled.filter(t => t.id !== term.id))[0]
      const displayAnswer = isTrue ? qa.answer : (wrongAnswer ? getQA(wrongAnswer, direction, idx).answer : 'N/A')
      qs.push({
        id: `tf-${term.id}`,
        type: 'truefalse',
        question: `"${qa.question}" có ${qa.answerLabel.toLowerCase()} là "${displayAnswer}" - Đúng hay Sai?`,
        questionLabel: qa.questionLabel,
        correctAnswer: isTrue ? 'true' : 'false',
        choices: ['true', 'false'],
      })
    }
  })

  // Matching question: pair question side with answer side
  const matchTerms = shuffle(shuffled).slice(0, Math.min(5, shuffled.length))
  if (matchTerms.length >= 2) {
    const pairs = matchTerms.map((t, i) => {
      const qa = getQA(t, direction, i)
      return { left: qa.question, right: qa.answer, termId: t.id }
    })
    const firstQa = getQA(matchTerms[0], direction, 0)
    qs.push({
      id: 'matching-1',
      type: 'matching',
      question: `Ghép ${firstQa.questionLabel.toLowerCase()} với ${firstQa.answerLabel.toLowerCase()} đúng:`,
      questionLabel: firstQa.questionLabel,
      correctAnswer: JSON.stringify(Object.fromEntries(pairs.map(p => [p.left, p.right]))),
      matchPairs: pairs,
    })
  }

  return qs
}

export default function TestPage() {
  const params = useParams()
  const setId = params.setId as string
  const { direction, setDirection } = useStudyDirection()

  const [terms, setTerms] = useState<Term[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<UserAnswer>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [setTitle, setSetTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sets/${setId}`)
      .then(r => r.json())
      .then(data => {
        setTerms(data.terms)
        setSetTitle(data.title)
        setQuestions(buildTest(data.terms, direction))
      })
      .finally(() => setIsLoading(false))
  }, [setId])

  const setAnswer = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  const setMatchAnswer = (qId: string, left: string, right: string) => {
    setAnswers(prev => {
      const existing = (prev[qId] as { [k: string]: string }) || {}
      return { ...prev, [qId]: { ...existing, [left]: right } }
    })
  }

  const handleSubmit = () => {
    let correct = 0
    questions.forEach(q => {
      const ans = answers[q.id]
      if (q.type === 'matching') {
        const correct_pairs = JSON.parse(q.correctAnswer)
        const user_pairs = (ans as { [k: string]: string }) || {}
        const allMatch = Object.entries(correct_pairs).every(([l, r]) => user_pairs[l] === r)
        if (allMatch) correct++
      } else {
        if (typeof ans === 'string' && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correct++
        }
      }
    })
    setScore(correct)
    setSubmitted(true)
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, mode: 'test', score: correct, total: questions.length }),
    })
  }

  const restart = (dir?: Direction) => {
    const d = dir ?? direction
    setQuestions(buildTest(terms, d))
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  const isAnswerCorrect = (q: Question): boolean => {
    const ans = answers[q.id]
    if (q.type === 'matching') {
      const correct_pairs = JSON.parse(q.correctAnswer)
      const user_pairs = (ans as { [k: string]: string }) || {}
      return Object.entries(correct_pairs).every(([l, r]) => user_pairs[l] === r)
    }
    return typeof ans === 'string' && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={`/sets/${setId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">{setTitle}</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ClipboardList size={14} />
              {questions.length} câu hỏi
            </div>
            {!submitted && (
              <DirectionPicker direction={direction} onChange={d => { setDirection(d); restart(d) }} />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {submitted ? (
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-8">
              <Trophy size={56} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Kết quả kiểm tra</h2>
              <div className="text-6xl font-extrabold text-indigo-600 mb-2">{pct}%</div>
              <p className="text-gray-500">{score}/{questions.length} câu đúng</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Button onClick={() => restart()}>
                  <RotateCcw size={14} />
                  Làm lại
                </Button>
                <Link href={`/sets/${setId}`}>
                  <Button variant="outline">Về bộ từ vựng</Button>
                </Link>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết câu trả lời</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const correct = isAnswerCorrect(q)
                const ans = answers[q.id]
                return (
                  <div key={q.id} className={`bg-white rounded-xl border-2 p-5 ${correct ? 'border-green-200' : 'border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      {correct
                        ? <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                        : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-400 mb-1">Câu {idx + 1}</p>
                        <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                        {!correct && (
                          <div className="text-sm">
                            <p className="text-red-600">Bạn trả lời: {typeof ans === 'string' ? ans : JSON.stringify(ans)}</p>
                            <p className="text-green-700 font-medium">Đáp án đúng: {q.type === 'matching' ? 'Xem bên dưới' : q.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="font-medium text-gray-900">{q.question}</p>
                </div>

                {q.type === 'mcq' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.choices?.map(c => (
                      <button
                        key={c}
                        onClick={() => setAnswer(q.id, c)}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-colors ${
                          answers[q.id] === c
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'fill' && (
                  <input
                    value={(answers[q.id] as string) || ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    placeholder="Nhập câu trả lời..."
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                )}

                {q.type === 'truefalse' && (
                  <div className="flex gap-3">
                    {['true', 'false'].map(val => (
                      <button
                        key={val}
                        onClick={() => setAnswer(q.id, val)}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          answers[q.id] === val
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-indigo-300'
                        }`}
                      >
                        {val === 'true' ? 'Đúng' : 'Sai'}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'matching' && q.matchPairs && (
                  <div className="space-y-3">
                    {q.matchPairs.map(pair => {
                      const matchAns = (answers[q.id] as { [k: string]: string }) || {}
                      const availableRights = q.matchPairs!.map(p => p.right)
                      return (
                        <div key={pair.left} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900 w-1/3 shrink-0">{pair.left}</span>
                          <span className="text-gray-300">→</span>
                          <select
                            value={matchAns[pair.left] || ''}
                            onChange={e => setMatchAnswer(q.id, pair.left, e.target.value)}
                            className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Chọn đáp án...</option>
                            {availableRights.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full"
              disabled={Object.keys(answers).length < questions.filter(q => q.type !== 'matching').length}
            >
              Nộp bài kiểm tra
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
