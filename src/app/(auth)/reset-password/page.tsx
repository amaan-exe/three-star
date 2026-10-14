'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Mail,
  Utensils,
  Lock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Resend state if link expired
  const [resendUsername, setResendUsername] = useState('admin')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const supabase = createClient()

  // Calculate password strength
  const calculateStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 8) score += 1
    if (pass.length >= 12) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1
    return score
  }

  const strengthScore = calculateStrength(password)
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-slate-700', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500']

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check search params
    const qErrorCode = searchParams.get('error_code')
    const qErrorDesc = searchParams.get('error_description')

    // 2. Check hash fragments (Supabase auth redirects frequently land in hash)
    const hashString = window.location.hash.replace(/^#/, '')
    const hashParams = new URLSearchParams(hashString)
    const hErrorCode = hashParams.get('error_code')
    const hErrorDesc = hashParams.get('error_description')
    const hAccessToken = hashParams.get('access_token')
    const hType = hashParams.get('type')

    if (hAccessToken) {
      setAccessToken(hAccessToken)
    }

    if (qErrorCode === 'otp_expired' || hErrorCode === 'otp_expired') {
      setIsExpired(true)
      setError('This password reset link is invalid or has expired. Links can expire if clicked late or if scanned by email security bots.')
      return
    }

    if (qErrorDesc || hErrorDesc) {
      const raw = qErrorDesc || hErrorDesc || ''
      setIsExpired(true)
      setError(decodeURIComponent(raw.replace(/\+/g, ' ')))
      return
    }

    // 3. Listen to Supabase auth events (e.g. PASSWORD_RECOVERY)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsExpired(false)
        if (session?.access_token) {
          setAccessToken(session.access_token)
        }
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [searchParams, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.')
      return
    }

    setLoading(true)

    try {
      // 1. Try our server endpoint with session/access token
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: password,
          accessToken: accessToken || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Fallback: try client-side Supabase update
        const { error: clientError } = await supabase.auth.updateUser({
          password,
        })

        if (clientError) {
          throw new Error(data.error || clientError.message || 'Failed to update password.')
        }
      }

      setSuccess('Password updated successfully! Redirecting to dashboard...')
      setLoading(false)

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Your reset session may have expired.')
      setLoading(false)
    }
  }

  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendLoading(true)
    setResendMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resendUsername.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Failed to send new reset link.')
        setResendLoading(false)
        return
      }

      setResendMessage(data.message || 'Fresh password reset link sent! Please check your email inbox.')
      setResendLoading(false)
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please try again.')
      setResendLoading(false)
    }
  }

  return (
    <Card className="border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100 rounded-3xl overflow-hidden">
      {/* Decorative gradient header accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600" />

      <CardHeader className="space-y-1.5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Residence Inn Admin Security
          </span>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-500" />
          {isExpired ? 'Reset Link Expired' : 'Set New Password'}
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          {isExpired
            ? 'The email reset link you opened is invalid or expired. Request a new one below.'
            : 'Enter and confirm your new secure password below to regain full account access.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {resendMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{resendMessage}</span>
          </div>
        )}



        {isExpired ? (
          /* Expired Link Recovery Form */
          <form onSubmit={handleResendLink} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="resend-user" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                Restaurant Username or Email
              </Label>
              <Input
                id="resend-user"
                type="text"
                placeholder="admin or owner@pmzaika.com"
                value={resendUsername}
                onChange={(e) => setResendUsername(e.target.value)}
                required
                disabled={resendLoading}
                className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl text-xs focus-visible:ring-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={resendLoading || !resendUsername.trim()}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-600/20 active:scale-95 transition cursor-pointer"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Fresh Link...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Send Fresh Reset Link
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Set New Password Form */
          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 pr-9 rounded-xl text-xs focus-visible:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Strength:</span>
                    <span
                      className={`font-semibold ${
                        strengthScore <= 1
                          ? 'text-rose-400'
                          : strengthScore <= 2
                          ? 'text-amber-400'
                          : strengthScore === 3
                          ? 'text-sky-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {strengthLabels[strengthScore]}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full h-full transition-all duration-200 ${
                          strengthScore >= step ? strengthColors[strengthScore] : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Confirm New Password
                </Label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-1 ${
                      password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Match
                      </>
                    ) : (
                      'No match'
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-type your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 pr-9 rounded-xl text-xs focus-visible:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-600/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Save Password & Enter Dashboard'
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="pt-1 pb-4 flex items-center justify-between border-t border-slate-800/80 bg-slate-950/50 text-xs">
        <Link
          href="/login"
          className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px]"
        >
          &larr; Back to Login
        </Link>
        <span className="text-slate-600 text-[10px]">Residence Inn</span>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8 text-slate-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading reset session...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
