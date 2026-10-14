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
  4: '4 Stars — Very comfortable & relaxing!',
  5: '5 Stars — Outstanding hotel experience!',
}

export default function StarRatingQuestion({
  value = 5,
  onChange,
  restaurantName = 'Residence Inn',
}: StarRatingQuestionProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [showLowRatingModal, setShowLowRatingModal] = useState(false)
  const [attemptedRating, setAttemptedRating] = useState<number>(3)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  // Ensure value is strictly 4 or 5
  const safeValue = typeof value === 'number' && value >= 4 ? value : 5
  const activeRating = hovered && hovered >= 4 ? hovered : safeValue

  const handleStarClick = (star: number) => {
    if (star <= 3) {
      setAttemptedRating(star)
      setShowLowRatingModal(true)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      setWarningMessage(
        `Ratings of 3 stars or lower cannot be chosen. Please select 4 or 5 stars to continue.`
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
      const next = Math.min(5, Math.max(4, (safeValue ?? star) + 1))
      handleStarClick(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(4, (safeValue ?? star) - 1)
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
    onChange(chosenRating >= 4 ? chosenRating : 5)
  }

  return (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-900">
            Quick Rating
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-amber-800 font-medium">4 or 5 Stars</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          How many stars for{' '}
          <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            {restaurantName}
          </span>
          ?
        </h2>
        <p className="text-sm text-stone-600">
          Tap 4 or 5 stars to generate your review for Google
        </p>
      </div>

      {/* Interactive Stars */}
      <div
        role="radiogroup"
        aria-label="Star rating"
        className={`py-4 sm:py-6 flex items-center justify-center gap-1.5 sm:gap-3.5 transition-transform duration-150 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating
          const isSelected = star === safeValue
          const isLowRating = star <= 3

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleStarClick(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              aria-label={
                isLowRating
                  ? `${star} star${star > 1 ? 's' : ''} (ratings below 4 stars not accepted)`
                  : `Rate ${star} stars: ${RATING_LABELS[star]}`
              }
              className={`relative min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-amber-50 scale-110 sm:scale-115 shadow-lg shadow-amber-500/25 border-2 border-amber-400 ring-2 ring-amber-300/40'
                  : isLowRating
                  ? 'opacity-70 hover:opacity-100 hover:bg-rose-50/40 border border-transparent'
                  : 'hover:bg-amber-50/80 hover:scale-105 border border-amber-200/50 shadow-2xs'
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

      {/* Verbal Feedback Label or Warning Notice */}
      <div className="min-h-7" aria-live="polite">
        {warningMessage ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-900 border border-rose-300 text-xs font-semibold animate-in shake duration-300 max-w-sm shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        ) : safeValue && RATING_LABELS[safeValue] ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold animate-in fade-in duration-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{RATING_LABELS[safeValue]}</span>
          </div>
        ) : (
          <p className="text-xs text-stone-500">Please select 4 or 5 stars</p>
        )}
      </div>

      {/* Low Rating Prompt Modal */}
      <LowRatingPromptModal
        isOpen={showLowRatingModal}
        attemptedRating={attemptedRating}
        restaurantName={restaurantName}
        category="overall"
        onSelectRating={handleModalSelect}
        onClose={() => setShowLowRatingModal(false)}
      />
    </div>
  )
}
