'use client'

import { useState } from 'react'
import ReviewDraftCard from './ReviewDraftCard'
import PrivateFeedbackModal from './PrivateFeedbackModal'
import CustomerDetailsModal from './CustomerDetailsModal'
import ThankYouCard from './ThankYouCard'
import OfflineBanner from './OfflineBanner'
import StarRatingQuestion from './questions/StarRatingQuestion'
import { trackClientEvent } from '@/lib/client/telemetry'
import { Utensils, Loader2, Star, MapPin, Sparkles, Phone, Copy, Check, ArrowRight, UserCheck } from 'lucide-react'

interface MenuItemData {
  id: string
  name: string | { [key: string]: string; en: string }
  category?: string
  price?: number
}

interface QuizFlowProps {
  slug: string
  restaurantName: string
  logoUrl?: string | null
  primaryColor?: string | null
  welcomeMessage?: string
  googleReviewUrl?: string | null
  initialSessionId?: string | null
  initialStatus?: string | null
  initialAnswers?: Record<string, any>
  initialDraftText?: string | null
  menuItems?: MenuItemData[]
}

export default function QuizFlow({
  slug,
  restaurantName,
  logoUrl,
  welcomeMessage = "Welcome to Motu Seth Restaurant! We'd love to hear about your dining experience today.",
  googleReviewUrl = null,
  initialSessionId = null,
  initialStatus = null,
  initialAnswers = {},
  initialDraftText = null,
}: QuizFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const isInitiallyCompleted = initialStatus === 'completed'

  const [view, setView] = useState<'rate' | 'draft' | 'thank_you'>(
    isInitiallyCompleted ? 'draft' : 'rate'
  )

  const [selectedRating, setSelectedRating] = useState<number>(
    typeof initialAnswers.overall_rating === 'number' && initialAnswers.overall_rating >= 4
      ? initialAnswers.overall_rating
      : 5
  )

  const [isPrivateFeedbackOpen, setIsPrivateFeedbackOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [hasSyncError, setHasSyncError] = useState(false)
  const [phoneCopied, setPhoneCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.clipboard) {
      navigator.clipboard.writeText('7631996611')
      setPhoneCopied(true)
      setTimeout(() => setPhoneCopied(false), 2500)
    }
  }

  // Open the customer details modal before generating review
  const handleOpenDetailsModal = () => {
    if (selectedRating < 4) return
    setIsDetailsModalOpen(true)
  }

  // Submit star rating & customer details -> proceeds directly to Draft screen
  const handleConfirmDetailsAndGenerate = async (
    details?: { name: string; phone: string; optIn: boolean } | null
  ) => {
    setIsSubmitting(true)

    try {
      let activeSessionId = sessionId

      // 1. Ensure active session exists
      if (!activeSessionId) {
        const res = await fetch('/api/public/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
        const data = await res.json()
        if (data?.session_id) {
          activeSessionId = data.session_id
          setSessionId(activeSessionId)
        }
      }

      if (activeSessionId) {
        // Start session telemetry
        fetch(`/api/public/sessions/${activeSessionId}/start`, { method: 'POST' }).catch(console.warn)
        trackClientEvent(activeSessionId, 'QUIZ_STARTED')

        // Save overall_rating answer
        await fetch(`/api/public/sessions/${activeSessionId}/answers/overall_rating`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: selectedRating }),
        }).catch(console.warn)

        // Save customer details answers if provided
        if (details?.name) {
          await fetch(`/api/public/sessions/${activeSessionId}/answers/customer_name`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: details.name }),
          }).catch(console.warn)
        }

        if (details?.phone) {
          await fetch(`/api/public/sessions/${activeSessionId}/answers/customer_phone`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: details.phone }),
          }).catch(console.warn)
        }

        if (details) {
          await fetch(`/api/public/sessions/${activeSessionId}/answers/customer_contact`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: details.name || null,
              phone: details.phone || null,
              optIn: details.optIn,
            }),
          }).catch(console.warn)
        }

        // Submit completion
        const submitRes = await fetch(`/api/public/sessions/${activeSessionId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            answers: {
              overall_rating: selectedRating,
              ...(details?.name ? { customer_name: details.name } : {}),
              ...(details?.phone ? { customer_phone: details.phone } : {}),
            },
            customer_name: details?.name || undefined,
            customer_phone: details?.phone || undefined,
          }),
        })

        if (submitRes.ok) {
          trackClientEvent(activeSessionId, 'QUIZ_COMPLETED')
        }
      }

      // Close modal and transition to draft view
      setIsDetailsModalOpen(false)
      setView('draft')
    } catch (err) {
      console.error('Submit error:', err)
      setIsDetailsModalOpen(false)
      setView('draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // VIEW 1: DRAFT SCREEN (UNEDITABLE + GOOGLE)
  // ==========================================
  if (view === 'draft' && sessionId) {
    return (
      <>
        <OfflineBanner hasSyncError={hasSyncError} onRetry={() => setHasSyncError(false)} />
        <ReviewDraftCard
          sessionId={sessionId}
          slug={slug}
          restaurantName={restaurantName}
          googleReviewUrl={googleReviewUrl}
          initialDraftText={initialDraftText || ''}
          onOpenPrivateFeedback={() => setIsPrivateFeedbackOpen(true)}
          onDone={() => setView('thank_you')}
        />

        <PrivateFeedbackModal
          isOpen={isPrivateFeedbackOpen}
          onClose={() => setIsPrivateFeedbackOpen(false)}
          sessionId={sessionId}
          restaurantName={restaurantName}
        />
      </>
    )
  }

  // ==========================================
  // VIEW 2: THANK YOU SCREEN
  // ==========================================
  if (view === 'thank_you') {
    return (
      <>
        <OfflineBanner hasSyncError={hasSyncError} onRetry={() => setHasSyncError(false)} />
        <ThankYouCard restaurantName={restaurantName} slug={slug} />
        <PrivateFeedbackModal
          isOpen={isPrivateFeedbackOpen}
          onClose={() => setIsPrivateFeedbackOpen(false)}
          sessionId={sessionId || ''}
          restaurantName={restaurantName}
        />
      </>
    )
  }

  // ==========================================
  // VIEW 3: SINGLE-STEP STAR RATING INPUT
  // ==========================================
  return (
    <>
      <OfflineBanner hasSyncError={hasSyncError} onRetry={() => setHasSyncError(false)} />
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-2 sm:py-6 px-3 sm:px-0">
        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-[0_20px_60px_-15px_rgba(180,83,9,0.08),0_4px_20px_rgba(0,0,0,0.03)] space-y-5 sm:space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Restaurant Monogram Crest */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-xl shadow-amber-600/25 overflow-hidden border-2 border-amber-200">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={restaurantName} className="w-full h-full object-cover" />
              ) : (
                <Utensils className="w-9 h-9" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs border border-stone-200 text-amber-600">
              <Sparkles className="w-4 h-4 fill-amber-400" />
            </div>
          </div>

          {/* Restaurant Name */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              {restaurantName || 'Motu Seth Restaurant'}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-amber-800">
              A Unit Of Muskan Brothers Hospitality
            </p>
            <p className="text-[11px] font-medium text-stone-600">
              मोटू सेठ रेस्टोरेंट • बेली रोड, पटना
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-stone-500">
              <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 4.9 • Authentic Dining
              </span>
              <span className="text-[11px] text-stone-600 font-medium">
                4th Floor, Ishwar Arcade, Service Rd, Bailey Rd, near Raj Palace, S. K. Puram, Danapur, Patna, Bihar 801503
              </span>
            </div>

            {/* Official Registration Badges (GSTIN & FSSAI) */}
            <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-stone-400 font-mono tracking-tight">
              <span className="bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                GST: 10ABCFM1572E1ZW
              </span>
              <span className="bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                FSSAI: 10421000000533
              </span>
            </div>
          </div>

          {/* Star Rating Question Box */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 border border-amber-200/80 shadow-xs">
            <StarRatingQuestion
              value={selectedRating}
              restaurantName={restaurantName}
              onChange={(val) => {
                if (val >= 4) {
                  setSelectedRating(val)
                }
              }}
            />

            {/* Generate Review Button */}
            <div className="pt-5">
              <button
                type="button"
                onClick={handleOpenDetailsModal}
                disabled={isSubmitting || !selectedRating || selectedRating < 4}
                className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-600/25 group transition-all duration-200 cursor-pointer text-sm sm:text-base active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Review Draft...
                  </>
                ) : (
                  <>
                    <span>Generate Review for Google</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-stone-400 mt-2">
                Generates a personalized review ready to share on Google Reviews
              </p>
            </div>
          </div>

          {/* Prominent Helpline Box */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-wider text-amber-950 uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                Restaurant Helpline &amp; Reservations
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/70">
                Direct Helpline
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-stone-200 shadow-2xs">
              <a
                href="tel:7631996611"
                className="flex items-center gap-2.5 text-stone-900 hover:text-amber-800 transition-colors flex-1"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold tracking-wide text-stone-900 block leading-tight">
                    +91 76319 96611
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold block">
                    Tap to call Motu Seth Restaurant directly
                  </span>
                </div>
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-stone-200"
                title="Copy number"
              >
                {phoneCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Address Pill */}
          <div className="p-3 rounded-2xl bg-stone-50/90 border border-stone-200/90 text-left space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>4th Floor, Ishwar Arcade, Service Rd, Bailey Rd</span>
            </div>
            <p className="text-[11px] text-stone-600 pl-5 leading-relaxed">
              near Raj Palace, S. K. Puram, Danapur, Patna, Bihar 801503, India
            </p>
          </div>
        </div>
      </main>

      {/* Customer Details Modal (Mandatory Name & Phone before review generation) */}
      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        restaurantName={restaurantName}
        isSubmitting={isSubmitting}
        onSubmit={(details) => handleConfirmDetailsAndGenerate(details)}
      />
    </>
  )
}
