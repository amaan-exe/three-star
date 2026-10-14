'use client'

import { useState } from 'react'
import { Star, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import LowRatingPromptModal from '../LowRatingPromptModal'

interface StarRatingQuestionProps {
  value: number | null
  onChange: (value: number) => void
  restaurantName?: string
}

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing experience',
  2: 'Could have been better',
  3: 'Good / Average',
  4: 'Very good!',
  5: 'Outstanding experience!',
}

export default function StarRatingQuestion({
  value,
  onChange,
  restaurantName = 'Residence Inn',
}: StarRatingQuestionProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [showLowRatingModal, setShowLowRatingModal] = useState(false)
  const [attemptedRating, setAttemptedRating] = useState<number>(3)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  const activeRating = hovered ?? value ?? 0

  const handleStarClick = (star: number) => {
    if (star <= 3) {
      setAttemptedRating(star)
      setShowLowRatingModal(true)
      setWarningMessage(
        `At ${restaurantName}, ratings of 3 stars or lower cannot be accepted. Please choose 4 or 5 stars to continue.`
      )
      return
    }

    // 4 or 5 stars accepted!
    setWarningMessage(null)
    setShowLowRatingModal(false)
    onChange(star)
  }

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(5, (value ?? star) + 1)
      handleStarClick(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(1, (value ?? star) - 1)
      handleStarClick(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      handleStarClick(4)
    } else if (e.key === 'End') {
      e.preventDefault()
      handleStarClick(5)
    }
  }

  const handleModalSelect = (chosenRating: number) => {
    setShowLowRatingModal(false)
    setWarningMessage(null)
    onChange(chosenRating)
  }

  return (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-900">
            Question 1 of 6
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-amber-800 font-medium">Required</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          How was your{' '}
          <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            overall experience
          </span>{' '}
          today?
        </h2>
        <p className="text-sm text-stone-600">
          Tap a star to rate your visit (4 or 5 stars required)
        </p>
      </div>

      {/* Interactive Stars */}
      <div
        role="radiogroup"
        aria-label="Overall experience rating"
        className="py-4 sm:py-6 flex items-center justify-center gap-1.5 sm:gap-3.5"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating
          const isSelected = star === value

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!value && star === 4) ? 0 : -1}
              onClick={() => handleStarClick(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}: ${RATING_LABELS[star]}`}
              className={`relative min-w-[44px] min-h-[44px] sm:min-w-[54px] sm:min-h-[54px] p-2 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-amber-50 scale-105 sm:scale-110 shadow-lg shadow-amber-500/20 border-2 border-amber-400'
                  : star <= 3
                  ? 'hover:bg-amber-50/50 hover:scale-105 border border-transparent'
                  : 'hover:bg-amber-50 hover:scale-110 border border-amber-200/60 shadow-xs'
              }`}
            >
              <Star
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_3px_10px_rgba(251,191,36,0.5)]'
                    : 'text-stone-300 fill-transparent hover:text-amber-300'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Verbal Feedback Label or Warning */}
      <div className="min-h-7" aria-live="polite">
        {value && value >= 4 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{RATING_LABELS[value]} — Thank you!</span>
          </div>
        ) : warningMessage ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold animate-in shake duration-300 max-w-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        ) : (
          <p className="text-xs text-stone-500">Please select 4 or 5 stars</p>
        )}
      </div>

      {/* Modal triggered when 1, 2, or 3 stars clicked */}
      <LowRatingPromptModal
        isOpen={showLowRatingModal}
        attemptedRating={attemptedRating}
        restaurantName={restaurantName}
        onSelectRating={handleModalSelect}
        onClose={() => setShowLowRatingModal(false)}
      />
    </div>
  )
}
