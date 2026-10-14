import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionAnswers, saveAnswer, recordEvent } from '@/lib/firebase/db'
import { getFirestoreDb } from '@/lib/firebase/admin'
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

    // 1. Fetch session from Firestore
    const session = await getSession(id)

    if (!session) {
      console.warn(`[Submit] Session ${id} not found`)
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 })
    }

    // 2. Idempotent check: if already completed, return success immediately
    if (session.status === 'completed') {
      return NextResponse.json(
        { success: true, status: 'completed', message: 'Session already completed' },
        { status: 200 }
      )
    }

    // 3. Fetch stored answers from Firestore
    const storedAnswers = await getSessionAnswers(id)
    const answerMap = new Map<string, any>(Object.entries(storedAnswers))

    // Merge answers provided in submit payload
    for (const [k, v] of Object.entries(providedAnswers)) {
      if (v !== undefined && v !== null && !answerMap.has(k)) {
        answerMap.set(k, v)
      }
    }

    // 4. Validate required core questions: overall_rating, food_rating, service_rating
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

    // 5. Save any provided answers to Firestore
    for (const [k, v] of Object.entries(providedAnswers)) {
      if (v !== undefined && v !== null) {
        await saveAnswer(id, k, v, session.business_id)
      }
    }

    const now = new Date().toISOString()
    const db = getFirestoreDb()

    // 6. Mark session as completed in Firestore
    await db.collection('sessions').doc(id).set(
      {
        status: 'completed',
        completed_at: now,
        last_activity_at: now,
      },
      { merge: true }
    )

    // 7. Fire QUIZ_COMPLETED event in Firestore
    await recordEvent({
      session_id: id,
      business_id: session.business_id,
      campaign_id: session.campaign_id,
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
