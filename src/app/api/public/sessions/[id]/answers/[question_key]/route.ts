import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const supabase = createAdminClient()

    // 2. Verify session exists and is not completed
    const { data: session } = await supabase
      .from('sessions')
      .select('id, business_id, status')
      .eq('id', id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session is already completed and answers cannot be modified' },
        { status: 400 }
      )
    }

    // 3. Find question_id for this business and key
    let { data: question } = await supabase
      .from('questions')
      .select('id')
      .eq('business_id', session.business_id)
      .eq('key', question_key)
      .single()

    // If question not found (e.g. default questions not seeded yet), seed or find
    if (!question) {
      const { data: newQ } = await supabase
        .from('questions')
        .insert({
          business_id: session.business_id,
          key: question_key,
          type: question_key.includes('rating') ? 'rating' : 'text',
          text: { en: question_key },
          position: 1,
        })
        .select('id')
        .single()
      question = newQ
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 4. Upsert answer
    const answerValue = validation.data.value !== undefined ? validation.data.value : validation.data

    if (question_key === 'overall_rating' && typeof answerValue === 'number' && answerValue < 4) {
      return NextResponse.json(
        { error: 'Rating of 4 or 5 stars required' },
        { status: 400 }
      )
    }

    const { error: answerError } = await supabase.from('answers').upsert(
      {
        session_id: id,
        question_id: question.id,
        question_key,
        value: answerValue,
      },
      { onConflict: 'session_id,question_id' }
    )

    if (answerError) {
      console.error('Answer upsert error:', answerError)
      return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 })
    }

    // 5. Update last activity timestamp on session
    await supabase
      .from('sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', id)

    // 6. Record QUESTION_ANSWERED event
    await supabase.from('events').insert({
      session_id: id,
      business_id: session.business_id,
      event_type: 'QUESTION_ANSWERED',
      metadata: { question_key, value: answerValue },
    })

    return NextResponse.json({ success: true, question_key }, { status: 200 })
  } catch (error) {
    console.error('Save answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
