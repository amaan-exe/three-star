'use client'

import { useState } from 'react'
import { Star, Bed, Sparkles, HeartHandshake, ShieldAlert, ArrowRight, X, Crown, Heart } from 'lucide-react'

export type RatingCategory = 'overall' | 'food' | 'service'

interface LowRatingPromptModalProps {
  isOpen: boolean
  attemptedRating: number
  restaurantName?: string
  category?: RatingCategory
  onSelectRating: (rating: number) => void
  onClose: () => void
}

export default function LowRatingPromptModal({
  isOpen,
  attemptedRating,
  restaurantName = 'Residence Inn',
  category = 'overall',
  onSelectRating,
  onClose,
}: LowRatingPromptModalProps) {
  const [isShaking, setIsShaking] = useState(false)

  if (!isOpen) return null

  const handleAttemptDismiss = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
    onClose()
  }

  // Content configurations based on category
  const config = {
    food: {
      tag: 'Room Comfort & Cleanliness Commitment',
      title: 'We Strive For 5-Star Comfort & Cleanliness!',
      icon: Bed,
      body: `At ${restaurantName}, our housekeeping team takes immense pride in maintaining pristine rooms, fresh bedding, and peaceful comfort for every guest.`,
      notice: `You selected ${attemptedRating} star${attemptedRating > 1 ? 's' : ''}. Ratings below 4 stars cannot be accepted. Kindly consider rating our room comfort 4 or 5 stars so our housekeeping team is recognized!`,
      option5Title: '😍 Luxurious! (5 Stars)',
      option5Sub: 'Pristine room, cozy bed & peaceful sleep!',
      option4Title: '🙂 Comfortable (4 Stars)',
      option4Sub: 'Clean, pleasant & relaxing stay',
    },
    service: {
      tag: 'Hotel Hospitality Commitment',
      title: 'We Strive For Royal Hospitality!',
      icon: Crown,
      body: `At ${restaurantName}, our front desk, concierge, and room service staff are dedicated to providing warm, prompt, and courteous hospitality 24/7.`,
      notice: `You selected ${attemptedRating} star${attemptedRating > 1 ? 's' : ''}. Ratings below 4 stars cannot be accepted. Kindly rate our hospitality 4 or 5 stars so our service staff is celebrated for their hard work!`,
      option5Title: '👑 Royal & Outstanding (5 Stars)',
      option5Sub: 'Outstanding hospitality, warmth & 24/7 care!',
      option4Title: '❤️ Very Good (4 Stars)',
      option4Sub: 'Warm, courteous, and prompt staff',
    },
    overall: {
      tag: 'Hotel Guest Excellence',
      title: 'We Strive For An Exceptional Hotel Stay!',
      icon: HeartHandshake,
      body: `At ${restaurantName}, our entire hotel team is committed to making your stay in Patna memorable, safe, and truly comfortable.`,
      notice: `You selected ${attemptedRating} star${attemptedRating > 1 ? 's' : ''}. We cannot accept ratings below 4 stars on this survey. Kindly grant us 4 or 5 stars so our team can continue serving you at their best!`,
      option5Title: 'Give 5 Stars',
      option5Sub: 'Outstanding & Memorable Hotel Stay!',
      option4Title: 'Give 4 Stars',
      option4Sub: 'Very Good Comfort & Hospitality',
    },
  }[category]

  const Icon = config.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="low-rating-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-[0_25px_60px_-15px_rgba(217,119,6,0.3),0_8px_24px_rgba(0,0,0,0.12)] text-center space-y-5 overflow-hidden transition-transform duration-150 ${
          isShaking ? 'animate-bounce' : 'animate-in zoom-in-95'
        }`}
      >
        {/* Ambient Warm Golden Glows */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-yellow-400/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleAttemptDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Crown / Category Icon Badge */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 border-2 border-amber-200/70">
            <Icon className="w-10 h-10 drop-shadow-sm text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-50 border border-amber-300 text-amber-600 shadow-xs">
            <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Header & Context */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-300/80 text-[11px] font-bold text-amber-900 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{config.tag}</span>
          </div>

          <h2 id="low-rating-modal-title" className="text-2xl font-black text-stone-900 tracking-tight leading-tight">
            {config.title}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
            {config.body}
          </p>
        </div>

        {/* Feedback Alert Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-left space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Please consider rating us 4 or 5 stars</span>
          </div>
          <p className="text-[12px] text-stone-600 leading-relaxed">
            {config.notice}
          </p>
        </div>

        {/* Action Buttons to select 4 or 5 stars */}
        <div className="space-y-2.5 pt-1">
          {/* Option: 5 Stars */}
          <button
            type="button"
            onClick={() => onSelectRating(5)}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold shadow-lg shadow-amber-600/30 flex items-center justify-between group transition-all duration-200 cursor-pointer active:scale-[0.98] border border-amber-400/50"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-200 text-amber-200 drop-shadow-xs" />
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold leading-tight">{config.option5Title}</span>
                <span className="text-[10px] text-amber-100 font-medium">{config.option5Sub}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Option: 4 Stars */}
          <button
            type="button"
            onClick={() => onSelectRating(4)}
            className="w-full p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50/80 border-2 border-amber-300 text-stone-900 hover:text-amber-950 font-bold shadow-xs flex items-center justify-between group transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="flex items-center gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <Star className="w-4 h-4 text-stone-300 fill-transparent" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold leading-tight text-amber-950">{config.option4Title}</span>
                <span className="text-[10px] text-stone-500 font-medium">{config.option4Sub}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        <p className="text-[11px] text-stone-400">
          * A minimum rating of 4 stars is required to submit feedback.
        </p>
      </div>
    </div>
  )
}
