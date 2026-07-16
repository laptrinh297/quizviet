'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'
import { Trophy, RotateCcw, ChevronLeft, Timer } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Term {
  id: string
  term: string
  definition: string
}

interface Card {
  id: string
  content: string
  type: 'term' | 'definition'
  termId: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function MatchPage() {
  const params = useParams()
  const setId = params.setId as string
  const { showToast } = useToast()

  const [terms, setTerms] = useState<Term[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<Card | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [setTitle, setSetTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch(`/api/sets/${setId}`)
      .then(r => r.json())
      .then(data => {
        setTerms(data.terms)
        setSetTitle(data.title)
        buildGame(data.terms)
      })
      .finally(() => setIsLoading(false))
  }, [setId])

  const buildGame = (allTerms: Term[]) => {
    const pool = shuffle(allTerms).slice(0, 10)
    const termCards: Card[] = pool.map(t => ({
      id: `term-${t.id}`,
      content: t.term,
      type: 'term',
      termId: t.id,
    }))
    const defCards: Card[] = pool.map(t => ({
      id: `def-${t.id}`,
      content: t.definition,
      type: 'definition',
      termId: t.id,
    }))
    setCards(shuffle([...termCards, ...defCards]))
    setSelected(null)
    setMatched(new Set())
    setWrongPair(null)
    setTimer(0)
    setIsDone(false)
    setIsRunning(true)
  }

  useEffect(() => {
    if (isRunning && !isDone) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, isDone])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleCardClick = (card: Card) => {
    if (matched.has(card.id) || wrongPair) return
    if (selected?.id === card.id) {
      setSelected(null)
      return
    }

    if (!selected) {
      setSelected(card)
      return
    }

    // Check match
    if (selected.termId === card.termId && selected.type !== card.type) {
      // Match!
      const newMatched = new Set([...matched, selected.id, card.id])
      setMatched(newMatched)
      setSelected(null)

      if (newMatched.size === cards.length) {
        setIsDone(true)
        setIsRunning(false)
        if (timerRef.current) clearInterval(timerRef.current)
        setBestTime(prev => prev === null ? timer : Math.min(prev, timer))
        fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId, mode: 'match', score: 1, total: 1 }),
        })
      }
    } else {
      // Wrong
      setWrongPair([selected.id, card.id])
      setTimeout(() => {
        setWrongPair(null)
        setSelected(null)
      }, 800)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/sets/${setId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">{setTitle}</span>
          </Link>
          <div className="flex items-center gap-2 text-lg font-mono font-bold text-indigo-600">
            <Timer size={18} />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isDone ? (
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
              <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Xuất sắc!</h2>
              <p className="text-gray-500 mb-2">Thời gian hoàn thành</p>
              <div className="text-5xl font-extrabold text-indigo-600 mb-2 font-mono">{formatTime(timer)}</div>
              {bestTime !== null && (
                <p className="text-sm text-gray-400 mb-6">Kỷ lục tốt nhất: {formatTime(bestTime)}</p>
              )}
              <div className="flex flex-col gap-3">
                <Button onClick={() => buildGame(terms)} size="lg" className="w-full">
                  <RotateCcw size={16} />
                  Chơi lại
                </Button>
                <Link href={`/sets/${setId}`}>
                  <Button variant="outline" size="lg" className="w-full">Về bộ từ vựng</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                Đã ghép: {matched.size / 2}/{cards.length / 2}
              </p>
              <Button variant="outline" size="sm" onClick={() => buildGame(terms)}>
                <RotateCcw size={14} />
                Xáo trộn lại
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cards.map(card => {
                const isMatched = matched.has(card.id)
                const isSelected = selected?.id === card.id
                const isWrong = wrongPair?.includes(card.id)

                return (
                  <button
                    key={card.id}
                    onClick={() => !isMatched && handleCardClick(card)}
                    disabled={isMatched}
                    className={cn(
                      'relative p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left min-h-[80px] flex items-center',
                      isMatched && 'border-green-400 bg-green-50 text-green-700 opacity-60 cursor-default',
                      !isMatched && isSelected && 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-md scale-105',
                      !isMatched && isWrong && 'border-red-400 bg-red-50 text-red-700 shake',
                      !isMatched && !isSelected && !isWrong && 'border-gray-200 bg-white text-gray-900 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer shadow-sm',
                      card.type === 'term' ? 'font-bold' : 'font-normal',
                    )}
                  >
                    <span>{card.content}</span>
                    {isMatched && (
                      <span className="absolute top-2 right-2 text-green-500 text-xs">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
