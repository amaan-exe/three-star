'use client'

import React, { useState } from 'react'
import {
  User,
  Phone,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Gift,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface CustomerDetailsModalProps {
  isOpen: boolean
  restaurantName: string
  isSubmitting: boolean
  onSubmit: (details: { name: string; phone: string; optIn: boolean }) => void
}

export default function CustomerDetailsModal({
  isOpen,
  restaurantName = 'Motu Seth Restaurant',
  isSubmitting,
  onSubmit,
}: CustomerDetailsModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [optIn, setOptIn] = useState(true)
  const [nameError, setNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePhoneChange = (val: string) => {
    // Keep only digits and limit to 10
    const digits = val.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
    if (phoneError && digits.length === 10) {
      setPhoneError(null)
    }
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (nameError && val.trim().length > 0) {
      setNameError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let hasError = false

    // Name is mandatory
    if (!name.trim()) {
      setNameError('Please enter your full name')
      hasError = true
    } else {
      setNameError(null)
    }

    // Phone is mandatory (10 digits)
    const cleanDigits = phone.replace(/\D/g, '')
    if (!cleanDigits || cleanDigits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number')
      hasError = true
    } else {
      setPhoneError(null)
    }

    if (hasError) return

    onSubmit({
      name: name.trim(),
      phone: cleanDigits,
      optIn,
    })
  }

  const isValid = name.trim().length > 0 && phone.replace(/\D/g, '').length === 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl p-5 sm:p-7 relative space-y-4 animate-in zoom-in-95 duration-200 text-stone-900 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-details-title"
      >
        {/* Decorative top amber bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500" />

        {/* Header Icon + Perks Badge */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-600/30 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                Diner Privileges &amp; Rewards
              </span>
            </div>
            <h2 id="customer-details-title" className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight mt-0.5 leading-snug">
              Personalize Your Review
            </h2>
          </div>
        </div>

        {/* Explanatory Banner */}
        <p className="text-xs text-stone-600 leading-relaxed">
          Please enter your name and contact number below to generate your Google review and record your verified diner privileges for <strong className="text-stone-900 font-bold">{restaurantName}</strong>.
        </p>

        {/* Mandatory Details Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Full Name */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="cust-name" className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Your Name <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                Required
              </span>
            </label>
            <div className="relative">
              <input
                id="cust-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isSubmitting}
                required
                className={`w-full h-11 px-3.5 rounded-xl border ${
                  nameError ? 'border-rose-400 focus:ring-rose-400/20' : 'border-stone-300 focus:border-amber-500 focus:ring-amber-500/20'
                } focus:ring-2 text-stone-900 placeholder:text-stone-400 text-sm outline-none transition-all`}
              />
            </div>
            {nameError && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{nameError}</span>
              </p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="cust-phone" className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span>Mobile Number / WhatsApp <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-amber-800 bg-amber-100/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Required
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="h-11 px-3 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 text-xs font-bold flex items-center gap-1 select-none shrink-0">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                id="cust-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={isSubmitting}
                required
                className={`w-full h-11 px-3.5 rounded-xl border ${
                  phoneError ? 'border-rose-400 focus:ring-rose-400/20' : 'border-stone-300 focus:border-amber-500 focus:ring-amber-500/20'
                } focus:ring-2 text-stone-900 placeholder:text-stone-400 text-sm outline-none transition-all font-mono tracking-wide`}
              />
            </div>
            {phoneError ? (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{phoneError}</span>
              </p>
            ) : (
              <p className="text-[11px] text-stone-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Used for verified diner discounts &amp; order updates.</span>
              </p>
            )}
          </div>

          {/* WhatsApp / SMS opt-in */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none text-left">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-stone-600 leading-tight">
              Receive special biryani, handi offers &amp; dining privileges on WhatsApp
            </span>
          </label>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving &amp; Preparing Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>Generate Review for Google</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* Privacy reassurance */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>100% Privacy Protected • Stored Securely in Admin</span>
          </div>
        </form>
      </div>
    </div>
  )
}
