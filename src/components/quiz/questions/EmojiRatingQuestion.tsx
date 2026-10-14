'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import LowRatingPromptModal from '../LowRatingPromptModal'

interface EmojiRatingQuestionProps {
  value: number | null
  onChange: (value: number) => void
  restaurantName?: string
}

const EMOJI_OPTIONS = [
  { rating: 1, emoji: '😞', label: 'Needs Care' },
  { rating: 2, emoji: '😕', label: 'Fair' },
  { rating: 3, emoji: '😐', label: 'Average' },
  { rating: 4, emoji: '🙂', label: 'Comfortable' },
  { rating: 5, emoji: '😍', label: 'Luxurious!' },
]

export default function EmojiRatingQuestion({
  value,
  onChange,
  restaurantName = 'Residence Inn',
}: EmojiRatingQuestionProps) {
  const [showLowRatingModal, setShowLowRatingModal] = useState(false)
  const [attemptedRating, setAttemptedRating] = useState<number>(3)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  const handleSelect = (rating: number) => {
    if (rating <= 3) {
      setAttemptedRating(rating)
      setShowLowRatingModal(true)
      setWarningMessage(
        `At ${restaurantName}, room ratings below 4 stars cannot be accepted. Please choose Comfortable (4) or Luxurious! (5) to continue.`
      )
      return
    }

    setWarningMessage(null)
    setShowLowRatingModal(false)
    onChange(rating)
  }

  const handleKeyDown = (e: React.KeyboardEvent, rating: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(5, (value ?? rating) + 1)
      handleSelect(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(1, (value ?? rating) - 1)
      handleSelect(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      handleSelect(4)
    } else if (e.key === 'End') {
      e.preventDefault()
      handleSelect(5)
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
            Question 2 of 6
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-amber-800 font-medium">Required</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          How was your{' '}
          <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            room comfort &amp; cleanliness
          </span>
          ?
        </h2>
        <p className="text-sm text-stone-600">
          Cleanliness, bed comfort, quiet ambiance, &amp; amenities (4 or 5 stars required)
        </p>
      </div>

      {/* 5 Emoji Face Buttons */}
      <div
        role="radiogroup"
        aria-label="Room comfort and cleanliness rating"
        className="py-4 sm:py-6 flex items-center justify-center gap-1 sm:gap-3.5 flex-nowrap overflow-x-auto no-scrollbar"
      >
        {EMOJI_OPTIONS.map((opt) => {
          const isSelected = value === opt.rating
          const isBelowThreshold = opt.rating <= 3

          return (
            <button
              key={opt.rating}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!value && opt.rating === 4) ? 0 : -1}
              onClick={() => handleSelect(opt.rating)}
              onKeyDown={(e) => handleKeyDown(e, opt.rating)}
              aria-label={`${opt.label} (${opt.rating} of 5)`}
              className={`group flex flex-col items-center justify-center w-[58px] h-20 sm:w-18 sm:h-24 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0 ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 scale-105 sm:scale-110 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40'
                  : isBelowThreshold
                  ? 'border-stone-200 bg-stone-50/40 hover:bg-amber-50/30 hover:border-amber-200 opacity-80 hover:opacity-100'
                  : 'border-amber-200/80 bg-white hover:bg-amber-50/60 hover:border-amber-400 shadow-2xs'
              }`}
            >
              <span
                className={`text-2xl sm:text-4xl transition-transform duration-200 ${
                  isBelowThreshold ? 'grayscale-25 group-hover:grayscale-0 group-hover:scale-105' : 'group-hover:scale-115'
                }`}
                aria-hidden="true"
              >
                {opt.emoji}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-semibold mt-1 sm:mt-2 transition-colors truncate px-1 ${
                  isSelected
                    ? 'text-amber-900 font-bold'
                    : isBelowThreshold
                    ? 'text-stone-400 group-hover:text-stone-700'
                    : 'text-stone-700 group-hover:text-amber-950 font-bold'
                }`}
              >
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Verbal Feedback Label or Warning */}
      <div className="min-h-7" aria-live="polite">
        {value && value >= 4 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{EMOJI_OPTIONS.find((o) => o.rating === value)?.label} — Thank you!</span>
          </div>
        ) : warningMessage ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold animate-in shake duration-300 max-w-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        ) : (
          <p className="text-xs text-stone-500">Please select Good (4) or Amazing! (5)</p>
        )}
      </div>

      {/* Modal triggered when 1, 2, or 3 clicked */}
      <LowRatingPromptModal
        isOpen={showLowRatingModal}
        attemptedRating={attemptedRating}
        restaurantName={restaurantName}
        category="food"
        onSelectRating={handleModalSelect}
        onClose={() => setShowLowRatingModal(false)}
      />
    </div>
  )
}
