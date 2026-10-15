'use client'

import { useState } from 'react'
import { Frown, Meh, Smile, Heart, Crown, Check, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import LowRatingPromptModal from '../LowRatingPromptModal'

interface ServiceRatingQuestionProps {
  value: number | null
  onChange: (value: number) => void
  restaurantName?: string
}

const SERVICE_OPTIONS = [
  {
    rating: 1,
    label: 'Needs Attention',
    desc: 'Slow, inattentive, or unhelpful',
    icon: Frown,
    activeBorder: 'border-rose-400',
    activeBg: 'bg-rose-50',
    badgeActive: 'bg-rose-600 text-white shadow-xs',
    badgeInactive: 'bg-rose-50 text-rose-700 border border-rose-200',
    labelActive: 'text-rose-950 font-bold',
    labelInactive: 'text-stone-800',
    indicatorActive: 'border-rose-500 bg-rose-500 text-white',
  },
  {
    rating: 2,
    label: 'Fair',
    desc: 'Could be friendlier or faster',
    icon: Meh,
    activeBorder: 'border-amber-400',
    activeBg: 'bg-amber-50',
    badgeActive: 'bg-amber-600 text-white shadow-xs',
    badgeInactive: 'bg-amber-50 text-amber-800 border border-amber-200',
    labelActive: 'text-amber-950 font-bold',
    labelInactive: 'text-stone-800',
    indicatorActive: 'border-amber-500 bg-amber-500 text-white',
  },
  {
    rating: 3,
    label: 'Good',
    desc: 'Attentive & met expectations',
    icon: Smile,
    activeBorder: 'border-stone-400',
    activeBg: 'bg-stone-100',
    badgeActive: 'bg-stone-700 text-white shadow-xs',
    badgeInactive: 'bg-stone-100 text-stone-700 border border-stone-200',
    labelActive: 'text-stone-900 font-bold',
    labelInactive: 'text-stone-800',
    indicatorActive: 'border-stone-700 bg-stone-700 text-white',
  },
  {
    rating: 4,
    label: 'Very Good',
    desc: 'Warm, attentive, and helpful staff',
    icon: Heart,
    activeBorder: 'border-emerald-400',
    activeBg: 'bg-emerald-50',
    badgeActive: 'bg-emerald-600 text-white shadow-xs',
    badgeInactive: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    labelActive: 'text-emerald-950 font-bold',
    labelInactive: 'text-stone-800',
    indicatorActive: 'border-emerald-600 bg-emerald-600 text-white',
  },
  {
    rating: 5,
    label: 'Royal & Outstanding',
    desc: 'Outstanding hospitality & care',
    icon: Crown,
    activeBorder: 'border-amber-500',
    activeBg: 'bg-gradient-to-r from-amber-50 via-amber-100/40 to-amber-50',
    badgeActive: 'bg-gradient-to-tr from-amber-600 to-yellow-600 text-white font-bold shadow-md shadow-amber-500/20',
    badgeInactive: 'bg-amber-50 text-amber-900 border border-amber-200',
    labelActive: 'text-amber-950 font-bold',
    labelInactive: 'text-stone-800',
    indicatorActive: 'border-amber-600 bg-amber-600 text-white',
  },
]

export default function ServiceRatingQuestion({
  value,
  onChange,
  restaurantName = 'Motu Seth Restaurant',
}: ServiceRatingQuestionProps) {
  const [showLowRatingModal, setShowLowRatingModal] = useState(false)
  const [attemptedRating, setAttemptedRating] = useState<number>(3)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  const handleSelect = (rating: number) => {
    if (rating <= 3) {
      setAttemptedRating(rating)
      setShowLowRatingModal(true)
      setWarningMessage(
        `At ${restaurantName}, service ratings below 4 stars cannot be accepted. Please choose Very Good (4) or Royal & Outstanding (5) to continue.`
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
            Question 3 of 6
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-amber-800 font-medium">Required</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          How was the{' '}
          <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            hospitality &amp; service
          </span>
          ?
        </h2>
        <p className="text-sm text-stone-600">
          Staff friendliness, attentiveness, and order speed (4 or 5 stars required)
        </p>
      </div>

      {/* Vertical List of 5 Service Options */}
      <div
        role="radiogroup"
        aria-label="Service and hospitality rating"
        className="py-2 space-y-2.5 max-w-md mx-auto text-left"
      >
        {SERVICE_OPTIONS.map((opt) => {
          const Icon = opt.icon
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
              aria-label={`${opt.label}: ${opt.desc}`}
              className={`group w-full p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 flex items-center justify-between shadow-xs ${
                isSelected
                  ? `${opt.activeBorder} ${opt.activeBg} shadow-md`
                  : isBelowThreshold
                  ? 'border-stone-200 bg-stone-50/40 hover:bg-amber-50/30 hover:border-amber-200 opacity-80 hover:opacity-100'
                  : 'border-amber-200/80 bg-white hover:bg-amber-50/60 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? opt.badgeActive : opt.badgeInactive
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${isSelected ? opt.labelActive : opt.labelInactive}`}>
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-stone-500">{opt.desc}</div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  isSelected
                    ? opt.indicatorActive
                    : 'border-stone-300 bg-white group-hover:border-stone-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Verbal Feedback Label or Warning */}
      <div className="min-h-7" aria-live="polite">
        {value && value >= 4 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{SERVICE_OPTIONS.find((o) => o.rating === value)?.label} — Thank you!</span>
          </div>
        ) : warningMessage ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold animate-in shake duration-300 max-w-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        ) : (
          <p className="text-xs text-stone-500">Please select Very Good (4) or Royal &amp; Excellent (5)</p>
        )}
      </div>

      {/* Modal triggered when 1, 2, or 3 clicked */}
      <LowRatingPromptModal
        isOpen={showLowRatingModal}
        attemptedRating={attemptedRating}
        restaurantName={restaurantName}
        category="service"
        onSelectRating={handleModalSelect}
        onClose={() => setShowLowRatingModal(false)}
      />
    </div>
  )
}
