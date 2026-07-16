'use client'

import { useState, useEffect } from 'react'

export type Direction = 'definition' | 'term' | 'both'

const STORAGE_KEY = 'study-direction'

export function useStudyDirection() {
  const [direction, setDirectionState] = useState<Direction>('definition')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Direction | null
    if (saved) setDirectionState(saved)
  }, [])

  const setDirection = (d: Direction) => {
    setDirectionState(d)
    localStorage.setItem(STORAGE_KEY, d)
  }

  return { direction, setDirection }
}

// Helper: lấy câu hỏi và đáp án đúng dựa theo direction
export function getQA(
  term: { term: string; definition: string },
  direction: Direction,
  index = 0,
): { question: string; answer: string; questionLabel: string; answerLabel: string } {
  let showTerm: boolean
  if (direction === 'definition') showTerm = true       // hỏi term → trả lời definition
  else if (direction === 'term') showTerm = false        // hỏi definition → trả lời term
  else showTerm = index % 2 === 0                        // both: xen kẽ

  return {
    question: showTerm ? term.term : term.definition,
    answer: showTerm ? term.definition : term.term,
    questionLabel: showTerm ? 'Thuật ngữ' : 'Định nghĩa',
    answerLabel: showTerm ? 'Định nghĩa' : 'Thuật ngữ',
  }
}
