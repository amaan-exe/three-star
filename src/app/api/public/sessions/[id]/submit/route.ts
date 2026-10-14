import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionFromCookie } from '@/lib/session/cookie'
import { ratingSchema } from '@/lib/validation/schemas'
import { logEvent } from '@/lib/observability/logger'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const startTime = Date.now()
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const providedAnswers = body?.answers || {}

    const supabase = createAdminClient()

    // 1. Fetch session from database
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, business_id, status, completed_at')
      .eq('id', id)
      .maybeSingle()

    if (sessionError || !session) {
      console.warn(`[Submit] Session ${id} not found:`, sessionError)
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 })
    }

    // 2. Validate session cookie (or permit if valid session exists in DB)
    const cookie = await getSessionFromCookie()
    if (cookie && cookie.session_id !== id) {
      console.warn(`[Submit] Cookie mismatch for session ${id} vs cookie ${cookie.session_id}`)
      // Still permit if session is active in database for this device
    }

    // 3. Idempotent check: if already completed, return success immediately
    if (session.status === 'completed') {
      return NextResponse.json(
        { success: true, status: 'completed', message: 'Session already completed' },
        { status: 200 }
      )
    }

    // 4. Fetch stored answers for this session
    const { data: storedAnswers } = await supabase
      .from('answers')
      .select('question_key, value')
      .eq('session_id', id)

    const answerMap = new Map<string, any>(
      (storedAnswers || []).map((a) => [a.question_key, a.value])
    )

    // Merge answers provided in submit payload (ensures fast one-shot completion without race conditions)
    for (const [k, v] of Object.entries(providedAnswers)) {
      if (v !== undefined && v !== null && !answerMap.has(k)) {
        answerMap.set(k, v)
      }
    }

    // 5. Validate required core questions: overall_rating, food_rating, service_rating
    const requiredKeys = ['overall_rating', 'food_rating', 'service_rating']
    const missing: string[] = []

    for (const key of requiredKeys) {
      const val = answerMap.get(key)
      const parsed = ratingSchema.safeParse(val)
      if (!parsed.success) {
        missing.push(key)
      }
    }

    if (missing.length > 0) {
      console.warn(`[Submit] Missing required questions for session ${id}:`, missing)
      return NextResponse.json(
        {
          error: 'Required ratings missing or invalid',
          missing_questions: missing,
        },
        { status: 400 }
      )
    }

    const overallRatingVal = answerMap.get('overall_rating')
    if (typeof overallRatingVal === 'number' && overallRatingVal < 4) {
      return NextResponse.json(
        {
          error: 'Residence Inn feedback requires a minimum rating of 4 or 5 stars',
          invalid_question: 'overall_rating',
        },
        { status: 400 }
      )
    }

    // 6. Save any provided answers that were not yet in the DB
    if (Object.keys(providedAnswers).length > 0) {
      try {
        const { data: questions } = await supabase
          .from('questions')
          .select('id, key')
          .eq('business_id', session.business_id)

        const qMap = new Map((questions || []).map((q) => [q.key, q.id]))

        const toInsert: Array<{ session_id: string; question_id: string; question_key: string; value: any }> = []
        for (const [k, v] of Object.entries(providedAnswers)) {
          if (v !== undefined && v !== null) {
            let qId = qMap.get(k)
            if (qId) {
              toInsert.push({
                session_id: id,
                question_id: qId,
                question_key: k,
                value: v,
              })
            }
          }
        }

        if (toInsert.length > 0) {
          await supabase.from('answers').upsert(toInsert, { onConflict: 'session_id,question_id' })
        }
      } catch (err) {
        console.warn('[Submit] Answers bulk upsert warning:', err)
      }
    }

    const now = new Date().toISOString()

    // 7. Mark session as completed
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: now,
        last_activity_at: now,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[Submit] Failed to update session status:', updateError)
      return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
    }

    // 8. Fire QUIZ_COMPLETED event
    await supabase.from('events').insert({
      session_id: id,
      business_id: session.business_id,
      event_type: 'QUIZ_COMPLETED',
      metadata: {
        total_answers: answerMap.size,
        overall_rating: answerMap.get('overall_rating'),
      },
    })

    logEvent({
      sessionId: id,
      businessId: session.business_id,
      action: 'QUIZ_COMPLETED',
      latencyMs: Date.now() - startTime,
      metadata: { total_answers: answerMap.size },
    })

    return NextResponse.json({ success: true, status: 'completed' }, { status: 200 })
  } catch (error) {
    console.error('Submit session error:', error)
    logEvent({
      level: 'error',
      action: 'QUIZ_SUBMIT_FAILED',
      latencyMs: Date.now() - startTime,
      metadata: { error: String(error) },
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
