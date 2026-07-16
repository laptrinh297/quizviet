'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Flashcard } from '@/components/study/flashcard'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toaster'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, RotateCcw, Trophy, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useStudyDirection, getQA } from '@/hooks/use-study-direction'
import { DirectionPicker } from '@/components/study/direction-picker'

interface Term { id: string; term: string; definition: string }

export default function FlashcardsPage() {
  const params = useParams()
  const { showToast } = useToast()
  const setId = params.setId as string
  const { direction, setDirection } = useStudyDirection()

  const [terms, setTerms] = useState<Term[]>([])
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [setTitle, setSetTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    fetch(`/api/sets/${setId}`)
      .then(r => r.json())
      .then(data => { setTerms(data.terms); setSetTitle(data.title) })
      .finally(() => setIsLoading(false))
  }, [setId])

  const goNext = useCallback(() => {
    if (currentIndex < terms.length - 1) {
      setCurrentIndex(i => i + 1); setIsFlipped(false)
    } else {
      setIsDone(true)
      fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId, mode: 'flashcards', score: knownIds.size, total: terms.length }) })
    }
  }, [currentIndex, terms.length, setId, knownIds.size])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) { setCurrentIndex(i => i - 1); setIsFlipped(false) }
  }, [currentIndex])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isDone) return
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped(f => !f) }
      else if (e.code === 'ArrowRight') goNext()
      else if (e.code === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isDone, goNext, goPrev])

  const toggleKnown = async () => {
    const term = terms[currentIndex]
    const isKnown = knownIds.has(term.id)
    const newKnown = new Set(knownIds)
    if (isKnown) newKnown.delete(term.id); else newKnown.add(term.id)
    setKnownIds(newKnown)
    await fetch(`/api/sets/${setId}/known`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: term.id, known: !isKnown }) })
    if (!isKnown) { showToast('Đã đánh dấu là biết', 'success'); goNext() }
  }

  const restart = () => { setCurrentIndex(0); setIsFlipped(false); setIsDone(false) }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const currentTerm = terms[currentIndex]
  const qa = currentTerm ? getQA(currentTerm, direction, currentIndex) : null

  if (isDone) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoàn thành!</h2>
        <p className="text-gray-500 mb-6">Bạn đã học {terms.length} thẻ. Đã biết: {knownIds.size}/{terms.length}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={restart} size="lg" className="w-full"><RotateCcw size={16} />Học lại từ đầu</Button>
          <Link href={`/sets/${setId}`}><Button variant="outline" size="lg" className="w-full">Về bộ từ vựng</Button></Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={`/sets/${setId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">{setTitle}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{currentIndex + 1}/{terms.length}</span>
            <DirectionPicker direction={direction} onChange={d => { setDirection(d); setIsFlipped(false) }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Progress value={currentIndex + 1} max={terms.length} className="mb-8" />
        <div className="text-center text-xs text-gray-400 mb-6">Space: lật thẻ · ← →: điều hướng</div>

        <div onClick={() => setIsFlipped(f => !f)} className="mb-6">
          <div className="flip-card w-full" style={{ height: '320px' }}>
            <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
              <div className="flip-card-front flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-gray-200 shadow-lg cursor-pointer">
                {knownIds.has(currentTerm?.id) && (
                  <span className="absolute top-4 right-4 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Đã biết</span>
                )}
                <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wide">{qa?.questionLabel}</p>
                <p className="text-3xl font-bold text-gray-900 text-center">{qa?.question}</p>
                <p className="mt-8 text-xs text-gray-400">Nhấp để lật thẻ</p>
              </div>
              <div className="flip-card-back flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-2xl shadow-lg cursor-pointer">
                <p className="text-xs font-medium text-indigo-200 mb-4 uppercase tracking-wide">{qa?.answerLabel}</p>
                <p className="text-2xl font-bold text-white text-center">{qa?.answer}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} size="lg">
            <ArrowLeft size={18} />Trước
          </Button>
          <Button onClick={toggleKnown} variant={knownIds.has(currentTerm?.id) ? 'secondary' : 'default'} size="lg" className="flex-1">
            {knownIds.has(currentTerm?.id) ? <><XCircle size={16} />Chưa biết</> : <><CheckCircle size={16} />Đã biết</>}
          </Button>
          <Button onClick={goNext} size="lg" variant="outline">
            {currentIndex === terms.length - 1 ? 'Xong' : 'Tiếp'}<ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
