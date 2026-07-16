export interface SRResult {
  interval: number
  repetitions: number
  easeFactor: number
  nextReview: Date
}

export function calculateSR(
  quality: number, // 0-5
  repetitions: number,
  easeFactor: number,
  interval: number
): SRResult {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEF < 1.3) newEF = 1.3

  let newRepetitions = repetitions
  let newInterval = interval

  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    newRepetitions += 1
    if (newRepetitions === 1) newInterval = 1
    else if (newRepetitions === 2) newInterval = 6
    else newInterval = Math.round(interval * newEF)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return { interval: newInterval, repetitions: newRepetitions, easeFactor: newEF, nextReview }
}
