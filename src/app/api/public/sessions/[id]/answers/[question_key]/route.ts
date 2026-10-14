import { NextRequest, NextResponse } from 'next/server'
import { getSession, saveAnswer, recordEvent } from '@/lib/firebase/db'
import { getSessionFromCookie } from '@/lib/session/cookie'
import {
  overallRatingSchema,
  foodRatingSchema,
  serviceRatingSchema,
  likedSchema,
  orderedSchema,
  commentSchema,
  returnIntentSchema,
} from '@/lib/validation/schemas'

interface RouteProps {
  params: Promise<{ id: string; question_key: string }>
}

function validateAnswer(key: string, body: any) {
  switch (key) {
    case 'overall_rating':
      return overallRatingSchema.safeParse(body)
    case 'food_rating':
      return foodRatingSchema.safeParse(body)
    case 'service_rating':
      return serviceRatingSchema.safeParse(body)
    case 'liked':
      return likedSchema.safeParse(body)
    case 'ordered':
      return orderedSchema.safeParse(body)
    case 'comment':
      return commentSchema.safeParse(body)
    case 'return_intent':
      return returnIntentSchema.safeParse(body)
    default:
      // Custom questions accept primitive string or number or array
      return { success: true, data: body } as const
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const { id, question_key } = await params

    // 1. Verify session cookie
    const cookie = await getSessionFromCookie()
    if (!cookie || cookie.session_id !== id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateAnswer(question_key, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid answer value', details: (validation as any).error.flatten() },
        { status: 400 }
      )
    }

    // 2. Verify session exists in Firestore and is not completed
    const session = await getSession(id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session is already completed and answers cannot be modified' },
        { status: 400 }
      )
    }

    // 3. Extract value
    const answerValue = validation.data.value !== undefined ? validation.data.value : validation.data

    // Mandatory rule: Rating must be 4 or 5 stars for all core rating questions
    if (
      ['overall_rating', 'food_rating', 'service_rating'].includes(question_key) &&
      typeof answerValue === 'number' &&
      answerValue < 4
    ) {
      return NextResponse.json(
        { error: 'Rating of 4 or 5 stars required' },
        { status: 400 }
      )
    }

    // 4. Save answer to Firestore
    await saveAnswer(id, question_key, answerValue, session.business_id)

    // 5. Record QUESTION_ANSWERED event
    await recordEvent({
      session_id: id,
      business_id: session.business_id,
      campaign_id: session.campaign_id,
      event_type: 'QUESTION_ANSWERED',
      metadata: { question_key, value: answerValue },
    })

    return NextResponse.json({ success: true, question_key }, { status: 200 })
  } catch (error) {
    console.error('Save answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
